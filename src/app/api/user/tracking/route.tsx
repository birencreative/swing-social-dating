import { dbPool } from '@/lib/db';
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

export async function POST(req: any) {
  try {
    const {
      affiliate,
      referral,
      OS,
      page,
      url,
      userid,
      ip,
      city,
      region,
      country_name,
    } = await req.json();
    const result = await dbPool.query(
      "SELECT * FROM public.hit_insert_1($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
      [
        affiliate,
        referral,
        OS,
        page,
        url,
        userid,
        ip,
        city,
        region,
        country_name,
      ]
    );
    return NextResponse.json({
      message: "Tracking data stored successfully",
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error("Tracking error:", error);
    return NextResponse.json(
      { message: "Failed to store tracking data" },
      { status: 400 }
    );
  }
}
