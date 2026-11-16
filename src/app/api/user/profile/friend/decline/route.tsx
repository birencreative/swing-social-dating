import { dbPool } from '@/lib/db';
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";


export async function POST(req: any) {
  const { fromId, toId, Id } = await req.json();

  try {
    const deleteResult = await dbPool.query(
      "select * From mail_delete_message($1)",
      [Id]
    );
    if (!deleteResult.rows.length) {
      throw new Error("Failed to delete message");
    }

    return NextResponse.json({
      message: "Friend Request Declined Successfully",
      data: deleteResult,
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
