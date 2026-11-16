import { dbPool } from '@/lib/db';
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: any) {
  try {
    const bodyData = await req.json();
    const messageId = bodyData.messageId || bodyData.ConversationId || bodyData.id;
    const fromId = bodyData.fromId || bodyData.MemberIdFrom || bodyData.profileId;
    const toId = bodyData.toId || bodyData.MemberIdTo || bodyData.otherUserId;
    const text = bodyData.text || bodyData.Conversation || bodyData.newText;

    if (!fromId || !text) {
      return NextResponse.json(
        { message: "fromId and text are required" },
        { status: 400 }
      );
    }

    const tempId = bodyData.tempId;
    const targetId = (messageId && !String(messageId).startsWith("temp-")) ? messageId : (tempId && !String(tempId).startsWith("temp-") ? tempId : null);

    let result;
    if (targetId) {
      result = await dbPool.query(
        `UPDATE "ChatMessages"
         SET "Conversation" = $1
         WHERE "Id"::text = $2
         AND "MemberIdFrom"::text = $3
         RETURNING *`,
        [text, String(targetId), String(fromId)]
      );
    }

    // Safe Fallback: Only if target ID was temp- or missing, match recent message sent in last 2 minutes
    if (!result || result.rowCount === 0) {
      if ((messageId && String(messageId).startsWith("temp-")) || (tempId && String(tempId).startsWith("temp-"))) {
        result = await dbPool.query(
          `UPDATE "ChatMessages"
           SET "Conversation" = $1
           WHERE "Id" = (
             SELECT "Id" FROM "ChatMessages"
             WHERE "MemberIdFrom"::text = $2
             ${toId ? 'AND "MemberIdTo"::text = $3' : ''}
             AND "CreatedAt" >= NOW() - INTERVAL '2 minutes'
             ORDER BY "CreatedAt" DESC
             LIMIT 1
           )
           RETURNING *`,
          toId ? [text, String(fromId), String(toId)] : [text, String(fromId)]
        );
      }
    }

    return NextResponse.json({
      message: "Message updated successfully",
      success: true,
      updatedCount: result?.rowCount || 0,
    });
  } catch (error: any) {
    console.error("Error editing message:", error);
    return NextResponse.json(
      { message: "Failed to edit message", error: error.message },
      { status: 500 }
    );
  }
}
