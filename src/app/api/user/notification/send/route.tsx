import { dbPool } from '@/lib/db';
import { NextRequest, NextResponse } from "next/server";
import { sendPushNotificationToToken } from "@/lib/sendPushNotification";

const DEFAULT_PREFERENCES = {
  pushNotifications: true,
  newMatches: true,
  messages: true,
  likes: true,
  requests: false,
  friendRequests: true,
};

async function getUserPreferences(
  userId: string
): Promise<typeof DEFAULT_PREFERENCES> {
  try {
    const result = await dbPool.query(
      `SELECT preferences 
       FROM notification_preferences 
       WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length > 0 && result.rows[0].preferences) {
      return { ...DEFAULT_PREFERENCES, ...result.rows[0].preferences };
    }

    return DEFAULT_PREFERENCES;
  } catch (error) {
    console.error("Error fetching preferences:", error);
    return DEFAULT_PREFERENCES;
  }
}

function isNotificationEnabled(
  preferences: typeof DEFAULT_PREFERENCES,
  type: string
): boolean {
  if (!preferences.pushNotifications) return false;

  switch (type) {
    case "new_match":
      return preferences.newMatches !== false;
    case "message":
      return preferences.messages !== false;
    case "like":
      return preferences.likes !== false;
    case "request":
      return preferences.requests !== false;
    case "friend_request":
      return preferences.friendRequests !== false;
    default:
      return true;
  }
}

async function sendNotificationUUID({
  userId,
  title,
  body,
  type,
  data,
}: {
  userId: any;
  title: any;
  body: any;
  type: any;
  data?: any;
}) {
  const preferences = await getUserPreferences(userId);

  if (!isNotificationEnabled(preferences, type)) {
    return {
      success: false,
      message: `Notification ${type} disabled by user`,
      preferences,
    };
  }

  let deviceTokens: string[] = [];
  try {
    const tokenResult = await dbPool.query(
      `SELECT devicetoken FROM public.web_get_devicetoken($1)`,
      [userId]
    );
    deviceTokens = tokenResult.rows.map((r) => r.devicetoken).filter(Boolean);
  } catch (err: any) {
    return { success: false, error: err.message };
  }

  if (deviceTokens.length === 0) {
    return { success: false, message: "No device tokens found" };
  }

  const responses: any[] = [];
  const targetUrl = data?.url || "/";

  for (const token of deviceTokens) {
    const res = await sendPushNotificationToToken({
      token,
      title,
      body,
      imageUrl: "/logo.png",
      data: {
        url: targetUrl,
        type,
        ...data,
      },
    });
    responses.push(res);
  }

  const hasSuccess = responses.some((r) => r.status === "success");

  return {
    success: hasSuccess,
    sentTo: deviceTokens.length,
    responses,
  };
}

export async function POST(req: NextRequest) {
  const { userId, title, body, type, data } = await req.json();

  if (!userId) {
    return NextResponse.json({ success: false, error: "userId required" });
  }

  const result = await sendNotificationUUID({
    userId,
    title: title || "SwingSocial",
    body: body || "You have a new notification",
    type: type || "general",
    data,
  });

  return NextResponse.json(result);
}

export async function PUT(req: NextRequest) {
  const { userId, notificationType, data } = await req.json();

  if (!userId || !notificationType) {
    return NextResponse.json({
      success: false,
      error: "userId and notificationType required",
    });
  }

  const configMap: Record<string, { title: string; body: string }> = {
    new_match: {
      title: "New Match! 🎉",
      body: `${data?.matchName || "Someone"} matched with you`,
    },
    message: {
      title: "New Message 💬",
      body: data?.preview || "You received a message",
    },
    like: {
      title: "New Like ❤️",
      body: `${data?.likerName || "Someone"} liked you`,
    },
    friend_request: {
      title: "Friend Request 👤",
      body: `${data?.requesterName || "Someone"} sent a friend request`,
    },
    request: {
      title: "New Request 🚀",
      body: `${data?.requesterName || "Someone"} sent a request`,
    },
  };

  const config = configMap[notificationType];

  if (!config)
    return NextResponse.json({ success: false, error: "Invalid type" });

  const result = await sendNotificationUUID({
    userId,
    type: notificationType,
    title: config.title,
    body: config.body,
    data,
  });

  return NextResponse.json(result);
}
