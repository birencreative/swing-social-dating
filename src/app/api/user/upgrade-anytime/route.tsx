import { dbPool } from '@/lib/db';
import { NextResponse } from "next/server";


export async function POST(req: Request) {
  let client;
  try {
    const { profileId } = await req.json();

    if (!profileId) {
      return NextResponse.json(
        { success: false, error: "profileId is required" },
        { status: 400 }
      );
    }

    client = await dbPool.connect();
    const result = await client.query(
      `SELECT * FROM public.process_referral_upgrade_anytime($1::uuid)`,
      [profileId]
    );

    if (!result || result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: "No response from DB" },
        { status: 500 }
      );
    }

    const row = result.rows[0];
    return NextResponse.json({ success: true, referral: row }, { status: 200 });
  } catch (err: any) {
    console.error("check-referral error:", err);
    return NextResponse.json(
      { success: false, error: "Server error: " + (err?.message ?? err) },
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}
