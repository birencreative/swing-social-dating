import { dbPool } from '@/lib/db';
import { NextResponse } from "next/server";
import { sendPushNotificationToToken } from "@/lib/sendPushNotification";

export const dynamic = "force-dynamic";

// PostgreSQL dbPool connection setup

export async function POST(req: any) {
  // Parse the request body
  const bodyData = await req.json();
  const ProfileIdfrom = bodyData.ProfileIdfrom || bodyData.profileIdFrom || bodyData.senderId || bodyData.MemberIdFrom;
  const ProfileIDto = bodyData.ProfileIDto || bodyData.ProfileIdto || bodyData.profileIdTo || bodyData.receiverId || bodyData.MemberIdTo;
  const Conversation = bodyData.Conversation || bodyData.conversation || bodyData.message || bodyData.text || "";
  const chatid = bodyData.chatid ?? bodyData.chatId ?? bodyData.ChatId;

  try {
    let finalChatId = chatid;

    // If chatid is 0 or not provided, create/find chat and get the chat_id
    if (!finalChatId || finalChatId === 0 || finalChatId === "0") {
      console.log("chatid is 0 or missing, resolving user chat...");
      const chatResult = await dbPool.query(
        "SELECT * FROM public.chat_create_user_chat($1, $2)",
        [ProfileIdfrom, ProfileIDto]
      );

      if (chatResult.rows.length > 0) {
        finalChatId = chatResult.rows[0].ChatId;
        console.log("Chat_id resolved:", chatResult.rows[0].ChatId);
      } else {
        throw new Error("Failed to create a new chat. No chat_id returned.");
      }
    }

    // Insert the conversation
    const result = await dbPool.query(
      "SELECT * FROM public.insert_chat_conversation($1, $2, $3, $4)",
      [finalChatId, ProfileIdfrom, ProfileIDto, Conversation]
    );

    console.log("Query Result:", result);

    // --- Send Push Notification ---
    try {
      if (ProfileIDto) {
        // Fetch the receiver's Push Token from FirebaseToken or web_get_devicetoken
        const tokenRes = await dbPool.query(
          `SELECT "FCMKey" AS devicetoken FROM "FirebaseToken" WHERE "UserId" = $1 ORDER BY "CreatedAt" DESC LIMIT 1`,
          [ProfileIDto]
        );

        let receiverPushTokens: string[] = tokenRes.rows
          .map((r: any) => r.devicetoken)
          .filter(Boolean);

        if (receiverPushTokens.length === 0) {
          const devTokenRes = await dbPool.query(
            `SELECT devicetoken FROM public.web_get_devicetoken($1)`,
            [ProfileIDto]
          );
          receiverPushTokens = devTokenRes.rows
            .map((r: any) => r.devicetoken)
            .filter(Boolean);
        }

        // Deduplicate tokens to ensure only 1 push is sent per device
        receiverPushTokens = Array.from(new Set(receiverPushTokens));

        // Fetch sender details (Username and Avatar)
        let senderName = "Someone";
        let senderImage = "";
        if (ProfileIdfrom) {
          const senderRes = await dbPool.query(
            `SELECT "Username", "Avatar" FROM "UserProfiles" WHERE "Id" = $1 LIMIT 1`,
            [ProfileIdfrom]
          );
          if (senderRes.rows.length > 0) {
            if (senderRes.rows[0].Username) senderName = senderRes.rows[0].Username;
            if (senderRes.rows[0].Avatar) senderImage = senderRes.rows[0].Avatar;
          }
        }

        console.log("------------------- PUSH NOTIFICATION DEBUG START -------------------");
        console.log("[Push Notification] Receiver Profile ID:", ProfileIDto);
        console.log("[Push Notification] Tokens Found:", receiverPushTokens);
        console.log("[Push Notification] Sender Profile ID:", ProfileIdfrom);
        console.log("[Push Notification] Sender Name:", senderName);

        if (receiverPushTokens.length === 0) {
          console.warn(`[Push Notification] SKIPPED: Receiver Profile ID ${ProfileIDto} has no active push token.`);
        } else {
          for (const token of receiverPushTokens) {
            const pushResult = await sendPushNotificationToToken({
              token,
              title: senderName || "New Message",
              body: Conversation || `${senderName} sent you a message`,
              imageUrl: senderImage,
              data: {
                type: "message",
                chatId: String(finalChatId),
                senderId: String(ProfileIdfrom || ""),
                senderName: senderName,
                image: senderImage,
                url: `/messaging/${ProfileIdfrom}`,
              },
            });

            console.log("[Push Notification] Push Result:", pushResult);

            if (pushResult.status === "error" && pushResult.error?.includes("DeviceNotRegistered")) {
              console.warn(`[Push Notification] Cleaning up invalid token from DB: ${token}`);
              await dbPool.query(`DELETE FROM "FirebaseToken" WHERE "FCMKey" = $1`, [token]);
            }
          }
        }
        console.log("------------------- PUSH NOTIFICATION DEBUG END -------------------");
      }
    } catch (pushErr: any) {
      console.error("[Push Notification Error]:", pushErr);
    }

    // Return success response
    return NextResponse.json({
      message: "Chat conversation inserted successfully",
      data: result.rows,
    });
  } catch (error: any) {
    console.error("Error:", error);

    // Return failure response
    return NextResponse.json(
      {
        message: "Chat conversation insertion failed",
        error: error.message,
      },
      { status: 400 }
    );
  }
}

