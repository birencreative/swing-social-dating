"use client";

import { useEffect } from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "@/theme/theme";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "NAVIGATE" && event.data.url) {
        window.location.href = event.data.url;
      }
    };

    navigator.serviceWorker.addEventListener("message", handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener("message", handleMessage);
    };
  }, []);

  useEffect(() => {
    const syncCookie = () => {
      const token = localStorage.getItem("loginInfo");
      const cookieMatch = document.cookie.match(/(^|;)\s*loginInfo\s*=\s*([^;]+)/);
      const cookieValue = cookieMatch ? cookieMatch[2] : null;

      if (token && cookieValue !== token) {
        document.cookie = `loginInfo=${token}; path=/; max-age=31536000; SameSite=Lax`;
      } else if (!token && cookieValue) {
        document.cookie = "loginInfo=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
      }
    };

    syncCookie();

    window.addEventListener("storage", syncCookie);
    return () => {
      window.removeEventListener("storage", syncCookie);
    };
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
      <PWAInstallPrompt />
    </ThemeProvider>
  );
}
