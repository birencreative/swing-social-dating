import { dbPool } from '@/lib/db';
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";


export async function POST(req: any) {
  const { profile, token } = await req.json();

  try {
    const result = await dbPool.query(
      "SELECT * FROM public.web_insert_devicetoken($1, $2)",
      [profile?.profileId, token]
    );

    return NextResponse.json({
      message: "Device Token updated",
      data: result.rows,
    });
  } catch (error: any) {
    console.error("Error:", error);

    return NextResponse.json(
      {
        message: "Chat conversation insertion failed",
        error: error.message,
      },
      { status: 400 }
    );
  }
}
