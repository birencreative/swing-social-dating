import { dbPool } from '@/lib/db';
import { NextRequest, NextResponse } from "next/server";
import { sendPushNotificationToToken } from "@/lib/sendPushNotification";

type NotificationType =
  | "new_match"
  | "message"
  | "like"
  | "request"
  | "friend_request";

function maskToken(token: string) {
  return token ? `${token.slice(0, 10)}...${token.slice(-10)}` : "INVALID";
}

export async function POST(req: NextRequest) {
  try {
    const { userId, senderId, title, body, type, url } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

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

    const enabledMap: Record<NotificationType, boolean> = {
      new_match: preferences.newMatches !== false,
      message: preferences.messages !== false,
      like: preferences.likes !== false,
      request: preferences.requests !== false,
      friend_request: preferences.friendRequests !== false,
    };

    if (preferences.pushNotifications === false) {
      return NextResponse.json({
        success: true,
        message: "Notification skipped - push disabled",
      });
    }

    if (!type || !enabledMap[type as NotificationType]) {
      return NextResponse.json({
        success: true,
        message: "Notification skipped - type disabled",
        type,
      });
    }

    const tokenRes = await dbPool.query(
      "SELECT devicetoken FROM public.web_get_devicetoken($1)",
      [userId]
    );

    if (!tokenRes.rows.length) {
      return NextResponse.json(
        { error: "No device token found" },
        { status: 404 }
      );
    }

    const deviceTokens = tokenRes.rows
      .map((r: any) => r.devicetoken)
      .filter(Boolean);

    if (deviceTokens.length === 0) {
      return NextResponse.json(
        { error: "No valid device tokens found" },
        { status: 404 }
      );
    }

    const notificationTitle = title ?? "SwingSocial";
    const notificationBody = body ?? "New notification";
    const targetUrl = url ?? "/";

    const results = [];
    for (const token of deviceTokens) {
      const res = await sendPushNotificationToToken({
        token,
        title: notificationTitle,
        body: notificationBody,
        imageUrl: "/logo.svg",
        data: {
          url: targetUrl,
          type: type || "general",
          senderId: senderId || "",
        },
      });
      results.push(res);
    }

    await dbPool.query(
      `INSERT INTO notifications
       (user_id, sender_id, type, title, body, url, is_read, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, false, NOW())`,
      [userId, senderId || null, type || "general", notificationTitle, notificationBody, targetUrl]
    );

    const hasSuccess = results.some((r) => r.status === "success");

    return NextResponse.json({
      success: hasSuccess,
      message: hasSuccess
        ? "Notification sent successfully"
        : "Failed to send notification to devices",
      sentTo: deviceTokens.length,
      results,
    });
  } catch (err: any) {
    console.error("[NOTIFICATION_ERROR]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
