"use client";

import React, {
  createContext,
  PropsWithChildren,
  useEffect,
  useState,
  useRef,
} from "react";
import { initializeApp, getApps } from "firebase/app";
import { getMessaging, Messaging, onMessage, getToken } from "firebase/messaging";
import { usePathname } from "next/navigation";

const firebaseConfig = {
  apiKey: "AIzaSyAxYy298rlYnz5Ga0Gq519Fd9ZRFPNfnvs",
  authDomain: "swing-social-website-b589b.firebaseapp.com",
  projectId: "swing-social-website-b589b",
  storageBucket: "swing-social-website-b589b.firebasestorage.app",
  messagingSenderId: "175259366436",
  appId: "1:175259366436:web:bfbd1ad7e32e48aa70d4b1",
  measurementId: "G-NWFD9DJGR9",
};

export const PushNotificationsContext = createContext<Messaging | undefined>(
  undefined
);

const PushNotificationsProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const [messaging, setMessaging] = useState<Messaging>();
  const pathname = usePathname();
  const lastRegisteredRef = useRef<{ profileId: string | null; token: string | null }>({
    profileId: null,
    token: null,
  });

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("Notification" in window)
    ) {
      return;
    }

    let active = true;
    let unsubMessage: (() => void) | undefined;

    const init = async () => {
      try {
        const profileId = typeof window !== "undefined" ? localStorage.getItem("logged_in_profile") : null;
        if (!profileId) return;

        // 🔥 Init Firebase once
        const app =
          getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

        const messagingInstance = getMessaging(app);
        if (active) {
          setMessaging(messagingInstance);
        }

        // 🔒 Ask permission once
        if (Notification.permission === "default") {
          await Notification.requestPermission();
        }

        if (Notification.permission !== "granted") return;

        // Register service worker if needed
        let registration = await navigator.serviceWorker.getRegistration("/");
        if (!registration) {
          registration = await navigator.serviceWorker.register(
            "/firebase-messaging-sw.js",
            { scope: "/" }
          );
        }

        await navigator.serviceWorker.ready;

        let firebaseToken: string | null = null;
        try {
          firebaseToken = await getToken(messagingInstance, {
            vapidKey:
              "BKY7_YVwJ6hVe-6_BPdaM6nGo2DjGeAb4NvLibnY4glX7pOdo5Lz9dLQWn5lHwmb4eEe99YLbWfhtVZjwY4sOjI",
            serviceWorkerRegistration: registration,
          });
        } catch (tokenErr: any) {
          if (
            tokenErr?.name === "VersionError" ||
            tokenErr?.message?.includes("version")
          ) {
            console.warn("[FCM] IndexedDB version mismatch detected. Resetting FCM database...");
            if (typeof window !== "undefined" && window.indexedDB) {
              try {
                window.indexedDB.deleteDatabase("firebase-messaging-database");
                window.indexedDB.deleteDatabase("firebase-installations-database");
              } catch (e) {
                console.error("[FCM] Failed to delete IndexedDB:", e);
              }
            }
            try {
              firebaseToken = await getToken(messagingInstance, {
                vapidKey:
                  "BKY7_YVwJ6hVe-6_BPdaM6nGo2DjGeAb4NvLibnY4glX7pOdo5Lz9dLQWn5lHwmb4eEe99YLbWfhtVZjwY4sOjI",
                serviceWorkerRegistration: registration,
              });
            } catch (retryErr) {
              console.error("[FCM] Retry getToken error:", retryErr);
            }
          } else {
            console.error("[FCM] getToken error:", tokenErr);
          }
        }

        if (firebaseToken && active) {
          if (
            lastRegisteredRef.current.profileId === profileId &&
            lastRegisteredRef.current.token === firebaseToken
          ) {
            // Already registered this session/route, skip db write
          } else {
            const response = await fetch("/api/user/notification-token", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                profileId,
                token: firebaseToken,
              }),
            });
            if (response.ok) {
              lastRegisteredRef.current = { profileId, token: firebaseToken };
            }
          }
        }

        if (!active) return;

        const unsubscribe = onMessage(messagingInstance, (payload) => {
          const data = payload.data;

          // ✅ Type guard (fixes TS18048)
          if (!data) return;

          // Avoid duplicate foreground notifications if user is currently in the chat details page
          const currentPath = window.location.pathname;
          const currentParts = currentPath.split("/").filter(Boolean);
          const activeChatPartnerId = currentParts[currentParts.length - 1];

          const senderId = data.senderId || data.sender_id;
          const dataUrl = data.url || "";
          const urlParts = dataUrl.split("/").filter(Boolean);
          const senderIdFromUrl = urlParts[urlParts.length - 1];

          const isCurrentlyViewingChat =
            currentPath.startsWith("/messaging/") &&
            activeChatPartnerId &&
            (
              (senderId && String(activeChatPartnerId).toLowerCase() === String(senderId).toLowerCase()) ||
              (senderIdFromUrl && String(activeChatPartnerId).toLowerCase() === String(senderIdFromUrl).toLowerCase())
            );

          if (isCurrentlyViewingChat) {
            console.log("[FCM Provider] Suppressed notification: User is currently chatting with", senderId || senderIdFromUrl);
            return;
          }

          navigator.serviceWorker.ready.then((reg) => {
            reg.showNotification(data.title ?? "SwingSocial", {
              body: data.body ?? "New notification",
              icon: data.image || data.icon || "/logo.svg",
              badge: "/logo.svg",
              data: {
                url: data.url || (senderId ? `/messaging/${senderId}` : "/"),
              },
            });
          });
        });

        unsubMessage = unsubscribe;
      } catch (err) {
        console.error("FCM init error:", err);
      }
    };

    init();

    return () => {
      active = false;
      if (unsubMessage) {
        unsubMessage();
      }
    };
  }, [pathname]);

  return (
    <PushNotificationsContext.Provider value={messaging}>
      {children}
    </PushNotificationsContext.Provider>
  );
};

export default PushNotificationsProvider;

