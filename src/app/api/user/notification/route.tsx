import { dbPool } from '@/lib/db';
import { NextRequest, NextResponse } from "next/server";
import { sendPushNotificationToToken } from "@/lib/sendPushNotification";


export async function POST(req: NextRequest) {
  try {
    let bodyData;
    try {
      bodyData = await req.json();
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid or empty JSON request body" },
        { status: 400 }
      );
    }
    const userId = bodyData.userId || bodyData.id;
    const { body, url, image, title, type, clickAction, senderId } = bodyData;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    /* ---------- Preferences ---------- */
    const prefRes = await dbPool.query(
      `SELECT preferences FROM notification_preferences WHERE user_id = $1`,
      [userId]
    );

    const preferences = prefRes.rows.length ? (prefRes.rows[0].preferences || {}) : {};

    if (preferences.pushNotifications === false) {
      return NextResponse.json({
        success: true,
        message: "Push notifications disabled",
      });
    }

    /* ---------- Device Tokens ---------- */
    const tokenRes = await dbPool.query(
      "SELECT deviceToken FROM public.web_get_devicetoken($1)",
      [userId]
    );

    if (!tokenRes.rows.length) {
      return NextResponse.json(
        { message: "No device tokens found." },
        { status: 404 }
      );
    }

    const responses: any[] = [];
    const targetUrl = url || clickAction || "/";
    const imageUrl =
      image ||
      "https://swingsocialphotos.blob.core.windows.net/images/1738268455860_icon.png";

    /* ---------- SEND ---------- */
    for (const row of tokenRes.rows) {
      const firebaseToken = row.devicetoken;

      if (!firebaseToken) {
        responses.push({
          token: null,
          status: "error",
          error: "Invalid token",
        });
        continue;
      }

      const res = await sendPushNotificationToToken({
        token: firebaseToken,
        title: title || "Message from SwingSocial",
        body: body || "You have a new notification",
        imageUrl,
        data: {
          url: targetUrl,
          type: type || "general",
          senderId: senderId || "",
        },
      });
      responses.push(res);
    }

    /* ---------- Save Notification ---------- */
    await dbPool.query(
      `INSERT INTO notifications 
       (user_id, sender_id, type, title, body, url, is_read, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, false, NOW())`,
      [
        userId,
        senderId || null,
        type || "general",
        title || "Message from SwingSocial",
        body || "You have a new notification",
        targetUrl,
      ]
    );

    return NextResponse.json({
      message: "Notifications processed.",
      results: responses,
    });
  } catch (error: any) {
    console.error("Notification API error:", error);
    return NextResponse.json(
      {
        message: "Failed to process notifications",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
