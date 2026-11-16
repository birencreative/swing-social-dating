import React from "react";
import { Box, Typography, Button, Stack } from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";

interface NoProfilesStateProps {
    onAdjustPreferences: () => void;
}

const NoProfilesState: React.FC<NoProfilesStateProps> = ({
    onAdjustPreferences,
}) => {
    return (
        <Box
            sx={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                color: "#fff",
                px: 2,
                pointerEvents: "auto",
                touchAction: "auto",
            }}
        >
            <Box
                sx={{
                    width: "100%",
                    maxWidth: 360,
                    p: 3,
                    borderRadius: "20px",
                    background: "rgba(20, 10, 35, 0.85)",
                    backdropFilter: "blur(25px)",
                    border: "2px solid rgba(255,255,255,0.08)",
                }}
            >
                <Stack spacing={2} alignItems="center">
                    {/* Icon */}
                    <Box
                        sx={{
                            width: 70,
                            height: 70,
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, #FF2D55, #7000FF)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <FavoriteIcon sx={{ color: "#fff", fontSize: 30 }} />
                    </Box>

                    {/* Title */}
                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 800,
                            letterSpacing: 0.3,
                            fontSize: "1.2rem",
                        }}
                    >
                        No more profiles right now
                    </Typography>

                    {/* Description */}
                    <Typography
                        sx={{
                            fontSize: "0.9rem",
                            color: "rgba(255,255,255,0.75)",
                            lineHeight: 1.6,
                        }}
                    >
                        You’ve seen everyone that matches your current preferences. Try
                        adjusting them to discover more people.
                    </Typography>

                    {/* Suggestion card */}
                    <Box
                        sx={{
                            width: "100%",
                            p: 1.6,
                            borderRadius: "14px",
                            background:
                                "linear-gradient(135deg, rgba(112,0,255,0.14), rgba(255,45,85,0.08))",
                            border: "1.5px solid rgba(155, 77, 255, 0.4)",
                            textAlign: "left",
                        }}
                    >
                        <Typography
                            sx={{
                                fontSize: "0.9rem",
                                fontWeight: 700,
                                color: "#9B4DFF",
                                mb: 0.6,
                            }}
                        >
                            Try adjusting:
                        </Typography>

                        <Typography
                            sx={{
                                fontSize: "0.85rem",
                                color: "rgba(255,255,255,0.75)",
                                lineHeight: 1.6,
                            }}
                        >
                            • Max distance or location
                            <br />• Gender or partner preferences
                        </Typography>
                    </Box>

                    {/* Button */}
                    <Button
                        fullWidth
                        onClick={onAdjustPreferences}
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
                        Adjust Preferences
                    </Button>

                    {/* Footer text */}
                    <Typography
                        sx={{
                            fontSize: "0.75rem",
                            color: "rgba(255,255,255,0.5)",
                        }}
                    >
                        Check back later for new matches ✨
                    </Typography>
                </Stack>
            </Box>
        </Box>
    );
};

export default NoProfilesState;