import { dbPool } from '@/lib/db';
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";


export async function POST(req: Request) {
  try {
    const data = await req.json();
    let query = `SELECT * FROM public.get_swipescreen_attendees($1, $2, $3)`;
    const swipeResults = await dbPool.query(query, [
      data.loginid,
      data.targetid,
      data.eventid,
    ]);
    return NextResponse.json({
      swipes: swipeResults.rows,
    });
  } catch (error) {
    console.error("Database query failed:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
