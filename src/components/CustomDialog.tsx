"use client";

import React, { useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  Typography,
  Box,
  Button,
  IconButton,
  Fade,
  Stack,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";

interface Props {
  open: boolean;
  title: string;
  description: string;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  icon?: React.ReactNode;
}

const CustomDialog: React.FC<Props> = ({
  open,
  title,
  description,
  onClose,
  onConfirm,
  confirmText = "OK",
  cancelText = "Cancel",
  icon,
}) => {
  const pushedStateRef = useRef(false);

  useEffect(() => {
    // Generate a unique ID for this dialog instance
    const modalId = title.replace(/\s+/g, "_") + "_" + Date.now();
    
    if (typeof window !== "undefined" && !(window as any).__activeModals) {
      (window as any).__activeModals = [];
    }

    if (open && !pushedStateRef.current) {
      window.history.pushState({ dialogOpen: true }, "", window.location.href);
      pushedStateRef.current = true;
      (window as any).__activeModals.push(modalId);
    } else if (!open && pushedStateRef.current) {
      const activeModals = (window as any).__activeModals;
      if (activeModals[activeModals.length - 1] === modalId) {
        (window as any).__ignoreNextPopState = true;
        window.history.back();
        setTimeout(() => {
          (window as any).__ignoreNextPopState = false;
        }, 100);
      }
      pushedStateRef.current = false;
      const index = activeModals.indexOf(modalId);
      if (index > -1) activeModals.splice(index, 1);
    }

    const handlePopState = (event: PopStateEvent) => {
      if ((window as any).__ignoreNextPopState) return;

      const activeModals = (window as any).__activeModals;
      if (open && activeModals[activeModals.length - 1] === modalId) {
        if ((window as any).__popStateHandled === event.timeStamp) return;
        (window as any).__popStateHandled = event.timeStamp;

        pushedStateRef.current = false;
        const index = activeModals.indexOf(modalId);
        if (index > -1) activeModals.splice(index, 1);
        onClose();
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [open, onClose, title]);
  return (
    <Dialog
      open={open}
      onClose={onClose}
      BackdropProps={{
        sx: {
          backdropFilter: "blur(6px)",
        },
      }}
      PaperProps={{
        sx: {
          width: "100%",
          maxWidth: 380,
          borderRadius: 4,
          p: 3,
          background: "rgba(20, 10, 35, 0.95)",
          backdropFilter: "blur(25px)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "#fff",
          position: "relative",
          boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
        },
      }}
    >
      <DialogContent sx={{ textAlign: "center", p: 0 }}>
        {/* Close */}
        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 10,
            top: 10,
            color: "rgba(255,255,255,0.5)",
          }}
        >
          <CloseIcon />
        </IconButton>

        {/* Gradient Icon Circle */}
        <Stack spacing={3} alignItems="center" textAlign="center">
          <Box
            sx={{
              width: 70,
              height: 70,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #FF2D55, #7000FF)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 20px rgba(255,45,85,0.3)",
            }}
          >
            {icon ? icon : <PhoneIphoneIcon sx={{ color: "#fff", fontSize: 35 }} />}
          </Box>

          {/* Title */}
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              letterSpacing: 0.5,
            }}
          >
            {title}
          </Typography>

          {/* Description */}
          <Typography
            sx={{
              fontSize: "0.9rem",
              color: "rgba(255,255,255,0.75)",
              lineHeight: 1.6,
            }}
          >
            {description}
          </Typography>

          <Stack direction="row" spacing={2} sx={{ width: "100%" }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={onClose}
              sx={{
                borderRadius: 3,
                fontWeight: 600,
                py: 1.2,
                borderColor: "rgba(255,255,255,0.3)",
                color: "#fff",
                "&:hover": {
                  borderColor: "#FF2D55",
                  backgroundColor: "rgba(255,45,85,0.1)",
                },
              }}
            >
              {cancelText.toUpperCase()}
            </Button>

            {onConfirm && (
              <Button
                fullWidth
                onClick={onConfirm}
                sx={{
                  borderRadius: 3,
                  fontWeight: 700,
                  py: 1.2,
                  background: "linear-gradient(90deg, #FF2D55, #7000FF)",
                  color: "#fff",
                  "&:hover": {
                    opacity: 0.9,
                  },
                }}
              >
                {confirmText.toUpperCase()}
              </Button>
            )}
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default CustomDialog;
