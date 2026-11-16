import { dbPool } from '@/lib/db';
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";


export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    console.log("userId", userId);

    if (!userId) {
      return NextResponse.json(
        { ok: false, message: "UserId is required" },
        { status: 400 }
      );
    }

    const result = await dbPool.query(
      "SELECT * FROM public.update_selfie_verification_status($1)",
      [userId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { ok: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Selfie verification badge updated",
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error("Update badge error:", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Failed to update selfie verification badge",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
