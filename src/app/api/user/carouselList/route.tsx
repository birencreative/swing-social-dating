import { dbPool } from '@/lib/db';
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";


export async function GET(req: Request) {
  try {
    const getQuery = `SELECT * FROM registration_get_carousel()`;

    const result = await dbPool.query(getQuery);

    if (result.rows[0] == null) {
      throw new Error(`We faced some error while getting the data`);
    }

    return NextResponse.json({
      message: "Get the result successfully!",
      products: result.rows,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
