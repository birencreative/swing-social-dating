import { dbPool } from '@/lib/db';
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";


export async function POST(req: any) {
  const { id, status } = await req.json();

  try {
    const result = await dbPool.query(
      "SELECT * FROM public.web_update_emailstatus($1, $2)",
      [id, status],
    );

    return NextResponse.json({
      message: "Mobile number verified successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        message: "User Name Update failed",
      },
      { status: 400 },
    );
  }
}
