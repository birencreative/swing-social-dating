import { dbPool } from '@/lib/db';
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";


export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const userId = searchParams.get("id");

    let query = `SELECT * FROM get_pineapplelist($1)`;

    const values: any[] = [userId];

    const pineapples = await dbPool.query(query, values);

    return NextResponse.json({
      pineapples: pineapples.rows,
    });
  } catch (error) {
    console.error("Database query failed:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}