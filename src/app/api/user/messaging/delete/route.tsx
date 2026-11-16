import { dbPool } from '@/lib/db';
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: any) {
  try {
    const bodyData = await req.json();
    const messageId = bodyData.messageId || bodyData.ConversationId || bodyData.id;
    const fromId = bodyData.fromId || bodyData.MemberIdFrom || bodyData.profileId;
    const toId = bodyData.toId || bodyData.MemberIdTo || bodyData.otherUserId;

    if (!fromId) {
      return NextResponse.json(
        { message: "fromId is required" },
        { status: 400 }
      );
    }

    const tempId = bodyData.tempId;
    const targetId = (messageId && !String(messageId).startsWith("temp-")) ? messageId : (tempId && !String(tempId).startsWith("temp-") ? tempId : null);

    let result;
    if (targetId) {
      result = await dbPool.query(
        `UPDATE "ChatMessages"
         SET "Conversation" = 'This message was deleted'
         WHERE "Id"::text = $1
         AND "MemberIdFrom"::text = $2
         RETURNING *`,
        [String(targetId), String(fromId)]
      );
    }

    // Safe Fallback: Only if target ID was temp- or missing, update recent message sent in last 2 minutes
    if (!result || result.rowCount === 0) {
      if ((messageId && String(messageId).startsWith("temp-")) || (tempId && String(tempId).startsWith("temp-"))) {
        result = await dbPool.query(
          `UPDATE "ChatMessages"
           SET "Conversation" = 'This message was deleted'
           WHERE "Id" = (
             SELECT "Id" FROM "ChatMessages"
             WHERE "MemberIdFrom"::text = $1
             ${toId ? 'AND "MemberIdTo"::text = $2' : ''}
             AND "CreatedAt" >= NOW() - INTERVAL '2 minutes'
             ORDER BY "CreatedAt" DESC
             LIMIT 1
           )
           RETURNING *`,
          toId ? [String(fromId), String(toId)] : [String(fromId)]
        );
      }
    }

    return NextResponse.json({
      message: "Message deleted successfully",
      success: true,
      deletedCount: result?.rowCount || 0,
    });
  } catch (error: any) {
    console.error("Error deleting message:", error);
    return NextResponse.json(
      { message: "Failed to delete message", error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: any) {
  return POST(req);
}
