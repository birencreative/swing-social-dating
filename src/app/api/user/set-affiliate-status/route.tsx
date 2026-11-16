import { dbPool } from '@/lib/db';
import { NextResponse } from "next/server";


export async function POST(req: Request) {
  try {
    const { user_id } = await req.json();

    if (!user_id) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 }
      );
    }

    const sql = `SELECT public.set_affiliate_form_status_true($1::uuid) AS result;`;

    const { rows } = await dbPool.query(sql, [user_id]);

    return NextResponse.json(rows[0].result);
  } catch (err) {
    console.error("set-affiliate-status error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
