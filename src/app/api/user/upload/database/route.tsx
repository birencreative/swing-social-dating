import { dbPool } from '@/lib/db';
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";


export async function POST(req: any) {
  const { pid, avatar, banner, Questionable } = await req.json();
  try {
    const result = await dbPool.query(
      "SELECT * FROM public.web_update_avatar($1, $2, $3, $4)",
      [pid, avatar, banner, Questionable]
    );

    return NextResponse.json({
      message: "Profile created successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        message: "User Name Update failed",
      },
      { status: 400 }
    );
  }
}
