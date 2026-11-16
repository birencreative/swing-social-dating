import { dbPool } from '@/lib/db';
import { NextResponse } from "next/server";


export async function POST(req: Request) {
  try {
    const { code } = await req.json();
    const client = await dbPool.connect();

    const result = await client.query(
      `SELECT * FROM check_affiliate_code($1)`,
      [code]
    );

    client.release();

    const row = result.rows[0];
    return NextResponse.json({
      valid: row.is_valid,
      message: row.message,
      code: row.affiliate_code,
      profile_id: row.profile_id,
    });
  } catch (err: any) {
    console.error("Affiliate API error:", err);
    return NextResponse.json(
      { valid: false, message: "Server error", error: err.message },
      { status: 500 }
    );
  }
}
