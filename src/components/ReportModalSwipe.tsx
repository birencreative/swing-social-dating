"use client";
import React from "react";
import {
    Modal,
    Fade,
    Box,
    Typography,
    FormControlLabel,
    Checkbox,
    Button,
    CircularProgress,
} from "@mui/material";
import { toast } from "react-toastify";
import { jwtDecode } from "jwt-decode";

interface ReportModaSwipeProps {
    open: boolean;
    onClose: () => void;
    currentProfile: any;
    profileId: string | undefined;
    onReportSuccess?: () => void;
}

const ReportModalSwipe: React.FC<ReportModaSwipeProps> = ({
    open,
    onClose,
    currentProfile,
    profileId,
    onReportSuccess,
}) => {
    const [reportOptions, setReportOptions] = React.useState({
        reportUser: false,
        blockUser: false,
        reportImage: false,
    });
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const reportImageApi = async (image: string) => {
        if (!currentProfile || !profileId) return false;

        const token = localStorage.getItem("loginInfo");
        const decodeToken = token ? jwtDecode<any>(token) : {};
        const reportedByName = decodeToken?.profileName || "Me";

        try {
            const response = await fetch("/api/user/reportedUser", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    reportedById: profileId,
                    reportedByName,
                    reportedUserId: currentProfile?.Id,
                    reportedUserName: currentProfile?.Username,
                    image,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data?.message || "Failed to report image.");
                return false;
            }

            toast.success("Image reported successfully!");
            return true;
        } catch (err) {
            console.error("Error reporting image:", err);
            toast.error("Error reporting image.");
            return false;
        }
    };

    const handleReportSubmit = async () => {
        if (!currentProfile || !profileId) return;

        setIsSubmitting(true);

        try {
            if (reportOptions.reportImage) {
                await reportImageApi(currentProfile?.Avatar);
            }

            if (reportOptions.reportUser || reportOptions.blockUser) {
                const res = await fetch("/api/user/sweeping/report", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        profileid: profileId,
                        targetid: currentProfile?.Id,
                    }),
                });

                if (!res.ok) {
                    toast.error("Failed to report user.");
                    return;
                }

                toast.success("User reported successfully");
            }

            if (
                reportOptions.reportImage ||
                reportOptions.reportUser ||
                reportOptions.blockUser
            ) {
                onClose();
                setReportOptions({
                    reportUser: false,
                    blockUser: false,
                    reportImage: false,
                });
                onReportSuccess?.();
            }
        } catch (err) {
            toast.error("An error occurred while reporting.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        onClose();
        setReportOptions({
            reportUser: false,
            blockUser: false,
            reportImage: false,
        });
    };

    return (
        <Modal open={open} onClose={handleClose} closeAfterTransition>
            <Fade in={open}>
                <Box
                    sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: 300,
                        bgcolor: "#1E1E1E",
                        borderRadius: 2,
                        boxShadow: 24,
                        p: 4,
                    }}
                >
                    <Typography variant="h6" color="white" gutterBottom>
                        Report or Block User
                    </Typography>

                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={reportOptions.reportImage}
                                onChange={(e) =>
                                    setReportOptions((prev) => ({
                                        ...prev,
                                        reportImage: e.target.checked,
                                    }))
                                }
                                sx={{
                                    color: "#f50057",
                                    "&.Mui-checked": { color: "#f50057" },
                                }}
                            />
                        }
                        label="Inappropriate Image"
                        sx={{ color: "white", display: "block", mb: 1 }}
                    />

                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={reportOptions.reportUser}
                                onChange={(e) =>
                                    setReportOptions((prev) => ({
                                        ...prev,
                                        reportUser: e.target.checked,
                                    }))
                                }
                                sx={{
                                    color: "#f50057",
                                    "&.Mui-checked": { color: "#f50057" },
                                }}
                            />
                        }
                        label="Report User"
                        sx={{ color: "white", display: "block", mb: 1 }}
                    />

                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={reportOptions.blockUser}
                                onChange={(e) =>
                                    setReportOptions((prev) => ({
                                        ...prev,
                                        blockUser: e.target.checked,
                                    }))
                                }
                                sx={{
                                    color: "#f50057",
                                    "&.Mui-checked": { color: "#f50057" },
                                }}
                            />
                        }
                        label="Block User"
                        sx={{ color: "white", display: "block", mb: 2 }}
                    />

                    <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
                        <Button
                            variant="contained"
                            onClick={handleClose}
                            sx={{
                                bgcolor: "#333",
                                color: "#fff",
                                "&:hover": { bgcolor: "#444" },
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleReportSubmit}
                            sx={{
                                bgcolor: "#f50057",
                                color: "#fff",
                                "&:hover": { bgcolor: "#c51162" },
                            }}
                        >
                            {isSubmitting ? (
                                <CircularProgress size={24} color="inherit" />
                            ) : (
                                "Submit"
                            )}
                        </Button>
                    </Box>
                </Box>
            </Fade>
        </Modal>
    );
};

export default ReportModalSwipe;