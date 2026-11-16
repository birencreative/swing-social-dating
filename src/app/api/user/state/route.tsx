import { dbPool } from '@/lib/db';
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";


export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userid = searchParams.get("userid");

    const query = `SELECT * FROM public.web_get_locationbyuserid($1)`;
    const values = [userid];
    const result = await dbPool.query(query, values);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: `No user found with ID ${userid}` },
        { status: 404 }
      );
    }

    return NextResponse.json({ user: result.rows[0] });
  } catch (error) {
    console.error("Database query failed:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
