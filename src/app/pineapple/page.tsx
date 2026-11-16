"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { toast } from "react-toastify";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Typography,
  Grid,
  IconButton,
  Modal,
  Button,
  Card,
  CardContent,
  Container,
  CircularProgress,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import FlagIcon from "@mui/icons-material/Flag";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import BlockIcon from "@mui/icons-material/Block";
import ReportIcon from "@mui/icons-material/Report";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { notify, handleGeolocationError } from "@/lib/notifications";
import UserProfileModal from "@/components/UserProfileModal";
import ProfileImgCheckerModel from "@/components/ProfileImgCheckerModel";
import AppFooterMobile from "@/layout/AppFooterMobile";
import AppFooterDesktop from "@/layout/AppFooterDesktop";
import AppHeaderMobile from "@/layout/AppHeaderMobile";
import AppHeaderDesktop from "@/layout/AppHeaderDesktop";
import Loader from "@/commonPage/Loader";

interface User {
  Id: string;
  Avatar: string;
  Username: string;
  DateOfBirth?: string;
  Age?: string;
  Gender?: string;
  PartnerDateOfBirth?: string;
  PartnerAge?: string;
  PartnerGender?: string;
  Location: string;
  Distance: string;
  LastOnline: string;
  IsAvatarNsfw?: boolean;
  IsVerified?: boolean | string | number;
  is_verified?: boolean | string | number;
  isVerified?: boolean | string | number;
  verified?: boolean | string | number;
  Verified?: boolean | string | number;
  selfie_verification_status?: string | boolean | number;
  selfie_verified?: string | boolean | number;
  verification_status?: string | boolean | number;
  VerificationStatus?: string | boolean | number;
}

interface ReportOptions {
  reportUser: boolean;
  blockUser: boolean;
  reportImage: boolean;
}

const checkVerified = (val: any) => {
  if (val === true || val === 1 || val === "1" || val === "true" || val === "TRUE") return true;
  if (typeof val === "string") {
    const lower = val.toLowerCase();
    if (lower === "approved" || lower === "verified" || lower === "completed" || lower === "success") return true;
  }
  return false;
};

const isUserVerified = (user: User) =>
  checkVerified(user.IsVerified) ||
  checkVerified(user.is_verified) ||
  checkVerified(user.isVerified) ||
  checkVerified(user.verified) ||
  checkVerified(user.Verified) ||
  checkVerified(user.selfie_verification_status) ||
  checkVerified(user.selfie_verified) ||
  checkVerified(user.verification_status) ||
  checkVerified(user.VerificationStatus);

const getDisplayAge = (age: any, dob: string | null | undefined) => {
  const ageNum = parseInt(age || "0");
  if (ageNum > 18) return ageNum;
  if (dob) {
    const d = new Date(dob);
    const today = new Date();
    let calculatedAge = today.getFullYear() - d.getFullYear();
    const m = today.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < d.getDate())) calculatedAge--;
    return calculatedAge > 18 ? calculatedAge : null;
  }
  return null;
};

const getGenderChar = (g?: string) => {
  if (g === "Male") return "M";
  if (g === "Female") return "F";
  return "";
};

const getAgeGenderDisplay = (user: User) => {
  const userAge = getDisplayAge(user.Age, user.DateOfBirth);
  const partnerAge = getDisplayAge(user.PartnerAge, user.PartnerDateOfBirth);
  const userStr = userAge ? `${userAge} ${getGenderChar(user.Gender)}`.trim() : "";
  const partnerStr = partnerAge ? ` | ${partnerAge} ${getGenderChar(user.PartnerGender)}` : "";
  return `${userStr}${partnerStr}`.trim();
};