export async function GET(req: any) {
  const { searchParams } = new URL(req.url);
  const profileid = searchParams.get("profileid");

  if (!profileid) {
    return NextResponse.json(
      {
        message: "Profile ID is required",
      },
      { status: 400 }
    );
  }

  try {
    const result = await dbPool.query("SELECT * FROM public.get_all_chats($1)", [
      profileid,
    ]);

    // Fetch last message details for each chat to determine readAt / deliveredAt and latest message snippet
    const chatIds = result.rows.map((r: any) => r.ChatId).filter(Boolean);
    const lastMsgMap = new Map();
    if (chatIds.length > 0) {
      const lastMsgResult = await dbPool.query(
        `SELECT DISTINCT ON ("ChatId") "ChatId", "MemberIdFrom", "Conversation", "CreatedAt", "Viewed" 
         FROM "ChatMessages" 
         WHERE "ChatId" = ANY($1::uuid[]) 
         ORDER BY "ChatId", "CreatedAt" DESC`,
        [chatIds]
      );
      lastMsgResult.rows.forEach((row: any) => {
        lastMsgMap.set(String(row.ChatId), {
          MemberIdFrom: String(row.MemberIdFrom),
          Conversation: row.Conversation,
          CreatedAt: row.CreatedAt,
          Viewed: row.Viewed
        });
      });
    }

    const enrichedData = result.rows.map((row: any) => {
      const lastMsg = lastMsgMap.get(String(row.ChatId));
      const isLastFromMe = lastMsg && String(lastMsg.MemberIdFrom).toLowerCase() === String(profileid).toLowerCase();

      return {
        ...row,
        Conversation: lastMsg?.Conversation || row.Conversation,
        LastUp: lastMsg?.CreatedAt || row.LastUp,
        MemberIdFrom: lastMsg ? lastMsg.MemberIdFrom : row.MemberIdFrom,
        // If the last message was sent by me and it has Viewed = 1, then it is read
        readAt: isLastFromMe && lastMsg.Viewed === 1 ? (lastMsg.CreatedAt || row.LastUp) : null,
        // If it is in the database, it has been delivered
        deliveredAt: isLastFromMe ? (lastMsg.CreatedAt || row.LastUp) : null
      };
    });

    return NextResponse.json({
      message: "Chats fetched successfully",
      data: enrichedData,
    });
  } catch (error: any) {
    console.error("Error fetching chats:", error);
    return NextResponse.json(
      {
        message: "Failed to fetch chats",
        error: error.message,
      },
      { status: 400 }
    );
  }
}
