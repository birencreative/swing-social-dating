importScripts(
  "https://www.gstatic.com/firebasejs/10.1.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.1.0/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyAxYy298rlYnz5Ga0Gq519Fd9ZRFPNfnvs",
  authDomain: "swing-social-website-b589b.firebaseapp.com",
  projectId: "swing-social-website-b589b",
  storageBucket: "swing-social-website-b589b.firebasestorage.app",
  messagingSenderId: "175259366436",
  appId: "1:175259366436:web:bfbd1ad7e32e48aa70d4b1",
  measurementId: "G-NWFD9DJGR9",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(async (payload) => {
  const { title, body, url, icon, senderId } = payload.data || {};
  const targetUrl = url || payload.fcmOptions?.link || (senderId ? `/messaging/${senderId}` : "/");

  try {
    const clientList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });

    for (const client of clientList) {
      if (client.focused && client.url) {
        const clientUrlObj = new URL(client.url);
        const path = clientUrlObj.pathname;
        const pathParts = path.split("/").filter(Boolean);
        const activePartnerId = pathParts[pathParts.length - 1];

        const dataUrlParts = (url || "").split("/").filter(Boolean);
        const senderIdFromUrl = dataUrlParts[dataUrlParts.length - 1];

        if (
          path.startsWith("/messaging/") &&
          activePartnerId &&
          (
            (senderId && String(activePartnerId).toLowerCase() === String(senderId).toLowerCase()) ||
            (senderIdFromUrl && String(activePartnerId).toLowerCase() === String(senderIdFromUrl).toLowerCase())
          )
        ) {
          console.log("[SW] Suppressing notification: User is currently chatting with sender", senderId || senderIdFromUrl);
          return;
        }
      }
    }
  } catch (e) {
    console.error("[SW] Error checking active client:", e);
  }

  self.registration.showNotification(title || "SwingSocial", {
    body: body || "New notification",
    icon: icon || "/logo.svg",
    badge: "/logo.svg",
    data: { url: targetUrl },
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // 🔹 If any tab is already open
        for (const client of clientList) {
          if (client.url.startsWith(self.location.origin)) {
            // 🔔 Tell the page to navigate
            client.postMessage({
              type: "NAVIGATE",
              url,
            });
            return client.focus();
          }
        }

        // 🔹 Otherwise open new tab
        return clients.openWindow(url);
      })
  );
});

self.skipWaiting();
self.clients.claim();

self.addEventListener("fetch", (event) => {
  // Enables Chrome Android PWA installability requirements
});
