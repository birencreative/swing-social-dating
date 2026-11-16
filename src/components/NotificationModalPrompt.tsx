"use client";

import { useEffect, useState } from "react";
import { Box, Paper, Typography, Button, Stack } from "@mui/material";

export default function NotificationPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Skip if Notifications API not supported
    if (!("Notification" in window)) return;

    const granted = localStorage.getItem("notificationGranted");
    if (granted === "true") return;

    const dismissed = sessionStorage.getItem("notificationPopupDismissed");
    if (dismissed === "true") return;

    // Show only when explicitly DENIED (blocked in browser)
    if (Notification.permission === "denied") {
      setOpen(true);
    }
  }, []);

  const handleTurnOn = async () => {
    if (!("Notification" in window)) {
      alert("Notifications are not supported in your browser.");
      sessionStorage.setItem("notificationPopupDismissed", "true");
      setOpen(false);
      return;
    }

    // If still denied, instruct user to enable manually
    if (Notification.permission === "denied") {
      alert(
        "Notifications are blocked in your browser settings. Please enable them manually in your browser preferences.",
      );
      sessionStorage.setItem("notificationPopupDismissed", "true");
      setOpen(false);
      return;
    }

    const permission = await Notification.requestPermission();
    console.log("Notification permission:", permission);

    if (permission === "granted") {
      localStorage.setItem("notificationGranted", "true");
      sessionStorage.removeItem("notificationPopupDismissed");
      setOpen(false);
    } else {
      sessionStorage.setItem("notificationPopupDismissed", "true");
      setOpen(false);
    }
  };

  const handleClose = () => {
    sessionStorage.setItem("notificationPopupDismissed", "true");
    setOpen(false);
  };

  if (!open) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1400,
        width: "100%",
        display: "flex",
        justifyContent: "center",
        px: 2,
        pb: 2,
        // Add padding to account for bottom navigation
        paddingBottom: "calc(env(safe-area-inset-bottom) + 80px)",
        pointerEvents: "none", // Allow clicks through the container
      }}
    >
      <Paper
        elevation={12}
        sx={{
          maxWidth: 340,
          width: "100%",
          px: 2.5,
          py: 2,
          borderRadius: 3,
          backgroundColor: "#2a1a3a",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          pointerEvents: "auto", // Re-enable clicks on the paper
        }}
      >
        <Typography
          fontSize={14}
          fontWeight={600}
          color="#fff"
          lineHeight={1.4}
          sx={{ mb: 0.8 }}
        >
          Stay updated with likes, comments, and messages.
        </Typography>

        <Typography
          fontSize={12.5}
          color="rgba(255,255,255,0.7)"
          lineHeight={1.5}
          sx={{ mb: 2 }}
        >
          Enable notifications in your browser settings to get alerts.
        </Typography>

        <Stack direction="column" spacing={1.5} justifyContent="flex-end">
          <Button
            size="small"
            variant="text"
            onClick={handleClose}
            sx={{
              textTransform: "none",
              fontSize: 13,
              color: "rgba(255,255,255,0.6)",
              fontWeight: 600,
              px: 2,
              py: 0.8,
              "&:hover": {
                backgroundColor: "rgba(255,255,255,0.05)",
                color: "rgba(255,255,255,0.8)",
              },
            }}
          >
            Maybe later
          </Button>

          <Button
            size="small"
            variant="contained"
            onClick={handleTurnOn}
            sx={{
              textTransform: "none",
              fontSize: 13,
              fontWeight: 600,
              color: "#fff",
              background: "linear-gradient(90deg, #FF2D55, #7000FF)",
              px: 2.5,
              py: 0.8,
            }}
          >
            Turn on notifications
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
