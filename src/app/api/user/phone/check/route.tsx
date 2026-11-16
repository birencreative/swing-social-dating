import { dbPool } from '@/lib/db';
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { search, excludeProfileId } = await req.json();
    if (!search) {
      return NextResponse.json(
        { exists: false, message: 'Phone number is required.' },
        { status: 400 }
      );
    }

    // Bypass check for specified test/whitelisted numbers
    const cleanedSearch = search.replace(/\D/g, '');
    const skippedNumbers = ['8452248175', '8453379222', '8456334948', '2408896118'];
    const isSkipped = skippedNumbers.some(num => cleanedSearch === num || cleanedSearch === `1${num}`);

    if (isSkipped) {
      console.log(`Skipping phone check for whitelisted number: ${search}`);
      return NextResponse.json({ exists: false });
    }

    console.log('Checking if Phone exists:', search, 'excluding profile:', excludeProfileId);

    // Query to check if the phone number exists in the Users table
    let query = `
        SELECT COUNT(*) AS count 
        FROM "Users"
        WHERE "Phone" = $1
      `;
    const values = [search.trim()];

    if (excludeProfileId) {
      query += ` AND "Id" NOT IN (SELECT "UserId" FROM "UserProfiles" WHERE "Id" = $2)`;
      values.push(excludeProfileId);
    }

    // Execute the query
    const result = await dbPool.query(query, values);
    const exists = parseInt(result.rows[0]?.count, 10) > 0;

    console.log(`Phone "${search}" exists:`, exists);

    return NextResponse.json({ exists });
  } catch (error) {
    console.error('Database query failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
