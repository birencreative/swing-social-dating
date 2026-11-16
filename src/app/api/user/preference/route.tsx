import { dbPool } from '@/lib/db';
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";


export async function POST(req: any) {
  const { id } = await req.json();

  try {
    const result = await dbPool.query(
      "select * from public.get_preferences($1)",
      [id],
    );

    return NextResponse.json({
      message: "Prefrences found Successfully",
      data: result?.rows,
    });
  } catch (error: any) {
    console.error("=== GET PREFERENCES ERROR ===");
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
    console.error("Error detail:", error.detail);
    console.error("Error hint:", error.hint);
    console.error("Error position:", error.position);
    console.error("Error stack:", error.stack);
    console.error("Full error object:", JSON.stringify(error, null, 2));
    console.error("Input ID:", id);
    console.error("============================");

    return NextResponse.json(
      {
        message: "Relationship Category Update failed",
        error: error.message,
        errorCode: error.code,
        errorDetail: error.detail,
        errorHint: error.hint,
      },
      { status: 400 },
    );
  }
}
