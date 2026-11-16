import { admin } from "@/lib/firebaseAdmin";

export interface PushNotificationOptions {
  token: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  imageUrl?: string;
  sound?: string;
}

export interface PushNotificationResult {
  token: string;
  provider: "expo" | "fcm" | "apns";
  status: "success" | "error";
  response?: any;
  error?: string;
}

export function isExpoPushToken(token: string): boolean {
  if (typeof token !== "string") return false;
  const trimmed = token.trim();
  return (
    trimmed.startsWith("ExponentPushToken[") ||
    trimmed.startsWith("ExpoPushToken[") ||
    /^Expo(nent)?PushToken\[.+\]$/.test(trimmed)
  );
}

export function isRawApnsToken(token: string): boolean {
  if (typeof token !== "string") return false;
  const trimmed = token.trim();
  return /^[0-9a-fA-F]{64}$/.test(trimmed);
}

export async function convertApnsToFcmToken(apnsToken: string): Promise<string | null> {
  try {
    const credential = (admin.app().options as any)?.credential;
    if (!credential || typeof credential.getAccessToken !== "function") {
      console.error("[PushSender] Firebase Admin credential not initialized properly.");
      return null;
    }

    const tokenObj = await credential.getAccessToken();
    const accessToken = tokenObj?.access_token;
    if (!accessToken) {
      console.error("[PushSender] Unable to retrieve Firebase OAuth access token.");
      return null;
    }

    const possibleAppIds = ["com.demo.swipeprofiles", "com.swingsocial.app"];

    for (const appId of possibleAppIds) {
      for (const sandbox of [false, true]) {
        try {
          const res = await fetch("https://iid.googleapis.com/iid/v1:batchImport", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
              access_token_auth: "true",
            },
            body: JSON.stringify({
              application: appId,
              sandbox,
              apns_tokens: [apnsToken],
            }),
          });

          const data = await res.json();
          const result = data?.results?.[0];

          if (result?.status === "OK" && (result?.registration_token || result?.token)) {
            const fcmToken = result.registration_token || result.token;
            console.log(
              `[PushSender] Converted APNs token to FCM token successfully (appId: ${appId}, sandbox: ${sandbox}):`,
              fcmToken
            );
            return fcmToken;
          } else {
            console.log(
              `[PushSender] APNs import status for ${appId} (sandbox=${sandbox}):`,
              result?.status || data
            );
          }
        } catch (e: any) {
          console.warn("[PushSender] Batch import fetch error:", e?.message);
        }
      }
    }
  } catch (err: any) {
    console.error("[PushSender] Failed to convert APNs token to FCM token:", err?.message || err);
  }
  return null;
}

function convertDataToStrings(data?: Record<string, any>): Record<string, string> {
  const stringData: Record<string, string> = {};
  if (data && typeof data === "object") {
    for (const [key, value] of Object.entries(data)) {
      if (value === null || value === undefined) {
        stringData[key] = "";
      } else if (typeof value === "string") {
        stringData[key] = value;
      } else if (typeof value === "number" || typeof value === "boolean") {
        stringData[key] = value.toString();
      } else if (typeof value === "object") {
        stringData[key] = JSON.stringify(value);
      } else {
        stringData[key] = String(value);
      }
    }
  }
  return stringData;
}

export async function sendPushNotificationToToken(
  options: PushNotificationOptions
): Promise<PushNotificationResult> {
  const { title, body, data = {}, imageUrl, sound = "default" } = options;
  let token = options.token;

  if (!token || typeof token !== "string" || token.trim().length === 0) {
    return {
      token,
      provider: "fcm",
      status: "error",
      error: "Token is empty or invalid",
    };
  }

  let cleanToken = token.trim();

  // ─── 0. RAW APNS DEVICE TOKEN (64-character hexadecimal string) ───────────
  if (isRawApnsToken(cleanToken)) {
    console.log(
      `[PushSender] Detected 64-char raw APNs token (${cleanToken}). Converting to FCM token via Google IID API...`
    );
    const convertedFcmToken = await convertApnsToFcmToken(cleanToken);

    if (convertedFcmToken) {
      cleanToken = convertedFcmToken;
    } else {
      return {
        token: cleanToken,
        provider: "apns",
        status: "error",
        error: `Could not exchange raw APNs token (${cleanToken.slice(
          0,
          10
        )}...) for an FCM token. Please ensure your APNs Authentication Key (.p8 file) is uploaded to Firebase Console for bundle ID com.demo.swipeprofiles.`,
      };
    }
  }

  // ─── 1. EXPO PUSH TOKEN ───────────────────────────────────────────────────
  if (isExpoPushToken(cleanToken)) {
    try {
      const expoPayload = {
        to: cleanToken,
        title: title || "SwingSocial",
        body: body || "",
        sound,
        badge: 1,
        priority: "high",
        _contentAvailable: true,
        mutableContent: true,
        channelId: "messages",
        data: {
          title: title || "SwingSocial",
          body: body || "",
          ...data,
        },
      };

      const expoRes = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate",
        },
        body: JSON.stringify(expoPayload),
      });

      const expoData = await expoRes.json();
      const ticket = Array.isArray(expoData?.data) ? expoData.data[0] : expoData?.data;

      if (ticket?.status === "error" || expoData?.errors) {
        const errorMsg =
          ticket?.message ||
          ticket?.details?.error ||
          expoData?.errors?.[0]?.message ||
          "Expo push failed";
        return {
          token: cleanToken,
          provider: "expo",
          status: "error",
          error: errorMsg,
          response: expoData,
        };
      }

      return {
        token: cleanToken,
        provider: "expo",
        status: "success",
        response: expoData,
      };
    } catch (err: any) {
      console.error("[PushSender] Expo Push API error:", err);
      return {
        token: cleanToken,
        provider: "expo",
        status: "error",
        error: err.message || "Failed sending via Expo API",
      };
    }
  }

  // ─── 2. NATIVE FCM TOKEN ───────────────────────────────────────────────────
  try {
    const targetUrl = data?.url || data?.clickAction || (data?.senderId ? `/messaging/${data.senderId}` : "/");

    const stringifiedData = convertDataToStrings({
      title: title || "SwingSocial",
      body: body || "",
      url: targetUrl,
      ...data,
    });

    const fcmMessage: any = {
      token: cleanToken,
      webpush: {
        headers: {
          Urgency: "high",
        },
        fcmOptions: {
          link: targetUrl,
        },
      },
      android: {
        priority: "high",
        notification: {
          sound,
          channelId: "messages",
          ...(imageUrl ? { image: imageUrl } : {}),
        },
      },
      apns: {
        headers: {
          "apns-priority": "10",
          "apns-push-type": "alert",
        },
        payload: {
          aps: {
            alert: {
              title: title || "SwingSocial",
              body: body || "",
            },
            sound,
            badge: 1,
            "content-available": 1,
            "mutable-content": 1,
          },
        },
        ...(imageUrl ? { fcmOptions: { image: imageUrl } } : {}),
      },
      data: stringifiedData,
    };

    const res = await admin.messaging().send(fcmMessage);
    return {
      token: cleanToken,
      provider: "fcm",
      status: "success",
      response: res,
    };
  } catch (err: any) {
    console.error("[PushSender] FCM Send error:", err);
    return {
      token: cleanToken,
      provider: "fcm",
      status: "error",
      error: err.message || "FCM send failed",
    };
  }
}
