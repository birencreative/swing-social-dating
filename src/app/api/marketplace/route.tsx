import { dbPool } from '@/lib/db';
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";


export async function GET(req: Request) {
  try {
    const getQuery = `SELECT * FROM market_get_products()`;

    const result = await dbPool.query(getQuery);

    // Return the response here
    return NextResponse.json({
      message: "Get the result successfully!",
      products: result?.rows || [],
    });
  } catch (error: any) {
    console.error("Error fetching marketplace products:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error", products: [] },
      { status: 500 }
    );
  }
}
