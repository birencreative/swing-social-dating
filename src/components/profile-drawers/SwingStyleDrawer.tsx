"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Chip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { Check } from "lucide-react";
import {
  sharedDrawerProps,
  headerHeight,
  FloatingSaveBtn,
} from "./SharedHelper";

const SWING_OPTIONS = [
  {
    id: "exploring",
    label: "Exploring/Unsure",
    description: "New to the lifestyle or still finding your preferences"
  },
  {
    id: "fullSwap",
    label: "Full Swap",
    description: "Interested in full sexual exchange with other couples"
  },
  {
    id: "softSwap",
    label: "Soft Swap",
    description: "Interested in everything except full intercourse"
  },
  {
    id: "voyeur",
    label: "Voyeur",
    description: "Prefer to watch and enjoy the energy of others"
  },
];

interface SwingStyleDrawerProps {
  open: boolean;
  onClose: () => void;
  profileId: string;
  currentStyles: string[];
  onSuccess: (newStyles: string[]) => void;
  onNotify: (message: string, severity: "success" | "error" | "info") => void;
}

const SwingStyleDrawer: React.FC<SwingStyleDrawerProps> = ({
  open,
  onClose,
  profileId,
  currentStyles,
  onSuccess,
  onNotify,
}) => {
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedStyles(currentStyles || []);
    }
  }, [open, currentStyles]);

  const toggleStyle = (id: string) => {
    setSelectedStyles((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/user/profile/update-swingstyle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ProfileId: profileId, styles: selectedStyles }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to update swing styles");
      }

      onNotify("Swing Styles updated successfully!", "success");
      onSuccess(selectedStyles);
      onClose();
    } catch (error: any) {
      console.error(error);
      onNotify(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer open={open} onClose={onClose} {...sharedDrawerProps}>
      <Box
        sx={{
          maxWidth: 500,
          mx: "auto",
          width: "100%",
          height: "100%",
          position: "relative",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box
          sx={{
            height: headerHeight,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 1,
          }}
        >
          <Box sx={{ width: 40 }} />
          <Box sx={{ display: "flex", justifyContent: "center", flex: 1 }}>
            <Box
              sx={{
                width: 48,
                height: 5,
                borderRadius: 99,
                background: "linear-gradient(90deg, #FF2D55, #7000FF)",
                mt: 0.5,
                opacity: 0.6,
              }}
            />
          </Box>
          <IconButton onClick={onClose} sx={{ color: "white", width: 40 }}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider
          sx={{
            background: "linear-gradient(90deg, #FF2D55, #7000FF)",
            height: "2px",
            border: "none",
          }}
        />

        <Box sx={{ overflowY: "auto", px: 2, py: 4 }}>
          <Typography
            variant="h5"
            align="center"
            sx={{ fontWeight: 800, mb: 1, color: "#fff" }}
          >
            Swing Styles
          </Typography>
          <Typography
            align="center"
            sx={{ color: "rgba(255,255,255,0.5)", mb: 4, fontSize: "0.95rem" }}
          >
            Select the styles that best describe you.
          </Typography>

          <Stack spacing={2}>
            {SWING_OPTIONS.map((option) => {
              const isSelected = selectedStyles.includes(option.id);
              return (
                <Box
                  key={option.id}
                  onClick={() => toggleStyle(option.id)}
                  sx={{
                    p: 2,
                    borderRadius: "20px",
                    background: isSelected
                      ? "rgba(255,45,149,0.08)"
                      : "rgba(255,255,255,0.03)",
                    border: "1px solid",
                    borderColor: isSelected
                      ? "#FF2D55"
                      : "rgba(255,255,255,0.08)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    "&:hover": {
                      background: isSelected
                        ? "rgba(255,45,149,0.12)"
                        : "rgba(255,255,255,0.06)",
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: "6px",
                      border: "2px solid",
                      borderColor: isSelected ? "#FF2D55" : "rgba(255,255,255,0.3)",
                      background: isSelected ? "#FF2D55" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.2s ease",
                      flexShrink: 0,
                    }}
                  >
                    {isSelected && <Check size={16} color="#fff" strokeWidth={4} />}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      sx={{
                        color: "#fff",
                        fontWeight: 800,
                        fontSize: "1rem",
                        lineHeight: 1.2,
                      }}
                    >
                      {option.label}
                    </Typography>
                    <Typography
                      sx={{
                        color: "rgba(255,255,255,0.4)",
                        fontSize: "0.80rem",
                        mt: 0.5,
                      }}
                    >
                      {option.description}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Stack>
        </Box>

        <Box sx={{ p: 4, display: "flex", justifyContent: "center" }}>
          <FloatingSaveBtn
            onClick={handleSave}
            loading={loading}
            label="Save Changes"
          />
        </Box>
      </Box>
    </Drawer>
  );
};

export default SwingStyleDrawer;
