"use client";
import React from "react";
import {
    Dialog,
    DialogContent,
    Button,
    Typography,
    Stack,
    Box,
} from "@mui/material";
import { motion } from "framer-motion";
import BoltIcon from "@mui/icons-material/Bolt";
import { useRouter } from "next/navigation";

interface DailyLimitPopupProps {
    open: boolean;
    onClose: () => void;
}

const DailyLimitPopup: React.FC<DailyLimitPopupProps> = ({
    open,
    onClose,
}) => {
    const router = useRouter();

    return (
        <Dialog
            open={open}
            onClose={(event, reason) => {
                if (reason === "backdropClick" || reason === "escapeKeyDown") return;
                onClose();
            }}
            BackdropProps={{
                sx: {
                    backdropFilter: "blur(12px)",
                    backgroundColor: "rgba(0,0,0,0.7)",
                },
            }}
            PaperProps={{
                component: motion.div,
                initial: { opacity: 0, scale: 0.9, y: 20 },
                animate: { opacity: 1, scale: 1, y: 0 },
                sx: {
                    width: "100%",
                    maxWidth: 400,
                    borderRadius: "28px",
                    margin: 2,
                    p: 4,
                    background: "rgba(20, 10, 35, 0.85)",
                    backdropFilter: "blur(25px)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#fff",
                    overflow: "visible",
                    position: "relative",
                },
            }}
        >
            <DialogContent sx={{ p: 0, overflow: "visible" }}>
                <Stack spacing={4} alignItems="center" textAlign="center">
                    {/* Icon/Visual Header */}
                    <Box sx={{ position: "relative" }}>
                        <Box
                            component={motion.div}
                            animate={{
                                scale: [1, 1.1, 1],
                                opacity: [0.5, 0.8, 0.5],
                            }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            sx={{
                                position: "absolute",
                                inset: -20,
                                borderRadius: "50%",
                                background:
                                    "radial-gradient(circle, rgba(255, 45, 85, 0.3) 0%, transparent 70%)",
                            }}
                        />
                        <Box
                            sx={{
                                width: 80,
                                height: 80,
                                borderRadius: "24px",
                                background: "linear-gradient(135deg, #FF2D55 0%, #7000FF 100%)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transform: "rotate(-5deg)",
                            }}
                        >
                            <BoltIcon sx={{ color: "#fff", fontSize: 40 }} />
                        </Box>
                    </Box>

                    {/* Content */}
                    <Box>
                        <Typography
                            variant="h5"
                            sx={{
                                fontWeight: 800,
                                fontSize: "1.5rem",
                                mb: 1,
                                background: "linear-gradient(to bottom, #fff, #ccc)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                            }}
                        >
                            Daily Limit Reached
                        </Typography>
                        <Typography
                            sx={{
                                fontSize: "0.95rem",
                                color: "rgba(255,255,255,0.6)",
                                lineHeight: 1.6,
                            }}
                        >
                            You've reached your daily quota of{" "}
                            <Box component="span" sx={{ color: "#FF2D55", fontWeight: 700 }}>
                                30 swipes
                            </Box>.
                        </Typography>
                    </Box>

                    {/* Restore Info */}
                    <Box
                        sx={{
                            width: "100%",
                            p: 2,
                            background: "rgba(255, 255, 255, 0.03)",
                            borderRadius: "16px",
                            border: "1px solid rgba(255, 255, 255, 0.08)",
                            display: "flex",
                            flexDirection: "column",
                            gap: 1,
                        }}
                    >
                        <Typography
                            sx={{
                                fontSize: "0.9rem",
                                color: "rgba(255,255,255,0.6)",
                                textAlign: "center",
                            }}
                        >
                            You have reached your 30 swipe limit for today.
                        </Typography>
                        <Typography
                            sx={{
                                fontSize: "0.8rem",
                                color: "rgba(255,255,255,0.4)",
                                textAlign: "center",
                            }}
                        >
                            Come back tomorrow or upgrade for unlimited access!
                        </Typography>
                    </Box>

                    {/* Action Buttons */}
                    <Stack direction="column" spacing={2} sx={{ width: "100%" }}>
                        <Button
                            fullWidth
                            onClick={() => router.push("/membership")}
                            sx={{
                                borderRadius: "16px",
                                fontWeight: 800,
                                py: 1.8,
                                fontSize: "1rem",
                                textTransform: "none",
                                background: "linear-gradient(90deg, #FF2D55, #7000FF)",
                                color: "#fff",
                                "&:hover": {
                                    transform: "translateY(-2px)",
                                    boxShadow: "0 15px 35px rgba(255, 45, 85, 0.5)",
                                    opacity: 0.9,
                                },
                            }}
                        >
                            Upgrade to Premium ✨
                        </Button>
                        <Button
                            fullWidth
                            onClick={onClose}
                            sx={{
                                borderRadius: "16px",
                                fontWeight: 600,
                                py: 1.2,
                                fontSize: "0.9rem",
                                textTransform: "none",
                                color: "rgba(255,255,255,0.5)",
                                "&:hover": {
                                    color: "#fff",
                                    background: "rgba(255,255,255,0.05)",
                                },
                            }}
                        >
                            Maybe Later
                        </Button>
                    </Stack>
                </Stack>
            </DialogContent>
        </Dialog>
    );
};

export default DailyLimitPopup;