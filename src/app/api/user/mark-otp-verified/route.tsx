import { dbPool } from '@/lib/db';
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";


export async function POST(req: Request) {
  try {
    const { profileId } = await req.json();

    if (!profileId) {
      return NextResponse.json(
        { success: false, message: "profileId is required" },
        { status: 400 }
      );
    }

    const result = await dbPool.query(
      `SELECT "EmailVerified" FROM "UserProfiles" WHERE "Id" = $1`,
      [profileId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const emailVerified = result.rows[0].EmailVerified;

    return NextResponse.json({ success: true, emailVerified });
  } catch (error) {
    console.error("Database query failed:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}