export default function Pineapple() {
  const router = useRouter();
  const theme = useTheme();
  const isMobileOrTablet = useMediaQuery(theme.breakpoints.down("md"));

  const [profileId, setProfileId] = useState<string>("");
  const [showDetail, setShowDetail] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [revealedUsers, setRevealedUsers] = useState<Set<string>>(new Set());

  const pushedStateRef = useRef(false);
  const showDetailRef = useRef(showDetail);

  useEffect(() => {
    showDetailRef.current = showDetail;
  }, [showDetail]);

  useEffect(() => {
    const onPopState = () => {
      if (showDetailRef.current && window.history.state?.modal !== "userProfile") {
        pushedStateRef.current = false;
        setShowDetail(false);
      }
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (showDetail && !pushedStateRef.current) {
      window.history.pushState({ modal: "userProfile" }, "");
      pushedStateRef.current = true;
    } else if (!showDetail && pushedStateRef.current) {
      if (window.history.state?.modal === "userProfile") {
        window.history.back();
      }
      pushedStateRef.current = false;
    }
  }, [showDetail]);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportOptions, setReportOptions] = useState<ReportOptions>({
    reportUser: false,
    blockUser: false,
    reportImage: false,
  });

  useEffect(() => {
    const token = localStorage.getItem("loginInfo");
    if (token) {
      try {
        const decodeToken = jwtDecode<any>(token);
        setProfileId(decodeToken?.profileId);
      } catch (e) {
        router.push("/login");
      }
    } else {
      router.push("/login");
    }
  }, [router]);

  const { data: pineapple = [], isLoading: loading, refetch } = useQuery<User[]>({
    queryKey: ['pineapples', profileId],
    queryFn: async () => {
      if (!profileId) return [];
      const response = await fetch(`/api/user/pineapple?id=${profileId}`);
      if (!response.ok) throw new Error("Failed to fetch");
      const { pineapples } = await response.json();
      return pineapples || [];
    },
    enabled: !!profileId,
    refetchInterval: 30000,
  });

  const handleImageClick = (user: User) => {
    if (user.IsAvatarNsfw && !revealedUsers.has(user.Id)) {
      setRevealedUsers((prev) => new Set(prev).add(user.Id));
      return;
    }
    setShowDetail(true);
    setSelectedUserId(user.Id);
  };

  const sendLocationToAPI = useCallback(async (locationName: string, latitude: number, longitude: number) => {
    if (!profileId) return;
    try {
      await fetch("/api/user/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId, locationName, latitude, longitude }),
      });
    } catch (error) {
      console.error("Error sending location:", error);
    }
  }, [profileId]);

  const getLocationName = async (latitude: number, longitude: number) => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyBEr0k_aQ_Sns6YbIQ4UBxCUTdPV9AhdF0";
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
      );
      const data = await response.json();
      if (data.status === "OK" && data.results.length > 0) {
        return data.results[0].formatted_address;
      }
    } catch (error) {
      console.error("Geocoding error:", error);
    }
    return "Unknown Location";
  };

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      notify.location.notSupported();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const locationName = await getLocationName(latitude, longitude);
        await sendLocationToAPI(locationName, latitude, longitude);
      },
      (error) => handleGeolocationError(error),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }, [sendLocationToAPI]);

  useEffect(() => {
    if (profileId) {
      getCurrentLocation();
    }
  }, [profileId, getCurrentLocation]);

  const handleReportModalToggle = (pid: string | null) => {
    setTargetId(pid);
    setIsReportModalOpen(!!pid);
    if (!pid) {
      setReportOptions({ reportUser: false, blockUser: false, reportImage: false });
    }
  };

  const handleCheckboxChange = (name: keyof ReportOptions) => {
    setReportOptions({
      reportUser: name === "reportUser",
      blockUser: name === "blockUser",
      reportImage: name === "reportImage",
    });
  };

  const handleReportSubmit = async () => {
    if (!targetId || !profileId) return;
    setIsSubmitting(true);

    const targetUser = pineapple.find((u) => u.Id === targetId);
    const reportedUserName = targetUser?.Username || "Unknown";
    const reportedUserImage = targetUser?.Avatar || "";

    const token = localStorage.getItem("loginInfo");
    const decodeToken = token ? jwtDecode<any>(token) : {};
    const reportedByName = decodeToken?.profileName || "Me";

    try {
      if (reportOptions.reportImage) {
        await fetch("/api/user/reportedUser", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reportedById: profileId,
            reportedByName,
            reportedUserId: targetId,
            reportedUserName,
            image: reportedUserImage,
          }),
        });
      }

      if (reportOptions.reportUser || reportOptions.blockUser) {
        await fetch("/api/user/sweeping/report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profileid: profileId, targetid: targetId }),
        });
      }

      toast.success("Report submitted successfully");
      setIsReportModalOpen(false);
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatLastOnline = (isoString: string): { label: string; isRecent: boolean } => {
    const last = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - last.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 5) return { label: "Online now", isRecent: true };
    if (diffMins < 60) return { label: `Active ${diffMins}m ago`, isRecent: true };
    if (diffHours < 24) return { label: `Active ${diffHours}h ago`, isRecent: false };
    if (diffDays === 1) return { label: "Active yesterday", isRecent: false };
    if (diffDays < 7) return { label: `Active ${diffDays}d ago`, isRecent: false };
    return { label: `Active ${Math.floor(diffDays / 7)}w ago`, isRecent: false };
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        backgroundColor: "#120820",
        background: "linear-gradient(135deg, #120820 0%, #0d0518 50%, #0a0415 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Top Right Glow Blob (Exact match to Expo bgGlowTop) */}
      <Box
        sx={{
          position: "absolute",
          top: -130,
          right: -90,
          width: 270,
          height: 270,
          borderRadius: 270,
          backgroundColor: "rgba(194, 24, 91, 0.22)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Bottom Left Glow Blob (Exact match to Expo bgGlowBottom) */}
      <Box
        sx={{
          position: "absolute",
          bottom: -170,
          left: -110,
          width: 280,
          height: 280,
          borderRadius: 280,
          backgroundColor: "rgba(194, 24, 91, 0.15)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <Box sx={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        {isMobileOrTablet ? <AppHeaderMobile /> : <AppHeaderDesktop />}
        {profileId && <ProfileImgCheckerModel profileId={profileId} />}

        {loading && pineapple.length === 0 ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", flexGrow: 1, minHeight: "calc(100vh - 140px)" }}>
            <Loader />
          </Box>
        ) : (
          <Box
            sx={{
              flexGrow: 1,
              pt: { xs: 2, md: 16 },
              pb: { xs: 12, md: 6 },
            }}
          >
            <Container maxWidth="xl">
              {/* Header section matching Expo style */}
              <Box sx={{ mb: { xs: 2.5, md: 4 }, px: { xs: 0.5, md: 0 } }}>
                <Typography
                  sx={{
                    color: "#FF1B6B",
                    fontSize: { xs: "1.65rem", sm: "2rem", md: "2.2rem" },
                    fontWeight: 800,
                    letterSpacing: "0.02em",
                    mb: 0.3,
                  }}
                >
                  Pineapple
                </Typography>
                <Typography
                  sx={{
                    color: "rgba(255, 255, 255, 0.6)",
                    fontSize: { xs: "0.85rem", sm: "0.95rem" },
                    fontWeight: 500,
                  }}
                >
                  Recently active profiles nearby
                </Typography>
              </Box>

              {/* Empty State */}
              {pineapple.length === 0 && !loading && (
                <Box
                  sx={{
                    py: 10,
                    px: 3,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "rgba(20, 10, 35, 0.4)",
                    borderRadius: 6,
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    textAlign: "center",
                    my: 4,
                  }}
                >
                  <Typography sx={{ fontSize: "3.5rem", mb: 2 }}>🍍</Typography>
                  <Typography sx={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "0.95rem", fontWeight: 600, mb: 3, maxWidth: 360 }}>
                    No active profiles nearby at this moment.
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => refetch()}
                    sx={{
                      backgroundColor: "#c2185b",
                      color: "#fff",
                      fontWeight: 800,
                      px: 3.5,
                      py: 1.2,
                      borderRadius: 3,
                      textTransform: "none",
                      boxShadow: "0 8px 20px rgba(194, 24, 91, 0.35)",
                      "&:hover": { backgroundColor: "#d81b60" },
                    }}
                  >
                    Tap to Retry
                  </Button>
                </Box>
              )}

              {/* Profile Cards Grid */}
              <Grid container spacing={{ xs: 1.5, sm: 2.5, md: 3 }}>
                {pineapple.map((user, index) => {
                  const verified = isUserVerified(user);
                  const ageGenderDisplay = getAgeGenderDisplay(user);

                  return (
                    <Grid item xs={6} sm={4} md={3} lg={3} key={user.Id}>
                      <Card
                        sx={{
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                          borderRadius: 4,
                          overflow: "hidden",
                          background: "#0d091a",
                          border: "1px solid #1d1530",
                          transition: "transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease",
                          "&:hover": {
                            transform: "translateY(-6px)",
                            boxShadow: "0 14px 30px rgba(0,0,0,0.5), 0 0 20px rgba(194, 24, 91, 0.15)",
                            borderColor: "rgba(194, 24, 91, 0.35)",
                          },
                        }}
                      >
                        <Box
                          sx={{
                            position: "relative",
                            aspectRatio: "3/3.85",
                            width: "100%",
                            cursor: "pointer",
                            overflow: "hidden",
                            backgroundColor: "#110b1a",
                          }}
                          onClick={() => handleImageClick(user)}
                        >
                          {/* Avatar Image with NSFW Blur */}
                          <Box
                            sx={{
                              width: "100%",
                              height: "100%",
                              position: "relative",
                              filter: user.IsAvatarNsfw && !revealedUsers.has(user.Id) ? "blur(45px)" : "none",
                              transition: "filter 0.4s ease-in-out",
                            }}
                          >
                            <Image
                              src={user.Avatar}
                              alt={user.Username}
                              fill
                              sizes="(max-width: 600px) 50vw, (max-width: 960px) 33vw, 25vw"
                              style={{ objectFit: "cover" }}
                              priority={index < 4}
                              className="transition-transform duration-500 hover:scale-105"
                            />
                          </Box>

                          {/* Verified Badge Overlay (Top Right of Avatar) */}
                          {verified && (
                            <Box
                              sx={{
                                position: "absolute",
                                top: 10,
                                right: 10,
                                backgroundColor: "rgba(2, 33, 21, 0.92)",
                                borderRadius: "20px",
                                px: 1.1,
                                py: 0.45,
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                                border: "1.5px solid #00E676",
                                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
                                zIndex: 12,
                              }}
                            >
                              <CheckCircleIcon sx={{ fontSize: 13, color: "#00E676" }} />
                              <Typography
                                sx={{
                                  color: "#00E676",
                                  fontSize: "0.65rem",
                                  fontWeight: 900,
                                  letterSpacing: "0.06em",
                                  lineHeight: 1,
                                }}
                              >
                                VERIFIED
                              </Typography>
                            </Box>
                          )}

                          {/* NSFW Sensitive Content Overlay */}
                          {user.IsAvatarNsfw && !revealedUsers.has(user.Id) && (
                            <Box
                              sx={{
                                position: "absolute",
                                inset: 0,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                zIndex: 10,
                                backgroundColor: "rgba(10, 5, 20, 0.65)",
                                textAlign: "center",
                                p: 1.5,
                              }}
                            >
                              <ReportIcon sx={{ color: "#fff", fontSize: { xs: 28, sm: 34 }, mb: 0.5, opacity: 0.9 }} />
                              <Typography
                                sx={{
                                  color: "#fff",
                                  fontWeight: 900,
                                  fontSize: { xs: "0.75rem", sm: "0.85rem" },
                                  textShadow: "0 2px 4px rgba(0,0,0,0.7)",
                                  lineHeight: 1.2,
                                }}
                              >
                                Sensitive Content
                              </Typography>
                              <Typography sx={{ color: "rgba(255,255,255,0.8)", fontSize: "0.68rem", mt: 0.5 }}>
                                Tap to reveal photo
                              </Typography>
                            </Box>
                          )}

                          {/* Bottom Gradient overlay */}
                          <Box
                            sx={{
                              position: "absolute",
                              bottom: 0,
                              left: 0,
                              right: 0,
                              height: "40%",
                              background: "linear-gradient(to top, rgba(13, 9, 26, 0.9) 0%, transparent 100%)",
                              zIndex: 1,
                            }}
                          />
                        </Box>

                        {/* Card Details Section matching Expo */}
                        <CardContent
                          sx={{
                            p: { xs: 1.2, sm: 2 },
                            "&:last-child": { pb: { xs: 1.2, sm: 2 } },
                            flexGrow: 1,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                          }}
                        >
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            {/* Left Column: Details */}
                            <Box sx={{ flex: 1, pr: 0.5, minWidth: 0 }}>
                              {/* Username */}
                              <Typography
                                variant="h6"
                                sx={{
                                  color: "#fff",
                                  fontWeight: 800,
                                  fontSize: { xs: "0.92rem", sm: "1.05rem" },
                                  lineHeight: 1.25,
                                  mb: 0.3,
                                }}
                                noWrap
                              >
                                {user.Username}
                              </Typography>

                              {/* Age & Gender Text */}
                              {ageGenderDisplay ? (
                                <Typography
                                  sx={{
                                    color: "#fff",
                                    fontWeight: 600,
                                    fontSize: { xs: "0.76rem", sm: "0.85rem" },
                                    mb: 0.5,
                                    opacity: 0.95,
                                  }}
                                  noWrap
                                >
                                  {ageGenderDisplay}
                                </Typography>
                              ) : null}

                              {/* Location Row */}
                              <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                                <LocationOnIcon sx={{ fontSize: 13, color: "#9C27B0", mr: 0.3, flexShrink: 0 }} />
                                <Typography
                                  sx={{ color: "rgba(255,255,255,0.7)", fontSize: { xs: "0.7rem", sm: "0.78rem" } }}
                                  noWrap
                                >
                                  {user.Location?.replace(", USA", "")} • {user.Distance}
                                </Typography>
                              </Box>

                              {/* Online Status Row */}
                              {user.LastOnline && (() => {
                                const { label, isRecent } = formatLastOnline(user.LastOnline);
                                return (
                                  <Box sx={{ display: "flex", alignItems: "center" }}>
                                    <Typography
                                      sx={{
                                        color: isRecent ? "#00e676" : "rgba(255,255,255,0.4)",
                                        fontSize: { xs: "0.68rem", sm: "0.75rem" },
                                        fontWeight: 600,
                                      }}
                                      noWrap
                                    >
                                      ● {label}
                                    </Typography>
                                  </Box>
                                );
                              })()}
                            </Box>

                            {/* Right Column: Cleanly aligned Action Buttons */}
                            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5, pl: 0.5 }}>
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowDetail(true);
                                  setSelectedUserId(user.Id);
                                }}
                                sx={{
                                  p: 0,
                                  transition: "transform 0.2s ease",
                                  "&:hover": { transform: "scale(1.15)" },
                                }}
                              >
                                <Box
                                  component="img"
                                  src="/icons/pineapple.png"
                                  alt="pineapple"
                                  sx={{ width: { xs: 26, sm: 30 }, height: { xs: 26, sm: 30 }, objectFit: "contain" }}
                                />
                              </IconButton>

                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReportModalToggle(user.Id);
                                }}
                                sx={{
                                  p: 0,
                                  color: "rgba(255,255,255,0.55)",
                                  transition: "color 0.2s ease, background 0.2s ease",
                                  "&:hover": { color: "#ff5252", backgroundColor: "rgba(255, 82, 82, 0.12)" },
                                }}
                              >
                                <FlagIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
                              </IconButton>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Container>
          </Box>
        )}

        {isMobileOrTablet ? <AppFooterMobile /> : <AppFooterDesktop />}
      </Box>

      {/* Report or Block User Modal */}
      <Modal
        open={isReportModalOpen}
        onClose={() => handleReportModalToggle(null)}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(20, 10, 35, 0.85)",
          backdropFilter: "blur(25px)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <Box
          sx={{
            width: { xs: "90%", sm: 420 },
            background: "rgba(20, 10, 35, 0.85)",
            backdropFilter: "blur(25px)",
            border: "1px solid rgba(255,255,255,0.08)",
            p: { xs: 3, sm: 4 },
            borderRadius: "20px",
            position: "relative",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* Top Circular Icon */}
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #FF2D55 0%, #7000FF 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 2,
            }}
          >
            <FlagIcon sx={{ fontSize: 35, color: "#fff" }} />
          </Box>

          <Typography
            variant="h5"
            sx={{
              color: "#fff",
              mb: 4,
              fontWeight: 800,
              textAlign: "center",
              letterSpacing: "-0.01em",
            }}
          >
            Report or Block User
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, width: "100%", mb: 4 }}>
            {/* Inappropriate Image Card */}
            <Box
              onClick={() => handleCheckboxChange("reportImage")}
              sx={{
                p: 2,
                borderRadius: 4,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 2,
                border: "2px solid",
                borderColor: reportOptions.reportImage ? "#9C27B0" : "rgba(156, 39, 176, 0.2)",
                background: reportOptions.reportImage ? "rgba(156, 39, 176, 0.1)" : "transparent",
                transition: "all 0.3s ease",
                "&:hover": { borderColor: "#9C27B0", background: "rgba(156, 39, 176, 0.05)" },
              }}
            >
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: "rgba(156, 39, 176, 0.2)", color: "#9C27B0" }}>
                <PhotoCameraIcon />
              </Box>
              <Box sx={{ flexGrow: 1 }}>
                <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.95rem" }}>Inappropriate Image</Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.75rem" }}>User profile contains explicit content</Typography>
              </Box>
              {reportOptions.reportImage && <CheckCircleIcon sx={{ color: "#9C27B0" }} />}
            </Box>

            {/* Report User Card */}
            <Box
              onClick={() => handleCheckboxChange("reportUser")}
              sx={{
                p: 2,
                borderRadius: 4,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 2,
                border: "2px solid",
                borderColor: reportOptions.reportUser ? "#FF9800" : "rgba(255, 152, 0, 0.2)",
                background: reportOptions.reportUser ? "rgba(255, 152, 0, 0.1)" : "transparent",
                transition: "all 0.3s ease",
                "&:hover": { borderColor: "#FF9800", background: "rgba(255, 152, 0, 0.05)" },
              }}
            >
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: "rgba(255, 152, 0, 0.2)", color: "#FF9800" }}>
                <ReportIcon />
              </Box>
              <Box sx={{ flexGrow: 1 }}>
                <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.95rem" }}>Report User</Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.75rem" }}>Bad behavior or harassment</Typography>
              </Box>
              {reportOptions.reportUser && <CheckCircleIcon sx={{ color: "#FF9800" }} />}
            </Box>

            {/* Block User Card */}
            <Box
              onClick={() => handleCheckboxChange("blockUser")}
              sx={{
                p: 2,
                borderRadius: 4,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 2,
                border: "2px solid",
                borderColor: reportOptions.blockUser ? "#f44336" : "rgba(244, 67, 54, 0.2)",
                background: reportOptions.blockUser ? "rgba(244, 67, 54, 0.1)" : "transparent",
                transition: "all 0.3s ease",
                "&:hover": { borderColor: "#f44336", background: "rgba(244, 67, 54, 0.05)" },
              }}
            >
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: "rgba(244, 67, 54, 0.2)", color: "#f44336" }}>
                <BlockIcon />
              </Box>
              <Box sx={{ flexGrow: 1 }}>
                <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.95rem" }}>Block User</Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.75rem" }}>Prevent user from contacting you</Typography>
              </Box>
              {reportOptions.blockUser && <CheckCircleIcon sx={{ color: "#f44336" }} />}
            </Box>
          </Box>

          <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 2 }}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleReportSubmit}
              disabled={isSubmitting || (!reportOptions.reportImage && !reportOptions.reportUser && !reportOptions.blockUser)}
              sx={{
                background: "linear-gradient(135deg, #FF2D95 0%, #9C27B0 100%)",
                borderRadius: 4,
                py: 1.5,
                fontWeight: 800,
                fontSize: "1rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                boxShadow: "0 10px 20px rgba(255, 45, 149, 0.3)",
                "&:hover": {
                  background: "linear-gradient(135deg, #E91E63 0%, #7B1FA2 100%)",
                  boxShadow: "0 15px 30px rgba(255, 45, 149, 0.4)",
                },
                "&:disabled": {
                  background: "rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.3)",
                }
              }}
            >
              {isSubmitting ? <CircularProgress size={24} color="inherit" /> : "Submit Report"}
            </Button>

            <Button
              fullWidth
              variant="text"
              onClick={() => handleReportModalToggle(null)}
              sx={{
                color: "rgba(255,255,255,0.6)",
                fontWeight: 600,
                "&:hover": { color: "#fff", background: "transparent" },
              }}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </Modal>

      <UserProfileModal
        handleGrantAccess={() => { }}
        open={showDetail}
        handleClose={() => setShowDetail(false)}
        userid={selectedUserId || ""}
      />
    </Box>
  );
}