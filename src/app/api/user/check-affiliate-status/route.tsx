import { dbPool } from '@/lib/db';
import { NextResponse } from "next/server";


export async function POST(req: Request) {
  try {
    const { user_id } = await req.json();
    const client = await dbPool.connect();

    const query = `SELECT check_affiliate_form_status($1::uuid) AS affiliate_status;`;
    const result = await client.query(query, [user_id]);
    client.release();

    const status = result.rows[0]?.affiliate_status;

    return NextResponse.json({
      success: true,
      check_affiliate_form_status: status,
    });
  } catch (err) {
    console.error("check-affiliate-status error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
