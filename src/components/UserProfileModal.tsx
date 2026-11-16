"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Typography,
  Stack,
  Modal,
  Tooltip,
} from "@mui/material";
import { Block, CalendarMonth, ChatBubbleOutline, Close } from "@mui/icons-material";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { jwtDecode } from "jwt-decode";
import {
  LucideIcon,
  Calendar, MapPin, Clock, User,
  Palette,
  Eye,
  Heart,
  X,
  ChevronLeft,
  ChevronRight,
  Ruler,
  ShieldCheck,
  Flag,
  Ban,
  Fingerprint,
  Camera,
  Lock,
} from "lucide-react";
import CloseIcon from "@mui/icons-material/Close";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AccessibilityNewIcon from "@mui/icons-material/AccessibilityNew";
import ReportIcon from "@mui/icons-material/Report";

type DetailRowProps = {
  icon: LucideIcon;
  label: string;
  value?: string | number | null;
  isLast?: boolean;
};

interface UserProfileModalProps {
  handleGrantAccess: () => void;
  handleClose: () => void;
  open: boolean;
  userid: string | null;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({
  handleGrantAccess,
  handleClose,
  open,
  userid,
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [advertiser, setAdvertiser] = useState<any>({});
  const [events, setEvents] = useState<any>([]);
  const [rsvp, setRsvp] = useState<any>([]);
  const [selectedTab, setSelectedTab] = useState("All Events");
  const [grantOpen, setGrantOpen] = useState(false);
  const [privateOpen, setPrivateOpen] = useState(false);
  const [profileId, setProfileId] = useState<any>();
  const [profileImages, setProfileImages] = useState<any>([]);
  const [revealedAvatar, setRevealedAvatar] = useState(false);
  const [revealedBanner, setRevealedBanner] = useState(false);
  const [bannerError, setBannerError] = useState(false);
  const [userName, setUserName] = useState<string>("");
  const [activeTab, setActiveTab] = useState("public");
  const [isTaglineExpanded, setIsTaglineExpanded] = useState(false);

  const [isImageOpen, setIsImageOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const pushedImageStateRef = useRef(false);
  const isImageOpenRef = useRef(isImageOpen);

  useEffect(() => {
    isImageOpenRef.current = isImageOpen;
  }, [isImageOpen]);

  useEffect(() => {
    const onPopState = (event: PopStateEvent) => {
      if (isImageOpenRef.current && event.state?.modal !== "imagePreview") {
        pushedImageStateRef.current = false;
        setIsImageOpen(false);
      }
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (isImageOpen && !pushedImageStateRef.current) {
      window.history.pushState({ modal: "imagePreview" }, "");
      pushedImageStateRef.current = true;
    } else if (!isImageOpen && pushedImageStateRef.current) {
      if (window.history.state?.modal === "imagePreview") {
        window.history.back();
      }
      pushedImageStateRef.current = false;
    }
  }, [isImageOpen]);

  const handleOpenImage = (src?: string, index?: number, customList?: string[]) => {
    const list = customList && customList.length > 0
      ? customList
      : [
          advertiser?.Avatar,
          advertiser?.ProfileBanner,
          ...(profileImages || []).map((img: any) => img?.Url || img?.url),
        ].filter((u): u is string => typeof u === "string" && u.trim().length > 10);

    const validList = list.length > 0 ? Array.from(new Set(list)) : src ? [src] : [];
    if (validList.length === 0) return;

    setGalleryImages(validList);
    const targetSrc = src || validList[0];
    const foundIdx = index !== undefined ? index : validList.indexOf(targetSrc);
    const finalIdx = foundIdx >= 0 && foundIdx < validList.length ? foundIdx : 0;
    setGalleryIndex(finalIdx);
    setSelectedImage(validList[finalIdx]);
    setIsImageOpen(true);
  };

  const handlePrevImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (galleryImages.length <= 1) return;
    const nextIdx = galleryIndex > 0 ? galleryIndex - 1 : galleryImages.length - 1;
    setGalleryIndex(nextIdx);
    setSelectedImage(galleryImages[nextIdx]);
  };

  const handleNextImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (galleryImages.length <= 1) return;
    const nextIdx = galleryIndex < galleryImages.length - 1 ? galleryIndex + 1 : 0;
    setGalleryIndex(nextIdx);
    setSelectedImage(galleryImages[nextIdx]);
  };

  useEffect(() => {
    if (!isImageOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handlePrevImage();
      if (e.key === "ArrowRight") handleNextImage();
      if (e.key === "Escape") setIsImageOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isImageOpen, galleryIndex, galleryImages.length]);

  useEffect(() => {
    if (!userid) return;
    setRevealedBanner(false);
    setBannerError(false);

    const fetchData = async () => {
      setLoading(true);
      const token = localStorage.getItem("loginInfo");

      if (token) {
        try {
          const decodeToken = jwtDecode<any>(token);
          setUserName(decodeToken?.profileName || "User");
        } catch (error) {
          console.error("Invalid token:", error);
          router.push("/login");
        }
      } else {
        router.push("/login");
      }

      try {
        const userProfileID = localStorage.getItem("logged_in_profile");
        setProfileId(userProfileID);

        const getJson = async (url: string) => {
          try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return await res.json();
          } catch (err) {
            console.error("Fetch error:", err);
            return null;
          }
        };

        const [advertiserRes, eventsRes, rsvpRes, imagesRes] =
          await Promise.all([
            getJson(`/api/user/sweeping/user?id=${userid}`),
            getJson(`/api/user/sweeping/events`),
            getJson(`/api/user/sweeping/rsvp?id=${userid}`),
            getJson(`/api/user/sweeping/images/profile?id=${userid}`),
          ]);

        const todayMidnight = new Date();
        todayMidnight.setHours(0, 0, 0, 0);

        setAdvertiser(advertiserRes?.user || undefined);
        const rawEvents = eventsRes?.events || [];
        const rawRsvp = rsvpRes?.rsvp || [];

        setEvents(
          rawEvents
            .filter((ev: any) => ev.StartTime && new Date(ev.StartTime) >= todayMidnight)
            .sort((a: any, b: any) => new Date(a.StartTime).getTime() - new Date(b.StartTime).getTime())
        );

        setRsvp(
          rawRsvp
            .filter((ev: any) => ev.StartTime && new Date(ev.StartTime) >= todayMidnight)
            .sort((a: any, b: any) => new Date(a.StartTime).getTime() - new Date(b.StartTime).getTime())
        );

        setProfileImages(imagesRes?.images || []);
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userid]);

  const filteredEvents = selectedTab === "RSVP" ? [] : events;

  const handleAddFriend = async (): Promise<void> => {
    try {
      const safeToId = userid ?? "";

      const BASE_URL = "https://app.swingsocial.co";

      const acceptUrl = `${BASE_URL}/mailbox/${encodeURIComponent(safeToId)}`;

      const declineUrl = `${BASE_URL}/mailbox/${encodeURIComponent(safeToId)}`;

      const subject = `${userName} sent you a friend request on Swing Social`;

      const htmlBody = `
      <div style="font-family: Arial, Helvetica, sans-serif; color:#333; margin:0; padding:0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa; padding:40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.08);">

                <tr>
                  <td style="padding:20px 24px; text-align:center;">
                    <h1 style="margin:0; font-size:22px; color:#111;">Swing Social</h1>
                    <p style="margin:8px 0 0; color:#666;">You have a new friend request</p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:20px 32px; border-top:1px solid #eee;">
                    <p style="font-size:16px; margin:0 0 12px; color:#222;">
                      <strong>${userName}</strong> wants to connect with you.
                    </p>

                    <p style="margin:0 0 18px; color:#555; line-height:1.5;">
                      Click below to view their profile or respond to the request.
                    </p>

                    <table cellpadding="0" cellspacing="0" style="margin:18px 0;">
                      <tr>
                        <td align="center" style="padding-right:8px;">
                          <a href="${acceptUrl}" target="_blank" rel="noopener"
                            style="display:inline-block; padding:12px 22px; background:#4CAF50; color:#ffffff;
                                   text-decoration:none; border-radius:6px; font-weight:600;">
                            Accept
                          </a>
                        </td>

                        <td align="center" style="padding-left:8px;">
                          <a href="${declineUrl}" target="_blank" rel="noopener"
                            style="display:inline-block; padding:12px 22px; background:#f44336; color:#ffffff;
                                   text-decoration:none; border-radius:6px; font-weight:600;">
                            Decline
                          </a>
                        </td>
                      </tr>
                    </table>

                    <hr style="border:none; border-top:1px solid #eee; margin:18px 0;" />
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
    `;

      const textBody = `${userName} has sent you a friend request on Swing Social.

Accept: ${acceptUrl}
Decline: ${declineUrl}

If you didn't expect this, ignore this message.
`;

      const mailResponse = await fetch("/api/user/mailbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromId: profileId,
          toId: userid,
          subject,
          htmlBody,
          textBody,
        }),
      });

      if (!mailResponse.ok) {
        throw new Error(`Failed to send email. Status: ${mailResponse.status}`);
      }

      toast.success("Friend request sent 🎉", { autoClose: 1000 });

      // const notifyResponse = await fetch(
      //   "/api/user/notification/requestfriend",
      //   {
      //     method: "POST",
      //     headers: { "Content-Type": "application/json" },
      //     body: JSON.stringify({
      //       userId: userid,
      //       title: "New Friend Request!",
      //       body: `${userName} sent you a friend request!`,
      //       type: "friend_request",
      //       url: `https://app.swingsocial.co/mailbox/${userid}`,
      //     }),
      //   },
      // );
      // if (!notifyResponse.ok) {
      //   throw new Error(`Failed to notify. Status: ${notifyResponse.status}`);
      // }
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error?.message ?? "Something went wrong", {
        autoClose: 4000,
      });
    }
  };

