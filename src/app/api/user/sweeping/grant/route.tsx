import { dbPool } from '@/lib/db';
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";


export async function POST(req: any) {
  const { profileid, targetid } = await req.json();
  try {
    const result = await dbPool.query(
      "select * from public.block_unblock_profile($1,$2)",
      [profileid, targetid]
    );

    return NextResponse.json({
      message: "User Access Granted successfully",
      data: result?.rows,
    });
  } catch (error: any) {
    console.log(error);
    return NextResponse.json(
      {
        message: "User Access Grant failed",
      },
      { status: 400 }
    );
  }
}
