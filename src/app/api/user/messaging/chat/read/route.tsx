import { dbPool } from '@/lib/db';
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";


export async function POST(req: any) {
  try {
    const { profileId, otherUserId } = await req.json();

    if (!profileId || !otherUserId) {
      return NextResponse.json(
        { message: "Profile IDs are required" },
        { status: 400 }
      );
    }

    try {
      await dbPool.query(
        `UPDATE public.notifications 
         SET is_read = true 
         WHERE user_id = $1 
         AND type = 'message' 
         AND (sender_id = $2 OR url LIKE '%' || $2)
         AND is_read = false`,
        [profileId, otherUserId]
      );
    } catch (e) {
      console.error("Notification update failed:", e);
    }

    try {
      await dbPool.query(
        `UPDATE "ChatMessages"
         SET "Viewed" = 1
         WHERE "MemberIdTo" = $1 AND "MemberIdFrom" = $2 AND "Viewed" = 0`,
        [profileId, otherUserId]
      );
    } catch (e) {
      console.error("ChatMessage update failed:", e);
    }

    return NextResponse.json({
      message: "Messages marked as read successfully",
      success: true,
    });
  } catch (error: any) {
    console.error("Error marking messages as read:", error);
    return NextResponse.json(
      { message: "Failed to mark messages as read", error: error.message },
      { status: 500 }
    );
  }
}
