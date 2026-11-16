"use client";
import React from "react";
import {
    Dialog,
    DialogContent,
    Button,
    Typography,
    Stack,
    Box,
    Avatar,
} from "@mui/material";
import { motion } from "framer-motion";
import FavoriteIcon from "@mui/icons-material/Favorite";
import { useRouter } from "next/navigation";

interface MatchPopupProps {
    open: boolean;
    onClose: () => void;
    matchedProfile: any;
    onViewProfile: (userId: string) => void;
}

const MatchPopup: React.FC<MatchPopupProps> = ({
    open,
    onClose,
    matchedProfile,
    onViewProfile,
}) => {
    const router = useRouter();

    if (!matchedProfile) return null;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            BackdropProps={{ sx: { backdropFilter: "blur(6px)" } }}
            PaperProps={{
                sx: {
                    width: "100%",
                    maxWidth: 380,
                    borderRadius: 4,
                    margin: 2,
                    p: 3,
                    background: "rgba(20, 10, 35, 0.95)",
                    backdropFilter: "blur(25px)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
                    color: "#fff",
                    overflow: "hidden",
                    "&::before": {
                        content: '""',
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: "1px",
                        background:
                            "linear-gradient(90deg, transparent, rgba(255,107,157,0.6), transparent)",
                    },
                },
            }}
        >
            <DialogContent sx={{ p: 0 }}>
                <Stack spacing={2.5} alignItems="center" textAlign="center">
                    {/* Matched avatars with heart */}
                    <Box sx={{ position: "relative", mt: 0.5 }}>
                        <Box
                            sx={{
                                position: "absolute",
                                inset: -10,
                                borderRadius: "50%",
                                background:
                                    "radial-gradient(circle, rgba(255,27,107,0.2) 0%, transparent 70%)",
                                animation: "pulse 2s ease-in-out infinite",
                                "@keyframes pulse": {
                                    "0%, 100%": { transform: "scale(1)", opacity: 0.5 },
                                    "50%": { transform: "scale(1.15)", opacity: 1 },
                                },
                            }}
                        />
                        <Avatar
                            src={matchedProfile.Avatar}
                            alt={matchedProfile.Username}
                            sx={{
                                width: 90,
                                height: 90,
                                border: "3px solid transparent",
                                backgroundImage:
                                    "linear-gradient(rgba(20,10,35,1), rgba(20,10,35,1)), linear-gradient(135deg, #FF2D55, #7000FF)",
                                backgroundOrigin: "border-box",
                                backgroundClip: "padding-box, border-box",
                            }}
                        />
                        <Box
                            sx={{
                                position: "absolute",
                                bottom: -4,
                                right: -4,
                                width: 28,
                                height: 28,
                                borderRadius: "50%",
                                background: "linear-gradient(135deg, #FF2D55, #7000FF)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                border: "2px solid rgba(20,10,35,1)",
                                fontSize: 14,
                            }}
                        >
                            ❤️
                        </Box>
                    </Box>

                    {/* Title */}
                    <Box>
                        <Typography
                            sx={{
                                fontWeight: 800,
                                fontSize: "1.3rem",
                                background:
                                    "linear-gradient(135deg, #FFB6C1, #FF6B9D, #FF2D55)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                letterSpacing: 0.3,
                                mb: 0.3,
                            }}
                        >
                            It's a Match! 🎉
                        </Typography>
                        <Typography
                            sx={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.45)" }}
                        >
                            You and{" "}
                            <strong style={{ color: "rgba(255,255,255,0.8)" }}>
                                {matchedProfile.Username}
                            </strong>{" "}
                            liked each other
                        </Typography>
                    </Box>

                    {/* Divider */}
                    <Box
                        sx={{
                            width: "100%",
                            height: "1px",
                            background:
                                "linear-gradient(90deg, transparent, rgba(255,107,157,0.3), transparent)",
                        }}
                    />

                    {/* Match info box */}
                    <Box
                        sx={{
                            width: "100%",
                            p: 1.8,
                            borderRadius: "12px",
                            background: "rgba(255,45,85,0.07)",
                            border: "1px solid rgba(255,45,85,0.2)",
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                            textAlign: "left",
                        }}
                    >
                        <FavoriteIcon
                            sx={{ color: "#FF2D55", fontSize: 20, flexShrink: 0 }}
                        />
                        <Typography
                            sx={{
                                fontSize: "0.8rem",
                                color: "rgba(255,255,255,0.65)",
                                lineHeight: 1.5,
                            }}
                        >
                            Start a conversation with{" "}
                            <strong style={{ color: "#fff" }}>
                                {matchedProfile.Username}
                            </strong>{" "}
                            or view their full profile.
                        </Typography>
                    </Box>

                    {/* Action buttons */}
                    <Stack direction="row" spacing={1.2} sx={{ width: "100%" }}>
                        <Button
                            fullWidth
                            variant="outlined"
                            onClick={onClose}
                            sx={{
                                borderRadius: "12px",
                                fontWeight: 600,
                                py: 1.1,
                                fontSize: "0.8rem",
                                textTransform: "none",
                                borderColor: "rgba(255,255,255,0.15)",
                                color: "rgba(255,255,255,0.6)",
                                "&:hover": {
                                    borderColor: "#FF2D55",
                                    backgroundColor: "rgba(255,45,85,0.08)",
                                    color: "#fff",
                                },
                            }}
                        >
                            Keep Swiping
                        </Button>

                        <Button
                            fullWidth
                            onClick={() => onViewProfile(matchedProfile?.Id)}
                            sx={{
                                borderRadius: "12px",
                                fontWeight: 700,
                                py: 1.1,
                                fontSize: "0.8rem",
                                textTransform: "none",
                                background: "rgba(255,255,255,0.08)",
                                color: "#fff",
                                border: "1px solid rgba(255,255,255,0.12)",
                                "&:hover": {
                                    background: "rgba(255,255,255,0.13)",
                                },
                            }}
                        >
                            View Profile
                        </Button>

                        <Button
                            fullWidth
                            onClick={() => router.push(`/messaging/${matchedProfile?.Id}`)}
                            sx={{
                                borderRadius: "12px",
                                fontWeight: 700,
                                py: 1.1,
                                fontSize: "0.8rem",
                                textTransform: "none",
                                background: "linear-gradient(90deg, #FF2D55, #7000FF)",
                                color: "#fff",
                                boxShadow: "0 4px 16px rgba(255,45,85,0.3)",
                                "&:hover": {
                                    opacity: 0.9,
                                    boxShadow: "0 6px 20px rgba(255,45,85,0.45)",
                                },
                            }}
                        >
                            Chat
                        </Button>
                    </Stack>
                </Stack>
            </DialogContent>
        </Dialog>
    );
};

export default MatchPopup;