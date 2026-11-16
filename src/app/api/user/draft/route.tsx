import { dbPool } from '@/lib/db';
import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

let tableEnsured = false;

async function ensureTableExists() {
  if (tableEnsured) return;
  try {
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS public."RegistrationDrafts" (
        "SessionId" UUID PRIMARY KEY,
        "DraftData" JSONB NOT NULL,
        "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "UpdatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    tableEnsured = true;
  } catch (error) {
    console.error('Error ensuring RegistrationDrafts table exists:', error);
  }
}

export async function GET() {
  try {
    await ensureTableExists();
    const cookieStore = await cookies();
    const reqHeaders = await headers();
    
    // 1. Check for temporary draft session first (preserves plaintext password, countryCode, etc.)
    const sessionId = cookieStore.get('registration_draft_session')?.value || reqHeaders.get('x-draft-session-id');
    if (sessionId) {
      const query = `SELECT "DraftData" FROM public."RegistrationDrafts" WHERE "SessionId" = $1`;
      const result = await dbPool.query(query, [sessionId]);
      if (result.rowCount && result.rowCount > 0) {
        return NextResponse.json({ draft: result.rows[0].DraftData });
      }
    }

    // 2. Fallback to registered profile ID (if draft session expired/deleted)
    const profileId = cookieStore.get('register_profile_id')?.value || reqHeaders.get('x-register-profile-id');
    if (profileId) {
      console.log('Fetching draft data for registered profile ID:', profileId);
      const query = `
        SELECT 
          u."Email" AS "email",
          TRIM(CONCAT(u."FirstName", ' ', u."LastName")) AS "userName",
          u."Phone" AS "phone",
          up."Username" AS "user_name",
          up."Location" AS "city"
        FROM "UserProfiles" up
        JOIN "Users" u ON up."UserId" = u."Id"
        WHERE up."Id" = $1
      `;
      const result = await dbPool.query(query, [profileId]);
      if (result.rowCount && result.rowCount > 0) {
        const row = result.rows[0];
        return NextResponse.json({
          draft: {
            userName: row.userName || '',
            email: row.email || '',
            phone: row.phone || '',
            city: row.city || '',
            user_name: row.user_name || '',
            countryCode: '',
            password: '',
            repeatPassword: '',
            consent: true,
            isAdult: true,
            referral_code: '',
          }
        });
      }
    }

    return NextResponse.json({ draft: null });
  } catch (error: any) {
    console.error('Error in GET /api/user/draft:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await ensureTableExists();
    const body = await req.json();
    const cookieStore = await cookies();
    const reqHeaders = await headers();

    let sessionId = cookieStore.get('registration_draft_session')?.value || reqHeaders.get('x-draft-session-id');
    
    // Create new session if doesn't exist
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      cookieStore.set('registration_draft_session', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 1 week
      });
    }

    // Upsert the draft
    const query = `
      INSERT INTO public."RegistrationDrafts" ("SessionId", "DraftData", "UpdatedAt")
      VALUES ($1, $2, NOW())
      ON CONFLICT ("SessionId")
      DO UPDATE SET "DraftData" = EXCLUDED."DraftData", "UpdatedAt" = NOW();
    `;
    await dbPool.query(query, [sessionId, body]);

    return NextResponse.json({ success: true, sessionId });
  } catch (error: any) {
    console.error('Error in PUT /api/user/draft:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await ensureTableExists();
    const cookieStore = await cookies();
    const reqHeaders = await headers();
    const sessionId = cookieStore.get('registration_draft_session')?.value || reqHeaders.get('x-draft-session-id');

    if (sessionId) {
      await dbPool.query(`DELETE FROM public."RegistrationDrafts" WHERE "SessionId" = $1`, [sessionId]);
      cookieStore.delete('registration_draft_session');
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in DELETE /api/user/draft:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
