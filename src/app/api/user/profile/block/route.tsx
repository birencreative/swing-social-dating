import { dbPool } from '@/lib/db';
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";


export async function POST(req: any) {
  const { id, targetId } = await req.json();

  try {
    const result = await dbPool.query(
      "select * from public.block_block_profile($1,$2)",
      [id, targetId]
    );

    return NextResponse.json({
      message: "User Blocked Successfully",
      data: result?.rows,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        message: "Relationship Category Update failed",
      },
      { status: 400 }
    );
  }
}