  const handleBlockFriend = async () => {
    try {
      const checkResponse = await fetch("/api/user/profile/block", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: profileId,
          targetId: userid,
        }),
      });

      const checkData = await checkResponse.json();

      if (checkResponse.ok) {
        toast.success("Friend has been blocked successfully!");
        handleClose();
      } else {
        toast.error(checkData.message || "Failed to block friend.");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Something went wrong. Please try again.");
    }
  };

  const handleGrantModal = () => {
    handleGrantAccess();
    setGrantOpen(false);
  };

  const handlePrivateModal = () => {
    setPrivateOpen(false);
  };

  const rowStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 14px",
    borderRadius: "12px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
  };

  const labelStyle = {
    color: "#fff",
    fontSize: "13px",
  };

  const valueStyle = {
    color: "#fff",
    fontWeight: 500,
    fontSize: "13px",
  };

  const DetailRow = ({ icon: Icon, label, value, isLast = false }: DetailRowProps) => {
    if (!value) return null;

    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          py: 1.4,
          borderBottom: isLast ? "none" : "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        <Box display="flex" alignItems="center" gap={1.5}>
          <Icon size={15} color="rgba(255, 255, 255, 0.45)" />
          <Typography sx={{ color: "rgba(255, 255, 255, 0.65)", fontSize: "0.88rem", fontWeight: 500 }}>
            {label}
          </Typography>
        </Box>
        <Typography sx={{ color: "#FFF", fontSize: "0.88rem", fontWeight: 700 }}>
          {value}
        </Typography>
      </Box>
    );
  };

  if (loading) {
    return (
      <Box
        sx={{
          position: "fixed",
          inset: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(160deg, #14071f 0%, #0a0412 100%)",
          backdropFilter: "blur(12px)",
          zIndex: 1400,
          height: "100vh",
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "24px",
          }}
        >
          <Box sx={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center" }}>
            <CircularProgress
              size={80}
              thickness={2}
              sx={{
                color: "rgba(123, 97, 255, 0.3)",
              }}
            />
            <CircularProgress
              size={80}
              thickness={4}
              sx={{
                color: "#7B61FF",
                position: "absolute",
                left: 0,
                strokeLinecap: "round",
              }}
            />
          </Box>

          <motion.div
            animate={{
              opacity: [0.4, 1, 0.4],
              scale: [0.98, 1, 0.98],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Typography
              variant="h6"
              sx={{
                color: "#fff",
                fontWeight: 600,
                letterSpacing: "0.05em",
                textShadow: "0 0 20px rgba(255, 255, 255, 0.3)",
                fontSize: { xs: "1rem", sm: "1.25rem" },
                textAlign: "center",
              }}
            >
              Fetching user details...
            </Typography>
          </motion.div>
        </motion.div>
      </Box>
    );
  }

  const hasPartnerData =
    advertiser?.PartnerDateOfBirth ||
    advertiser?.PartnerGender ||
    advertiser?.PartnerHeight ||
    advertiser?.PartnerSexualOrientation ||
    advertiser?.PartnerBodyType ||
    advertiser?.PartnerEyeColor ||
    advertiser?.PartnerHairColor;

  const partnerAge = advertiser?.PartnerDateOfBirth
    ? new Date().getFullYear() -
    new Date(advertiser.PartnerDateOfBirth).getFullYear()
    : null;

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        scroll="paper"
        fullWidth
        maxWidth="md"
        aria-labelledby="user-profile-dialog"
        PaperProps={{
          sx: {
            background: "linear-gradient(160deg, #120820 0%, #0d0518 50%, #0a0415 100%)",
            backdropFilter: isImageOpen ? "blur(25px)" : "none",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.7)",
            color: "white",
            maxHeight: "85vh",
            display: "flex",
            flexDirection: "column",
            borderRadius: 4,
            transition: "all 0.3s ease-in-out",
            margin: { xs: "10px !important", sm: "32px !important" },
            width: "100%",
            maxWidth: { xs: "100%", sm: 600, md: 800, lg: 900 },
          },
        }}
      >
        <DialogTitle
          id="user-profile-dialog"
          sx={{
            p: 2,
            fontWeight: "bold",
            background: "#0d0518",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            color: "white",
            position: "sticky",
            top: 0,
            zIndex: 1,
          }}
        >
          User Profile
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: "rgba(255,255,255,0.5)",
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent
          dividers
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          sx={{
            p: 0,
            flex: 1,
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            overscrollBehavior: "contain",
            scrollBehavior: "smooth",
            touchAction: "pan-y",
            "&::-webkit-scrollbar": { display: "none" },
            msOverflowStyle: "none",
            scrollbarWidth: "none",
          }}
        >
          <Box
            sx={{
              position: "relative",
              background: "linear-gradient(135deg, #120820 0%, #0d0518 50%, #0a0415 100%)",
              pb: 4,
            }}
          >
            {/* 1. HERO BANNER CARD matching 2nd screenshot (ProfileDetailsScreen) */}
            {/* 1. HERO BANNER + PUBLIC PHOTOS CARD matching swing-social-expo (ProfileDetailsScreen) */}
            <Box
              sx={{
                position: "relative",
                height: { xs: 260, sm: 310 },
                width: "100%",
                background: "#0d0518",
                overflow: "hidden",
                display: "flex",
              }}
            >
              {profileImages && profileImages.length > 0 ? (
                <>
                  {/* LEFT SIDE (62%): Profile Banner or Dark Gradient Placeholder */}
                  <Box
                    onClick={() => {
                      if (advertiser?.ProfileBanner) handleOpenImage(advertiser.ProfileBanner);
                    }}
                    sx={{
                      flex: 1,
                      height: "100%",
                      position: "relative",
                      borderRight: "2px solid #0d0518",
                      cursor: advertiser?.ProfileBanner ? "pointer" : "default",
                      overflow: "hidden",
                    }}
                  >
                    {advertiser?.ProfileBanner && !bannerError ? (
                      <Image
                        src={advertiser.ProfileBanner}
                        alt="Profile Banner"
                        fill
                        priority
                        sizes="60vw"
                        style={{ objectFit: "cover", objectPosition: "center" }}
                        onError={() => setBannerError(true)}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: "100%",
                          height: "100%",
                          background: "linear-gradient(135deg, #1c0b34 0%, #120822 50%, #0d0518 100%)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: "50%",
                            background: "rgba(255, 255, 255, 0.08)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Camera size={22} color="rgba(255, 255, 255, 0.45)" />
                        </Box>
                      </Box>
                    )}
                  </Box>

                  {/* RIGHT SIDE (38%): Public Photos Column */}
                  <Box
                    sx={{
                      width: "38%",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    {profileImages.length === 1 ? (
                      /* 1 Public photo takes full height of right column */
                      <Box
                        onClick={() => handleOpenImage(profileImages[0]?.Url || profileImages[0]?.url, 0, profileImages.map((p: any) => p?.Url || p?.url))}
                        sx={{
                          flex: 1,
                          position: "relative",
                          cursor: "pointer",
                          overflow: "hidden",
                        }}
                      >
                        <Image
                          src={profileImages[0]?.Url || profileImages[0]?.url}
                          alt="Public Photo 1"
                          fill
                          sizes="38vw"
                          style={{ objectFit: "cover" }}
                        />
                      </Box>
                    ) : (
                      /* 2 or more public photos stacked in right column */
                      [0, 1].map((idx) => {
                        const photo = profileImages[idx];
                        if (!photo) return null;
                        const photoUrl = photo.Url || photo.url;
                        const isMoreSlot = idx === 1 && profileImages.length > 2;

                        return (
                          <Box
                            key={idx}
                            onClick={() => handleOpenImage(photoUrl, idx, profileImages.map((p: any) => p?.Url || p?.url))}
                            sx={{
                              flex: 1,
                              position: "relative",
                              cursor: "pointer",
                              overflow: "hidden",
                              borderBottom: idx === 0 ? "2px solid #0d0518" : "none",
                            }}
                          >
                            <Image
                              src={photoUrl}
                              alt={`Public Photo ${idx + 1}`}
                              fill
                              sizes="38vw"
                              style={{ objectFit: "cover" }}
                            />
                            {/* +N Count Overlay on 2nd slot if more than 2 photos */}
                            {isMoreSlot && (
                              <Box
                                sx={{
                                  position: "absolute",
                                  inset: 0,
                                  background: "rgba(0, 0, 0, 0.52)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "#FFF",
                                  fontWeight: 800,
                                  fontSize: "1.4rem",
                                }}
                              >
                                +{profileImages.length - 2}
                              </Box>
                            )}
                          </Box>
                        );
                      })
                    )}
                  </Box>
                </>
              ) : (
                /* NO PUBLIC PHOTOS: Full-bleed Banner or clean dark header */
                <Box
                  onClick={() => {
                    if (advertiser?.ProfileBanner) handleOpenImage(advertiser.ProfileBanner);
                  }}
                  sx={{
                    width: "100%",
                    height: "100%",
                    position: "relative",
                    cursor: advertiser?.ProfileBanner ? "pointer" : "default",
                  }}
                >
                  {advertiser?.ProfileBanner && !bannerError ? (
                    <Image
                      src={advertiser.ProfileBanner}
                      alt="Profile Banner"
                      fill
                      priority
                      sizes="100vw"
                      style={{ objectFit: "cover", objectPosition: "center" }}
                      onError={() => setBannerError(true)}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: "100%",
                        height: "100%",
                        background: "linear-gradient(135deg, #1c0b34 0%, #120822 50%, #0d0518 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: "50%",
                          background: "rgba(255, 255, 255, 0.08)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Camera size={26} color="rgba(255, 255, 255, 0.45)" />
                      </Box>
                    </Box>
                  )}
                </Box>
              )}

              {/* Scrim Fade Overlay */}
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(to bottom, transparent 0%, rgba(13,5,24,0.65) 60%, #0d0518 100%)",
                  pointerEvents: "none",
                  zIndex: 2,
                }}
              />

              {/* Account Type Badge at bottom-right of hero banner */}
              {advertiser?.AccountType && (
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 20,
                    right: 20,
                    px: 2,
                    py: 0.6,
                    borderRadius: "100px",
                    fontSize: "11px",
                    fontWeight: 800,
                    background: "rgba(255, 255, 255, 0.12)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    backdropFilter: "blur(10px)",
                    color: "#FFF",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    zIndex: 3,
                  }}
                >
                  {advertiser.AccountType}
                </Box>
              )}

              {/* Overlayed Avatar & Profile Details at bottom-left of hero banner */}
              <Box
                sx={{
                  position: "absolute",
                  bottom: 16,
                  left: { xs: 16, sm: 24 },
                  right: { xs: 100, sm: 140 },
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 2,
                  zIndex: 3,
                }}
              >
                {/* Avatar with 3-Color Gradient Ring */}
                <Box
                  onClick={() => handleOpenImage(advertiser?.Avatar)}
                  sx={{
                    position: "relative",
                    width: { xs: 90, sm: 106 },
                    height: { xs: 90, sm: 106 },
                    borderRadius: "50%",
                    p: "3px",
                    background: "linear-gradient(135deg, #FF1B6B 0%, #7000FF 50%, #00D2FF 100%)",
                    cursor: "pointer",
                    flexShrink: 0,
                    boxShadow: "0 8px 30px rgba(0,0,0,0.6)",
                  }}
                >
                  <Box
                    sx={{
                      width: "100%",
                      height: "100%",
                      borderRadius: "50%",
                      overflow: "hidden",
                      position: "relative",
                      background: "#1a1a2e",
                    }}
                  >
                    <Image
                      src={advertiser?.Avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300"}
                      alt="Avatar"
                      fill
                      sizes="106px"
                      style={{ objectFit: "cover" }}
                    />
                  </Box>
                </Box>

                {/* Info Column (Username, Age & Gender, Location) placed DIRECTLY to the right of Avatar */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  {(advertiser?.selfie_verification_status === "true" || advertiser?.is_verified) && (
                    <Box
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 0.5,
                        px: 1,
                        py: 0.2,
                        borderRadius: "100px",
                        background: "rgba(0, 230, 118, 0.15)",
                        border: "1px solid rgba(0, 230, 118, 0.3)",
                        mb: 0.5,
                      }}
                    >
                      <ShieldCheck size={12} color="#00E676" />
                      <Typography sx={{ color: "#00E676", fontSize: "10px", fontWeight: 800 }}>VERIFIED</Typography>
                    </Box>
                  )}

                  <Typography
                    noWrap
                    sx={{
                      color: "#FFF",
                      fontWeight: 800,
                      fontSize: { xs: "1.25rem", sm: "1.5rem" },
                      lineHeight: 1.2,
                    }}
                  >
                    {advertiser?.Username || "User"}
                  </Typography>

                  <Typography sx={{ color: "#FFF", fontSize: "0.95rem", fontWeight: 700, mt: 0.3 }}>
                    {(() => {
                      const getAge = (ageVal: any, dobVal: any) => {
                        const parsed = parseInt(ageVal, 10);
                        if (!isNaN(parsed) && parsed > 18) return String(parsed);
                        if (dobVal) {
                          try {
                            const birth = new Date(dobVal);
                            const today = new Date();
                            let age = today.getFullYear() - birth.getFullYear();
                            const m = today.getMonth() - birth.getMonth();
                            if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
                            return age > 18 ? String(age) : "";
                          } catch { return ""; }
                        }
                        return "";
                      };
                      const uAge = getAge(advertiser?.Age, advertiser?.DateOfBirth);
                      const pAge = getAge(advertiser?.PartnerAge, advertiser?.PartnerDateOfBirth);
                      const gCode = advertiser?.Gender === "Male" ? "M" : advertiser?.Gender === "Female" ? "F" : "";
                      const pGCode = advertiser?.PartnerGender === "Male" ? "M" : advertiser?.PartnerGender === "Female" ? "F" : "";
                      const showPartner = Boolean(pAge && pAge !== "0");

                      return (
                        <>
                          {uAge ? uAge : ""}
                          {gCode && (
                            <Box component="span" sx={{ color: gCode === "F" ? "#FF2D95" : "#00D2FF", ml: 0.5 }}>
                              {gCode}
                            </Box>
                          )}
                          {showPartner && (
                            <Box component="span" sx={{ color: "rgba(255,255,255,0.4)", ml: 1 }}>
                              {"| "}
                              <Box component="span" sx={{ color: "#FFF" }}>{pAge}</Box>
                              {pGCode && (
                                <Box component="span" sx={{ color: pGCode === "F" ? "#FF2D95" : "#00D2FF", ml: 0.5 }}>
                                  {pGCode}
                                </Box>
                              )}
                            </Box>
                          )}
                        </>
                      );
                    })()}
                  </Typography>

                  {advertiser?.Location && (
                    <Stack direction="row" alignItems="center" spacing={0.5} mt={0.3}>
                      <MapPin size={13} color="rgba(255,255,255,0.6)" />
                      <Typography noWrap sx={{ color: "rgba(255,255,255,0.65)", fontSize: "0.82rem", fontWeight: 500 }}>
                        {advertiser.Location.replace(", USA", "")}
                      </Typography>
                    </Stack>
                  )}
                </Box>
              </Box>
            </Box>

            {/* 2. ACTION BUTTONS ROW matching 2nd screenshot (ProfileDetailsScreen) */}
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
              <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
                {/* 1. Flag / Report Button */}
                <IconButton
                  onClick={() => {
                    toast.info("Report menu opened");
                  }}
                  sx={{
                    width: 46,
                    height: 46,
                    borderRadius: "50%",
                    background: "rgba(22, 12, 38, 0.85)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    color: "#ff3366",
                    flexShrink: 0,
                    transition: "all 0.2s ease-in-out",
                    "&:hover": { background: "rgba(255, 51, 102, 0.2)", transform: "scale(1.05)" },
                  }}
                >
                  <Flag size={19} color="#ff3366" />
                </IconButton>

                {/* 2. Block Button */}
                <IconButton
                  onClick={handleBlockFriend}
                  sx={{
                    width: 46,
                    height: 46,
                    borderRadius: "50%",
                    background: "rgba(22, 12, 38, 0.85)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    color: "#FF5252",
                    flexShrink: 0,
                    transition: "all 0.2s ease-in-out",
                    "&:hover": { background: "rgba(255, 82, 82, 0.2)", transform: "scale(1.05)" },
                  }}
                >
                  <Ban size={18} color="#FF5252" />
                </IconButton>

                {/* 3. Message Button */}
                <Button
                  fullWidth
                  onClick={() => router.push(`/messaging/${userid}`)}
                  startIcon={<ChatBubbleOutline />}
                  sx={{
                    background: "linear-gradient(90deg, #FF1B6B 0%, #7000FF 100%)",
                    color: "#FFF",
                    fontWeight: 800,
                    fontSize: "0.95rem",
                    borderRadius: "100px",
                    py: 1.3,
                    px: 3,
                    textTransform: "none",
                    boxShadow: "0 4px 25px rgba(255, 27, 107, 0.35)",
                    whiteSpace: "nowrap",
                    transition: "all 0.2s ease-in-out",
                    "&:hover": { filter: "brightness(1.15)", transform: "translateY(-1px)" },
                  }}
                >
                  Message
                </Button>

                <IconButton
                  onClick={handleAddFriend}
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: "rgba(22, 12, 38, 0.85)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    color: "#FF1B6B",
                    "&:hover": { background: "rgba(255, 27, 107, 0.15)" },
                  }}
                >
                  <PersonAddAlt1Icon sx={{ fontSize: 20 }} />
                </IconButton>
              </Stack>

              {/* 3. CARD SECTIONS matching 2nd screenshot (ProfileDetailsScreen) */}
              <Stack spacing={2.5}>
                {/* TAGLINE CARD */}
                {advertiser?.Tagline && (
                  <Box
                    sx={{
                      p: 2.5,
                      borderRadius: "20px",
                      background: "rgba(22, 12, 38, 0.75)",
                      backdropFilter: "blur(20px)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1.5} mb={1.5}>
                      <Box
                        sx={{
                          width: 34,
                          height: 34,
                          borderRadius: "50%",
                          background: "rgba(255, 27, 107, 0.15)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Typography sx={{ color: "#FF1B6B", fontWeight: 900, fontSize: "16px" }}>"</Typography>
                      </Box>
                      <Typography sx={{ color: "rgba(255,255,255,0.6)", fontWeight: 700, fontSize: "0.78rem", letterSpacing: "1px" }}>
                        TAGLINE
                      </Typography>
                    </Stack>
                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize: "1rem",
                        color: "#FF6FA5",
                        fontStyle: "italic",
                        wordBreak: "break-word",
                        overflowWrap: "anywhere",
                      }}
                    >
                      "{advertiser.Tagline.replace(/<[^>]*>?/gm, "")}"
                    </Typography>
                  </Box>
                )}

                {/* ABOUT CARD */}
                {advertiser?.About && (
                  <Box
                    sx={{
                      p: 2.5,
                      borderRadius: "20px",
                      background: "rgba(22, 12, 38, 0.75)",
                      backdropFilter: "blur(20px)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1.5} mb={1.5}>
                      <Box
                        sx={{
                          width: 34,
                          height: 34,
                          borderRadius: "50%",
                          background: "rgba(112, 0, 255, 0.2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <User size={18} color="#C084FC" />
                      </Box>
                      <Typography sx={{ color: "rgba(255,255,255,0.6)", fontWeight: 700, fontSize: "0.78rem", letterSpacing: "1px" }}>
                        ABOUT
                      </Typography>
                    </Stack>
                    <Typography
                      sx={{
                        color: "rgba(255,255,255,0.85)",
                        fontSize: "0.92rem",
                        lineHeight: 1.7,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {advertiser.About.replace(/<[^>]*>?/gm, "")}
                    </Typography>
                  </Box>
                )}
              </Stack>

              {/* DETAILS CARD matching screenshot */}
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: "20px",
                  background: "rgba(22, 12, 38, 0.75)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  mt: 2.5,
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
                  <Box
                    sx={{
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      background: "rgba(0, 210, 255, 0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Fingerprint size={16} color="#00D2FF" />
                  </Box>
                  <Typography sx={{ color: "rgba(255,255,255,0.6)", fontWeight: 700, fontSize: "0.78rem", letterSpacing: "1px" }}>
                    DETAILS
                  </Typography>
                </Stack>

                <Box display="flex" flexDirection="column">
                  <DetailRow icon={User} label="Body type" value={advertiser?.BodyType} />
                  <DetailRow icon={Palette} label="Hair color" value={advertiser?.HairColor} />
                  <DetailRow icon={Eye} label="Eye color" value={advertiser?.EyeColor} />
                  <DetailRow
                    icon={MapPin}
                    label="Distance"
                    value={
                      advertiser?.miles
                        ? `${advertiser.miles.toFixed(2)} mi`
                        : advertiser?.Distance
                        ? `${advertiser.Distance.replace(/ miles| mi/gi, "")} mi`
                        : null
                    }
                  />
                  <DetailRow icon={Heart} label="Orientation" value={advertiser?.SexualOrientation} isLast={true} />
                </Box>
              </Box>

              {/* PARTNER DETAILS CARD */}
              {hasPartnerData && (
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: "20px",
                    background: "rgba(22, 12, 38, 0.75)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    mt: 2.5,
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
                    <Box
                      sx={{
                        width: 34,
                        height: 34,
                        borderRadius: "50%",
                        background: "rgba(255, 27, 107, 0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Heart size={16} color="#FF1B6B" />
                    </Box>
                    <Typography sx={{ color: "rgba(255,255,255,0.6)", fontWeight: 700, fontSize: "0.78rem", letterSpacing: "1px" }}>
                      PARTNER
                    </Typography>
                  </Stack>

                  <Box display="flex" flexDirection="column">
                    <DetailRow
                      icon={User}
                      label="Age"
                      value={
                        partnerAge
                          ? `${partnerAge}${advertiser?.PartnerGender ? `, ${advertiser.PartnerGender}` : ""}`
                          : advertiser?.PartnerGender
                      }
                    />
                    <DetailRow icon={Ruler} label="Height" value={advertiser?.PartnerHeight} />
                    <DetailRow icon={Heart} label="Orientation" value={advertiser?.PartnerSexualOrientation} />
                    <DetailRow icon={User} label="Body type" value={advertiser?.PartnerBodyType} />
                    <DetailRow icon={Eye} label="Eye color" value={advertiser?.PartnerEyeColor} />
                    <DetailRow icon={Palette} label="Hair color" value={advertiser?.PartnerHairColor} isLast={true} />
                  </Box>
                </Box>
              )}

              {/* GALLERY CARD matching ProfileDetailsScreen.tsx */}
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: "20px",
                  background: "rgba(22, 12, 38, 0.75)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  mt: 2.5,
                }}
              >
                {/* Tab Bar inside Gallery Card */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                    pb: 1.5,
                    mb: 2,
                  }}
                >
                  <Box
                    onClick={() => setActiveTab("public")}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      cursor: "pointer",
                      position: "relative",
                      pb: 1,
                    }}
                  >
                    <Camera size={17} color={activeTab === "public" ? "#FF1B6B" : "rgba(255, 255, 255, 0.4)"} />
                    <Typography
                      sx={{
                        color: activeTab === "public" ? "#FFF" : "rgba(255, 255, 255, 0.4)",
                        fontWeight: 700,
                        fontSize: "0.9rem",
                      }}
                    >
                      Photos
                    </Typography>
                    {activeTab === "public" && (
                      <Box
                        sx={{
                          position: "absolute",
                          bottom: -1,
                          left: 0,
                          right: 0,
                          height: "2px",
                          background: "#FF1B6B",
                          borderRadius: "1px",
                        }}
                      />
                    )}
                  </Box>

                  <Box
                    onClick={() => {
                      toast.info("Request private photo access from this member to view their collection.");
                    }}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      cursor: "pointer",
                      pb: 1,
                    }}
                  >
                    <Lock size={15} color="rgba(255, 255, 255, 0.4)" />
                    <Typography
                      sx={{
                        color: "rgba(255, 255, 255, 0.4)",
                        fontWeight: 700,
                        fontSize: "0.9rem",
                      }}
                    >
                      Private
                    </Typography>
                  </Box>
                </Box>

                {/* 2-Column Photo Grid */}
                {profileImages?.length > 0 ? (
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, 1fr)",
                      gap: 2,
                    }}
                  >
                    {profileImages.map((image: any, index: number) => (
                      <Box
                        key={index}
                        onClick={() => handleOpenImage(image?.Url || image?.url, index, profileImages.map((p: any) => p?.Url || p?.url))}
                        sx={{
                          position: "relative",
                          width: "100%",
                          aspectRatio: "1 / 1",
                          borderRadius: "14px",
                          overflow: "hidden",
                          cursor: "pointer",
                          border: "1px solid rgba(255, 255, 255, 0.08)",
                          transition: "transform 0.2s ease-in-out",
                          "&:hover": { transform: "scale(1.03)" },
                        }}
                      >
                        {image?.Url && (
                          <Image
                            src={image.Url}
                            alt={`Profile Photo ${index + 1}`}
                            fill
                            sizes="(max-width: 600px) 50vw, (max-width: 1200px) 33vw, 200px"
                            style={{
                              objectFit: "cover",
                            }}
                          />
                        )}
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Box sx={{ textAlign: "center", py: 4, opacity: 0.5 }}>
                    <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" }}>
                      No public photos yet
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* EVENTS CARD matching ProfileDetailsScreen.tsx */}
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: "20px",
                  background: "rgba(22, 12, 38, 0.75)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  mt: 2.5,
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
                  <Box
                    sx={{
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      background: "rgba(255, 215, 0, 0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Calendar size={16} color="#FFD700" />
                  </Box>
                  <Typography sx={{ color: "rgba(255,255,255,0.6)", fontWeight: 700, fontSize: "0.78rem", letterSpacing: "1px" }}>
                    EVENTS
                  </Typography>
                </Stack>

                {/* Event Tabs Pill Selector */}
                <Box
                  sx={{
                    display: "flex",
                    p: "4px",
                    borderRadius: "16px",
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    mb: 2,
                  }}
                >
                  {["rsvp", "all"].map((tabKey) => {
                    const isSelected = selectedTab.toLowerCase() === tabKey || (selectedTab === "All Events" && tabKey === "all") || (selectedTab === "RSVP" && tabKey === "rsvp");
                    return (
                      <Box
                        key={tabKey}
                        onClick={() => setSelectedTab(tabKey === "rsvp" ? "RSVP" : "All Events")}
                        sx={{
                          flex: 1,
                          textAlign: "center",
                          py: 1.1,
                          borderRadius: "12px",
                          fontSize: "0.85rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          transition: "all 0.2s ease-in-out",
                          ...(isSelected
                            ? {
                                background: "linear-gradient(90deg, #FF1B6B 0%, #7000FF 100%)",
                                color: "#FFF",
                                boxShadow: "0 4px 15px rgba(255, 27, 107, 0.3)",
                              }
                            : {
                                color: "rgba(255, 255, 255, 0.4)",
                                "&:hover": { color: "#FFF" },
                              }),
                        }}
                      >
                        {tabKey === "rsvp" ? "RSVP" : "All Events"}
                      </Box>
                    );
                  })}
                </Box>

                {/* Event Cards List (Full width, stacked vertically, zero side margins) */}
                <Box display="flex" flexDirection="column" gap={2} width="100%">
                  {(selectedTab === "RSVP" ? rsvp : events)?.length > 0 ? (
                    (selectedTab === "RSVP" ? rsvp : events).map((item: any, idx: number) => (
                      <Box
                        key={item.Id || idx}
                        sx={{
                          width: "100%",
                          borderRadius: "16px",
                          overflow: "hidden",
                          background: "rgba(22, 12, 38, 0.6)",
                          border: "1px solid rgba(255, 255, 255, 0.08)",
                          position: "relative",
                          transition: "transform 0.2s ease-in-out",
                          "&:hover": { transform: "translateY(-2px)" },
                        }}
                      >
                        {/* Cover Image */}
                        <Box sx={{ position: "relative", width: "100%", height: 160, background: "rgba(34, 28, 48, 0.8)" }}>
                          {item.CoverImageUrl ? (
                            <Image
                              src={item.CoverImageUrl}
                              alt={item.Name || "Event"}
                              fill
                              sizes="(max-width: 600px) 100vw, 600px"
                              style={{ objectFit: "cover" }}
                            />
                          ) : null}
                          {/* Event Badge */}
                          <Box
                            sx={{
                              position: "absolute",
                              top: 10,
                              left: 10,
                              background: "#FF1B6B",
                              borderRadius: "6px",
                              px: 1,
                              py: 0.4,
                              fontSize: "10px",
                              fontWeight: 700,
                              color: "#FFF",
                              textTransform: "uppercase",
                            }}
                          >
                            Event
                          </Box>
                        </Box>

                        {/* Event Body */}
                        <Box sx={{ p: 2 }}>
                          <Typography sx={{ color: "#FFF", fontSize: "1rem", fontWeight: 800, mb: 0.5, lineHeight: 1.3 }}>
                            {item.Name}
                          </Typography>
                          {item.Tagline && (
                            <Typography sx={{ color: "rgba(255, 255, 255, 0.65)", fontSize: "0.82rem", mb: 1 }}>
                              {item.Tagline}
                            </Typography>
                          )}
                          {item.StartTime && (
                            <Stack direction="row" alignItems="center" spacing={0.8} mt={0.5}>
                              <Calendar size={13} color="#FF1B6B" />
                              <Typography sx={{ color: "#FFF", fontSize: "0.82rem", fontWeight: 500 }}>
                                {new Date(item.StartTime).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </Typography>
                            </Stack>
                          )}
                          {item.Venue && (
                            <Stack direction="row" alignItems="center" spacing={0.8} mt={0.5}>
                              <MapPin size={13} color="#FF1B6B" />
                              <Typography sx={{ color: "#FFF", fontSize: "0.82rem", fontWeight: 500 }} noWrap>
                                {item.Venue}
                              </Typography>
                            </Stack>
                          )}
                        </Box>
                      </Box>
                    ))
                  ) : (
                    <Box sx={{ textAlign: "center", py: 4, opacity: 0.5 }}>
                      <Typography sx={{ color: "rgba(255, 255, 255, 0.4)", fontSize: "0.85rem" }}>
                        No upcoming events found
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          </Box>
        </DialogContent>

        <Dialog
          open={grantOpen}
          onClose={() => setGrantOpen(false)}
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
              background: "rgba(20, 10, 35, 0.85)",
              backdropFilter: "blur(25px)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#fff",
              position: "relative",
            },
          }}
        >
          <DialogContent sx={{ textAlign: "center", p: 0 }}>
            <Stack spacing={3} alignItems="center">
              {/* ✅ Permission Icon */}
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
                <VerifiedUserIcon sx={{ color: "#fff", fontSize: 32 }} />
              </Box>

              {/* Title */}
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  letterSpacing: 0.5,
                }}
              >
                Grant Permission Status
              </Typography>

              {/* Description */}
              <Typography
                sx={{
                  fontSize: "0.9rem",
                  color: "rgba(255,255,255,0.75)",
                  lineHeight: 1.6,
                }}
              >
                Click OK to grant permission to this user for your private
                pics.
              </Typography>

              {/* Buttons */}
              <Stack direction="row" spacing={2} sx={{ width: "100%" }}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => setGrantOpen(false)}
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
                  CANCEL
                </Button>

                <Button
                  fullWidth
                  onClick={handleGrantModal}
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
                  OK
                </Button>
              </Stack>
            </Stack>
          </DialogContent>
        </Dialog>

        <Dialog
          open={privateOpen}
          onClose={() => setPrivateOpen(false)}
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
              background: "rgba(20, 10, 35, 0.85)",
              backdropFilter: "blur(25px)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#fff",
              position: "relative",
            },
          }}
        >
          <DialogContent sx={{ textAlign: "center", p: 0 }}>
            {/* Close */}
            <IconButton
              onClick={() => setPrivateOpen(false)}
              sx={{
                position: "absolute",
                right: 10,
                top: 10,
                color: "rgba(255,255,255,0.5)",
              }}
            >
              <CloseIcon />
            </IconButton>

            <Stack spacing={3} alignItems="center">
              {/* ✅ Request Icon */}
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
                <PersonAddAlt1Icon sx={{ color: "#fff", fontSize: 32 }} />
              </Box>

              {/* Title */}
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  letterSpacing: 0.5,
                }}
              >
                Permission Status
              </Typography>

              {/* Description */}
              <Typography
                sx={{
                  fontSize: "0.9rem",
                  color: "rgba(255,255,255,0.75)",
                  lineHeight: 1.6,
                }}
              >
                Click OK to send a request to this user for access to their
                private images.
              </Typography>

              {/* Buttons */}
              <Stack direction="row" spacing={2} sx={{ width: "100%" }}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => setPrivateOpen(false)}
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
                  CANCEL
                </Button>

                <Button
                  fullWidth
                  onClick={handlePrivateModal}
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
                  OK
                </Button>
              </Stack>
            </Stack>
          </DialogContent>
        </Dialog>

        <AnimatePresence>
          {isImageOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                background: "rgba(0,0,0,0.95)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px",
              }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={() => setIsImageOpen(false)}
            >
              {/* Photo Count Indicator Badge */}
              {galleryImages.length > 1 && (
                <Box
                  sx={{
                    position: "absolute",
                    top: 20,
                    left: "50%",
                    transform: "translateX(-50%)",
                    zIndex: 10000,
                    px: 2,
                    py: 0.6,
                    borderRadius: "100px",
                    background: "rgba(255, 255, 255, 0.15)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    color: "#fff",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    letterSpacing: "1px",
                  }}
                >
                  {galleryIndex + 1} / {galleryImages.length}
                </Box>
              )}

              {/* Close Button */}
              <IconButton
                onClick={() => setIsImageOpen(false)}
                sx={{
                  position: "absolute",
                  top: 20,
                  right: 20,
                  zIndex: 10000,
                  background: "rgba(255,255,255,0.15)",
                  backdropFilter: "blur(10px)",
                  color: "#fff",
                  "&:hover": { background: "rgba(255,255,255,0.3)" }
                }}
              >
                <X size={24} />
              </IconButton>

              {/* Prev Button */}
              {galleryImages.length > 1 && (
                <IconButton
                  onClick={handlePrevImage}
                  sx={{
                    position: "absolute",
                    left: 20,
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 10000,
                    background: "rgba(255,255,255,0.15)",
                    backdropFilter: "blur(10px)",
                    color: "#fff",
                    width: 48,
                    height: 48,
                    "&:hover": { background: "rgba(255,255,255,0.3)" }
                  }}
                >
                  <ChevronLeft size={30} />
                </IconButton>
              )}

              {/* Next Button */}
              {galleryImages.length > 1 && (
                <IconButton
                  onClick={handleNextImage}
                  sx={{
                    position: "absolute",
                    right: 20,
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 10000,
                    background: "rgba(255,255,255,0.15)",
                    backdropFilter: "blur(10px)",
                    color: "#fff",
                    width: 48,
                    height: 48,
                    "&:hover": { background: "rgba(255,255,255,0.3)" }
                  }}
                >
                  <ChevronRight size={30} />
                </IconButton>
              )}

              {/* Image Preview Container */}
              <motion.div
                key={selectedImage || galleryIndex}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", damping: 30, stiffness: 500 }}
                style={{
                  position: "relative",
                  maxWidth: "92vw",
                  maxHeight: "88vh",
                  borderRadius: "20px",
                  overflow: "hidden",
                  boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={selectedImage || galleryImages[galleryIndex]}
                  alt="Preview"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "88vh",
                    display: "block",
                    objectFit: "contain",
                    borderRadius: "20px",
                  }}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </Dialog>
    </>
  );
};

export default UserProfileModal;
