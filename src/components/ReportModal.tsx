"use client";

import React, { memo } from "react";
import {
  Box,
  Typography,
  Modal,
  Fade,
  Backdrop,
  Stack,
  Checkbox,
  Button,
  CircularProgress,
} from "@mui/material";
import { Flag } from "lucide-react";

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
  options: {
    reportUser: boolean;
    blockUser: boolean;
    reportImage: boolean;
  };
  setOptions: (options: any) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

const ReportModal = ({
  open,
  onClose,
  options,
  setOptions,
  onSubmit,
  isSubmitting,
}: ReportModalProps) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{
        backdrop: {
          timeout: 500,
          sx: { background: "rgba(10, 5, 20, 0.9)", backdropFilter: "blur(8px)" },
        },
      }}
    >
      <Fade in={open}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "90%", sm: 380 },
            background: "rgba(25, 15, 45, 0.98)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "24px",
            px: 3,
            pt: 3,
            pb: 2,
            boxShadow: "0 40px 80px rgba(0,0,0,0.6)",
            outline: "none",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Compact Header with Icon */}
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "12px",
                background: "rgba(255, 45, 85, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FF2D55",
              }}
            >
              <Flag size={20} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ color: "#fff", fontWeight: 900, lineHeight: 1.2 }}>
                Report Content
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem" }}>
                Help us keep the community safe
              </Typography>
            </Box>
          </Stack>

          <Stack spacing={1.2} sx={{ width: "100%", mb: 3 }}>
            {[
              { id: "reportImage", label: "Inappropriate Media" },
              { id: "reportUser", label: "Report User" },
              { id: "blockUser", label: "Block User" },
            ].map((option: any) => {
              const optId = option.id as keyof typeof options;
              return (
                <Box
                  key={option.id}
                  onClick={() => setOptions({ ...options, [optId]: !options[optId] })}
                  sx={{
                    p: 1.5,
                    borderRadius: "16px",
                    background: options[optId]
                      ? "rgba(255, 45, 149, 0.1)"
                      : "rgba(255, 255, 255, 0.03)",
                    border: "1px solid",
                    borderColor: options[optId]
                      ? "#FF2D95"
                      : "rgba(255, 255, 255, 0.08)",
                    cursor: "pointer",
                    transition: "all 0.1s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                  }}
                >
                  <Checkbox
                    checked={options[optId]}
                    size="small"
                    sx={{ p: 0, "&.Mui-checked": { color: "#FF2D95" } }}
                  />
                  <Typography sx={{ color: "#fff", fontWeight: 600, fontSize: "0.9rem" }}>
                    {option.label}
                  </Typography>
                </Box>
              );
            })}
          </Stack>

          <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 1 }}>
            <Button
              fullWidth
              variant="contained"
              onClick={onSubmit}
              disabled={isSubmitting}
              sx={{
                py: 1.2,
                borderRadius: "12px",
                color: "#fff",
                background: "linear-gradient(135deg, #FF2D55 0%, #FF2D95 100%)",
                textTransform: "none",
                fontWeight: 800,
                fontSize: "0.95rem",
              }}
            >
              {isSubmitting ? <CircularProgress size={22} color="inherit" /> : "Submit"}
            </Button>
            <Button
              fullWidth
              onClick={onClose}
              sx={{
                color: "rgba(255,255,255,0.3)",
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.85rem",
                py: 1,
              }}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};

export default memo(ReportModal);
