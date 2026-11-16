"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  IconButton,
  Fade,
} from "@mui/material";
import { Download, X, Smartphone, Zap, ShieldCheck } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // 1. Check if already installed / running in PWA mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes("android-app://");

    if (isStandalone) {
      return;
    }

    // 2. Check if dismissed recently (within 3 days)
    const dismissedTime = localStorage.getItem("pwa_prompt_dismissed");
    if (dismissedTime) {
      const daysPassed = (Date.now() - parseInt(dismissedTime, 10)) / (1000 * 60 * 60 * 24);
      if (daysPassed < 3) {
        return;
      }
    }

    // 3. Listen for browser install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setShowPrompt(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa_prompt_dismissed", Date.now().toString());
  };

  if (!showPrompt) return null;

  return (
    <Dialog
      open={showPrompt}
      onClose={handleDismiss}
      TransitionComponent={Fade}
      transitionDuration={300}
      PaperProps={{
        sx: {
          width: "90%",
          maxWidth: "380px",
          borderRadius: "24px",
          background: "linear-gradient(180deg, #1e0a2f 0%, #10041a 100%)",
          border: "1.5px solid rgba(255, 27, 107, 0.4)",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(255, 27, 107, 0.25)",
          overflow: "hidden",
          p: 0,
          m: 2,
        },
      }}
    >
      <DialogContent sx={{ p: 3, pt: 3.5, position: "relative" }}>
        {/* Close Button */}
        <IconButton
          onClick={handleDismiss}
          sx={{
            position: "absolute",
            right: 12,
            top: 12,
            color: "rgba(255, 255, 255, 0.5)",
            "&:hover": { color: "#ffffff", bgcolor: "rgba(255,255,255,0.1)" },
          }}
        >
          <X size={20} />
        </IconButton>

        {/* Centered Logo Header */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            mb: 2.5,
          }}
        >
          <Box
            component="img"
            src="/logo.png"
            alt="Swing Social"
            sx={{
              height: 44,
              width: "auto",
              objectFit: "contain",
              mb: 2,
            }}
          />

          <Typography
            sx={{
              fontSize: "1.25rem",
              fontWeight: 700,
              color: "#ffffff",
              lineHeight: 1.2,
              mb: 0.8,
            }}
          >
            Install Swing Social
          </Typography>

          <Typography
            sx={{
              fontSize: "0.85rem",
              color: "rgba(255, 255, 255, 0.75)",
              lineHeight: 1.4,
              px: 1,
            }}
          >
            Add Swing Social to your home screen for a full-screen experience without the URL bar!
          </Typography>
        </Box>

        {/* Highlights List */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1.2,
            mb: 3,
            bgcolor: "rgba(255, 255, 255, 0.04)",
            p: 2,
            borderRadius: "16px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Smartphone size={18} color="#FF1B6B" />
            <Typography sx={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.9)", fontWeight: 500 }}>
              Full-screen app view without URL bar
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Zap size={18} color="#FF1B6B" />
            <Typography sx={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.9)", fontWeight: 500 }}>
              Instant 1-tap access from Home Screen
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <ShieldCheck size={18} color="#FF1B6B" />
            <Typography sx={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.9)", fontWeight: 500 }}>
              Fast, lightweight & secure
            </Typography>
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Button
            variant="contained"
            fullWidth
            onClick={handleInstallClick}
            startIcon={<Download size={18} />}
            sx={{
              background: "linear-gradient(90deg, #FF1B6B 0%, #FF2D55 100%)",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "0.95rem",
              py: 1.3,
              borderRadius: "14px",
              textTransform: "none",
              boxShadow: "0 6px 20px rgba(255, 27, 107, 0.4)",
              "&:hover": {
                background: "linear-gradient(90deg, #e0155c 0%, #e02447 100%)",
              },
            }}
          >
            Install App
          </Button>

          <Button
            fullWidth
            onClick={handleDismiss}
            sx={{
              color: "rgba(255, 255, 255, 0.6)",
              fontSize: "0.85rem",
              textTransform: "none",
              py: 0.8,
              borderRadius: "12px",
              "&:hover": { color: "#ffffff", bgcolor: "rgba(255,255,255,0.05)" },
            }}
          >
            Not Now
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
