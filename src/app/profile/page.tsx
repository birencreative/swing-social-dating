"use client";
import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Button,
  Card,
  Chip,
  Container,
  Typography,
  ThemeProvider,
  useMediaQuery,
  Tabs,
  Tab,
  Fade,
  Stack,
  IconButton,
  Snackbar,
  Alert,
  Collapse,
  createTheme,
} from "@mui/material";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { jwtDecode } from "jwt-decode";
import {
  MapPin,
  Crown,
  User,
  LogOut,
  Lock,
  Globe,
  Settings2,
  ShieldCheck,
  Heart,
  Eye,
  Activity,
  Mail,
  Phone,
  Calendar,
  Pencil,
  CreditCard,
  Dna,
  Palette,
  ChevronDown,
  ChevronUp,
  Clock,
  Plus,
  Trash2,
  Camera,
  Fingerprint,
  CheckCircle2,
  Sliders,
  Gem,
} from "lucide-react";

import AppFooterDesktop from "@/layout/AppFooterDesktop";
import AppFooterMobile from "@/layout/AppFooterMobile";
import AppHeaderMobile from "@/layout/AppHeaderMobile";
import AppHeaderDesktop from "@/layout/AppHeaderDesktop";
import Loader from "@/commonPage/Loader";

import EmailDrawer from "@/components/profile-drawers/EmailDrawer";
import PhoneDrawer from "@/components/profile-drawers/PhoneDrawer";
import LocationUpdateDrawer from "@/components/profile-drawers/LocationUpdateDrawer";
import SwingStyleDrawer from "@/components/profile-drawers/SwingStyleDrawer";
import PublicGalleryDrawer from "@/components/profile-drawers/PublicGalleryDrawer";
import PrivateGalleryDrawer from "@/components/profile-drawers/PrivateGalleryDrawer";
import ImageCropDrawer from "@/components/profile-drawers/ImageCropDrawer";
import PhysicalAttributesDrawer from "@/components/profile-drawers/PhysicalAttributesDrawer";
import PartnerInfoDrawer from "@/components/profile-drawers/PartnerInfoDrawer";
import AboutMeDrawer from "@/components/profile-drawers/AboutMeDrawer";
import BasicInfoDrawer from "@/components/profile-drawers/BasicInfoDrawer";

const profileTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#FF1B6B" },
    secondary: { main: "#7000FF" },
    background: { default: "#0d0518", paper: "rgba(22, 12, 38, 0.75)" },
  },
  typography: { fontFamily: "Inter, sans-serif" },
});

const DEFAULT_BANNER_IMAGE =
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80";
const DUMMY_AVATAR =
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80";

const formatSwingLabel = (value: string) => {
  const displayMap: Record<string, string> = {
    exploring: "Exploring/Unsure",
    fullSwap: "Full Swap",
    softSwap: "Soft Swap",
    voyeur: "Voyeur",
    "Exploring/Unsure": "Exploring/Unsure",
    "Full Swap": "Full Swap",
    "Soft Swap": "Soft Swap",
    Voyeur: "Voyeur",
  };
  return displayMap[value] || value.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase()).trim();
};

const ProfileDetail: React.FC = () => {
  const isMobileOrTablet = useMediaQuery("(max-width:900px)");
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0); // 0: Overview, 1: Gallery, 2: Details
  const [loading, setLoading] = useState(true);
  const [advertiser, setAdvertiser] = useState<any>({});
  const [profileImages, setProfileImages] = useState<any>([]);
  const [privateImages, setPrivateImages] = useState<any>([]);
  const [profileId, setProfileId] = useState<string>("");
  const [membership1, setMembership1] = useState<any>(0);
  const [events, setEvents] = useState<any[]>([]);

  // Edit Drawers Visibility States
  const [openPhoneDrawer, setOpenPhoneDrawer] = useState(false);
  const [openEmailDrawer, setOpenEmailDrawer] = useState(false);
  const [openLocationDrawer, setOpenLocationDrawer] = useState(false);
  const [openSwingDrawer, setOpenSwingDrawer] = useState(false);
  const [openGalleryDrawer, setOpenGalleryDrawer] = useState(false);
  const [openPrivateDrawer, setOpenPrivateDrawer] = useState(false);
  const [openAvatarDrawer, setOpenAvatarDrawer] = useState(false);
  const [openBannerDrawer, setOpenBannerDrawer] = useState(false);
  const [openPhysicalDrawer, setOpenPhysicalDrawer] = useState(false);
  const [openPartnerDrawer, setOpenPartnerDrawer] = useState(false);
  const [openAboutDrawer, setOpenAboutDrawer] = useState(false);
  const [openBasicDrawer, setOpenBasicDrawer] = useState(false);

  // Section Collapse States
  const [isPartnerExpanded, setIsPartnerExpanded] = useState(false);
  const [isPhysicalExpanded, setIsPhysicalExpanded] = useState(true);
  const [isContactExpanded, setIsContactExpanded] = useState(true);

  // Toast / Snack State
  const [snack, setSnack] = useState({ open: false, message: "", severity: "success" as "success" | "error" | "info" });

  const showToast = (message: string, severity: "success" | "error" | "info" = "success") => {
    setSnack({ open: true, message, severity });
  };

  const handleOpenDrawer = (type: "phone" | "email" | "location" | "swing") => {
    if (type === "phone") setOpenPhoneDrawer(true);
    if (type === "email") setOpenEmailDrawer(true);
    if (type === "location") setOpenLocationDrawer(true);
    if (type === "swing") setOpenSwingDrawer(true);
  };

  const handleSwingSuccess = (newStyles: string[]) => {
    setAdvertiser((prev: any) => ({
      ...prev,
      SwingStyleTags: newStyles,
    }));
  };

  const handleContactSuccess = (type: "phone" | "email" | "location", value: string) => {
    setAdvertiser((prev: any) => ({
      ...prev,
      [type === "phone" ? "Phone" : type === "email" ? "Email" : "Location"]: value,
    }));
    if (type === "phone") setOpenPhoneDrawer(false);
    if (type === "email") setOpenEmailDrawer(false);
    if (type === "location") setOpenLocationDrawer(false);
    showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully!`, "success");
  };

  const handleAvatarSuccess = (url: string) => {
    setAdvertiser((prev: any) => ({ ...prev, Avatar: url }));
  };

  const handleBannerSuccess = (url: string) => {
    setAdvertiser((prev: any) => ({ ...prev, ProfileBanner: url }));
  };

  const handleRefreshGallery = () => {
    fetchImages(profileId);
  };

  const handleRefreshPrivateGallery = () => {
    fetchImages(profileId);
  };

  const handlePhysicalSuccess = (updatedData: any) => {
    setAdvertiser((prev: any) => ({
      ...prev,
      ...updatedData,
    }));
  };

  const handlePartnerSuccess = (updatedData: any) => {
    setAdvertiser((prev: any) => ({
      ...prev,
      ...updatedData,
    }));
    setIsPartnerExpanded(true);
  };

  const handleAboutSuccess = (updatedData: any) => {
    setAdvertiser((prev: any) => ({
      ...prev,
      ...updatedData,
    }));
  };

  const handleBasicSuccess = (updatedData: any) => {
    setAdvertiser((prev: any) => ({
      ...prev,
      ...updatedData,
    }));
  };

  const closeAllDrawers = () => {
    setOpenPhoneDrawer(false);
    setOpenEmailDrawer(false);
    setOpenLocationDrawer(false);
    setOpenSwingDrawer(false);
    setOpenGalleryDrawer(false);
    setOpenPrivateDrawer(false);
    setOpenAvatarDrawer(false);
    setOpenBannerDrawer(false);
    setOpenPhysicalDrawer(false);
    setOpenPartnerDrawer(false);
    setOpenAboutDrawer(false);
    setOpenBasicDrawer(false);
  };

  const pushedStateRef = useRef(false);

  useEffect(() => {
    const isAnyDrawerOpen =
      openPhoneDrawer ||
      openEmailDrawer ||
      openLocationDrawer ||
      openSwingDrawer ||
      openGalleryDrawer ||
      openPrivateDrawer ||
      openAvatarDrawer ||
      openBannerDrawer ||
      openPhysicalDrawer ||
      openPartnerDrawer ||
      openAboutDrawer ||
      openBasicDrawer;
    const isSpecialState = isAnyDrawerOpen || activeTab !== 0;

    if (isSpecialState && !pushedStateRef.current) {
      window.history.pushState({ stateOpen: true }, "");
      pushedStateRef.current = true;
    } else if (!isSpecialState && pushedStateRef.current) {
      if (window.history.state?.stateOpen === true) {
        window.history.back();
      }
      pushedStateRef.current = false;
    }

    const handlePopState = () => {
      if (isAnyDrawerOpen) {
        pushedStateRef.current = false;
        closeAllDrawers();
      } else if (activeTab !== 0) {
        setActiveTab(0);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [
    openPhoneDrawer,
    openEmailDrawer,
    openLocationDrawer,
    openSwingDrawer,
    openGalleryDrawer,
    openPrivateDrawer,
    openAvatarDrawer,
    openBannerDrawer,
    openPhysicalDrawer,
    openPartnerDrawer,
    openAboutDrawer,
    openBasicDrawer,
    activeTab,
  ]);

  useEffect(() => {
    if (
      openPhoneDrawer ||
      openEmailDrawer ||
      openLocationDrawer ||
      openSwingDrawer ||
      openGalleryDrawer ||
      openPrivateDrawer ||
      openAvatarDrawer ||
      openBannerDrawer ||
      openPhysicalDrawer ||
      openPartnerDrawer ||
      openAboutDrawer ||
      openBasicDrawer
    ) {
      const scrollY = window.pageYOffset;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || "0") * -1);
      }
    }
  }, [
    openPhoneDrawer,
    openEmailDrawer,
    openLocationDrawer,
    openSwingDrawer,
    openGalleryDrawer,
    openPrivateDrawer,
    openAvatarDrawer,
    openBannerDrawer,
    openPhysicalDrawer,
    openPartnerDrawer,
    openAboutDrawer,
    openBasicDrawer,
  ]);

  const fetchData = async (userId: string) => {
    if (!userId) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/user/sweeping/user?id=${userId}`);
      if (!response.ok) throw new Error("Failed to fetch user");
      const { user } = await response.json();
      if (user) {
        setAdvertiser(user);
        const partnerFilled = !!(
          user.PartnerBodyType ||
          user.PartnerHairColor ||
          user.PartnerEyeColor ||
          user.PartnerSexualOrientation ||
          user.PartnerGender ||
          user.PartnerAge
        );
        setIsPartnerExpanded(partnerFilled);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchImages = async (userId: string) => {
    try {
      const pRes = await fetch(`/api/user/sweeping/images/profile?id=${userId}`);
      const prRes = await fetch(`/api/user/sweeping/images?id=${userId}`);
      const pData = await pRes.json();
      const prData = await prRes.json();
      setProfileImages(pData?.images || []);
      setPrivateImages(prData?.images || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await fetch(`/api/user/sweeping/events`);
      const data = await response.json();
      setEvents(data?.events || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const userid = localStorage.getItem("logged_in_profile");
    if (!userid) {
      router.push("/login");
      return;
    }
    setProfileId(userid);
    fetchData(userid);
    fetchImages(userid);
    fetchEvents();

    const token = localStorage.getItem("loginInfo");
    if (token) {
      try {
        const decodeToken = jwtDecode<any>(token);
        setMembership1(decodeToken?.membership || 0);
      } catch (err) {}
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  const getGenderChar = (g: string) => {
    if (!g) return "";
    const lower = g.toLowerCase();
    if (lower.includes("female")) return "F";
    if (lower.includes("male")) return "M";
    return g.charAt(0).toUpperCase();
  };

  const renderAgeGenderText = () => {
    const primaryAge =
      parseInt(advertiser?.Age) > 18
        ? advertiser?.Age
        : advertiser?.DateOfBirth
        ? new Date().getFullYear() - new Date(advertiser.DateOfBirth).getFullYear()
        : advertiser?.Age || 18;
    const primaryG = getGenderChar(advertiser?.Gender || "Male");
    const isCoupleOrThrouple =
      advertiser?.AccountType === "Couple" || advertiser?.AccountType === "Throuple";
    const partnerAge =
      parseInt(advertiser?.PartnerAge) > 18
        ? advertiser?.PartnerAge
        : advertiser?.PartnerDateOfBirth
        ? new Date().getFullYear() - new Date(advertiser.PartnerDateOfBirth).getFullYear()
        : advertiser?.PartnerAge || null;
    const partnerG = getGenderChar(advertiser?.PartnerGender || "");

    if (isCoupleOrThrouple && partnerAge && partnerG) {
      return (
        <Typography
          sx={{
            color: "#00D2FF",
            fontSize: "1.15rem",
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            gap: 0.5,
          }}
        >
          {primaryAge}
          <Box component="span" sx={{ color: primaryG === "F" ? "#FF2D95" : "#00D2FF", fontWeight: 800 }}>
            {primaryG}
          </Box>
          <Box component="span" sx={{ color: "rgba(255,255,255,0.3)", fontWeight: 500, mx: 0.5 }}>
            |
          </Box>
          {partnerAge}
          <Box component="span" sx={{ color: partnerG === "F" ? "#FF2D95" : "#00D2FF", fontWeight: 800 }}>
            {partnerG}
          </Box>
        </Typography>
      );
    }

    return (
      <Typography
        sx={{
          color: "#00D2FF",
          fontSize: "1.15rem",
          fontWeight: 800,
          display: "flex",
          alignItems: "center",
          gap: 0.5,
        }}
      >
        {primaryAge}
        <Box component="span" sx={{ color: primaryG === "F" ? "#FF2D95" : "#00D2FF", fontWeight: 800 }}>
          {primaryG}
        </Box>
      </Typography>
    );
  };

  const selfieStatus = String(
    advertiser?.selfie_verification_status ||
      advertiser?.is_verified ||
      advertiser?.IsVerified ||
      advertiser?.verified ||
      ""
  )
    .toLowerCase()
    .trim();

  const isVerified =
    selfieStatus === "true" ||
    selfieStatus === "1" ||
    selfieStatus === "approved" ||
    selfieStatus === "verified" ||
    selfieStatus === "completed" ||
    advertiser?.selfie_verification_status === true ||
    advertiser?.is_verified === true ||
    advertiser?.IsVerified === true;

  const isPaidMember =
    membership1 === 1 ||
    advertiser?.memberShip === "1" ||
    advertiser?.memberShip === 1 ||
    advertiser?.memberShipCheck === "Paid" ||
    (advertiser?.Subscription && advertiser?.Subscription !== "FreeUser");

  const cardStyle = {
    background: "rgba(22, 12, 38, 0.75)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "20px",
    overflow: "hidden",
    boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
  };

  const renderImageGalleryGrid = (type: "public" | "private") => {
    const images = type === "public" ? profileImages : privateImages;
    return (
      <Card sx={{ ...cardStyle, p: { xs: 2, md: 3 } }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3} gap={1}>
          <Stack direction="row" alignItems="center" spacing={1.2} sx={{ minWidth: 0 }}>
            <Box
              sx={{
                width: { xs: 32, sm: 38 },
                height: { xs: 32, sm: 38 },
                borderRadius: "10px",
                background:
                  type === "public"
                    ? "linear-gradient(135deg, #FF1B6B 0%, #7000FF 100%)"
                    : "linear-gradient(135deg, #FFD700 0%, #FF8C00 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {type === "public" ? <Globe size={18} color="#fff" /> : <Lock size={18} color="#000" />}
            </Box>
            <Typography
              sx={{
                color: "#fff",
                fontWeight: 800,
                fontSize: { xs: "0.95rem", sm: "1.1rem", md: "1.25rem" },
                whiteSpace: "nowrap",
              }}
            >
              {type === "public" ? "Public Gallery" : "Private Vault"}
            </Typography>
          </Stack>
          <Button
            size="small"
            onClick={() => (type === "public" ? setOpenGalleryDrawer(true) : setOpenPrivateDrawer(true))}
            startIcon={type === "public" ? <Pencil size={13} /> : <Lock size={13} />}
            sx={{
              color: "#FFF",
              fontWeight: 700,
              textTransform: "none",
              background: type === "public" ? "linear-gradient(135deg, #FF1B6B, #7000FF)" : "linear-gradient(135deg, #FFD700, #FF8C00)",
              px: { xs: 1.5, sm: 2 },
              py: { xs: 0.5, sm: 0.75 },
              borderRadius: "100px",
              fontSize: { xs: "0.75rem", sm: "0.85rem" },
              whiteSpace: "nowrap",
              flexShrink: 0,
              boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
              "&:hover": { filter: "brightness(1.1)" },
            }}
          >
            {type === "public" ? "Upload Photo" : "Add Private"}
          </Button>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, 1fr)",
              sm: "repeat(3, 1fr)",
              md: "repeat(4, 1fr)",
              lg: "repeat(5, 1fr)",
            },
            gap: 2,
          }}
        >
          {images.map((img: any) => (
            <Box
              key={img.Id}
              sx={{
                aspectRatio: "3/4",
                borderRadius: "16px",
                overflow: "hidden",
                position: "relative",
                border: "2px solid rgba(255,255,255,0.08)",
                boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
                transition: "transform 0.3s ease",
                "&:hover": { transform: "scale(1.02)", borderColor: "rgba(255,255,255,0.3)" },
              }}
            >
              <Image src={img.Url} alt="Gallery Photo" fill sizes="(max-width: 600px) 50vw, 300px" style={{ objectFit: "cover" }} />
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(to top, rgba(13,5,24,0.6) 0%, transparent 40%)",
                }}
              />
            </Box>
          ))}
          {images.length === 0 && (
            <Box
              sx={{
                gridColumn: "1 / -1",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                py: 8,
                gap: 1.5,
              }}
            >
              <Camera size={44} color="rgba(255,255,255,0.2)" />
              <Typography sx={{ color: "rgba(255,255,255,0.4)", fontStyle: "italic", fontSize: "0.95rem" }}>
                {type === "public" ? "No public photos added yet." : "No private photos in your vault."}
              </Typography>
            </Box>
          )}
        </Box>
      </Card>
    );
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", background: "#0d0518", display: "flex", flexDirection: "column" }}>
        {isMobileOrTablet ? <AppHeaderMobile /> : <AppHeaderDesktop />}
        <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Loader />
        </Box>
        {isMobileOrTablet ? <AppFooterMobile /> : <AppFooterDesktop />}
      </Box>
    );
  }

  return (
    <ThemeProvider theme={profileTheme}>
      <Box
        sx={{
          minHeight: "100vh",
          width: "100%",
          backgroundColor: "#120820",
          background: "linear-gradient(135deg, #120820 0%, #0d0518 50%, #0a0415 100%)",
          position: "relative",
          overflow: "hidden",
          pb: { xs: 12, md: 8 },
        }}
      >
        {/* Top Right Glow Blob (Exact match to Pineapple page & Expo bgGlowTop) */}
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

        {/* Bottom Left Glow Blob (Exact match to Pineapple page & Expo bgGlowBottom) */}
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

        {isMobileOrTablet ? <AppHeaderMobile /> : <AppHeaderDesktop />}

        <Container maxWidth="lg" sx={{ pt: { xs: 0, md: 12 }, px: { xs: 1, sm: 2 }, position: "relative", zIndex: 1 }}>
          {/* PROFILE HERO HEADER SECTION (Single integrated banner card matching screenshots) */}
          <Card
            sx={{
              ...cardStyle,
              mb: 2,
              borderRadius: "24px",
              position: "relative",
              height: { xs: 290, md: 320 },
            }}
          >
            {/* Full-bleed Banner Image */}
            <Box sx={{ position: "absolute", inset: 0, overflow: "hidden" }}>
              <Image
                src={advertiser.ProfileBanner || DEFAULT_BANNER_IMAGE}
                alt="Profile Banner"
                fill
                priority
                sizes="100vw"
                style={{ objectFit: "cover" }}
              />
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(to bottom, transparent 0%, rgba(13, 5, 24, 0.45) 55%, #0d0518 100%)",
                }}
              />

              {/* Pencil Edit Button — top right */}
              <IconButton
                onClick={() => setOpenBannerDrawer(true)}
                sx={{
                  position: "absolute",
                  top: 20,
                  right: 20,
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  background: "rgba(22, 12, 38, 0.75)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  color: "#FFF",
                  backdropFilter: "blur(10px)",
                  "&:hover": { background: "rgba(255, 27, 107, 0.8)", transform: "scale(1.05)" },
                  zIndex: 10,
                }}
              >
                <Pencil size={16} />
              </IconButton>
            </Box>

            {/* Avatar + Meta Info Overlay Block at bottom of hero */}
            <Box
              sx={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                px: { xs: 2, md: 3 },
                pb: { xs: 2, md: 2.5 },
                zIndex: 5,
                display: "flex",
                flexDirection: "row",
                alignItems: "flex-end",
                gap: 2,
              }}
            >
              {/* Circular Avatar Wrapper */}
              <Box sx={{ position: "relative", width: 106, height: 106, flexShrink: 0 }}>
                {/* 3-Color Gradient Ring */}
                <Box
                  sx={{
                    width: 106,
                    height: 106,
                    borderRadius: "50%",
                    p: "3px",
                    background: "linear-gradient(135deg, #FF1B6B 0%, #7000FF 50%, #00D2FF 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 8px 30px rgba(0,0,0,0.6)",
                  }}
                >
                  <Box
                    sx={{
                      width: "100%",
                      height: "100%",
                      borderRadius: "50%",
                      overflow: "hidden",
                      background: "#120820",
                      position: "relative",
                    }}
                  >
                    <Image
                      src={advertiser.Avatar || DUMMY_AVATAR}
                      alt="Avatar"
                      fill
                      priority
                      sizes="106px"
                      style={{ objectFit: "cover" }}
                    />
                  </Box>
                </Box>

                {/* Pencil Edit Badge — bottom right */}
                <IconButton
                  onClick={() => setOpenAvatarDrawer(true)}
                  sx={{
                    position: "absolute",
                    bottom: 2,
                    right: 2,
                    width: 26,
                    height: 26,
                    p: 0,
                    background: "linear-gradient(135deg, #FF1B6B, #7000FF)",
                    border: "2px solid #0d0518",
                    color: "#FFF",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.5)",
                    "&:hover": { transform: "scale(1.1)" },
                    zIndex: 10,
                  }}
                >
                  <Pencil size={13} />
                </IconButton>

                {/* Crown Badge — bottom left (Paid Members) */}
                {isPaidMember && (
                  <Box
                    sx={{
                      position: "absolute",
                      bottom: 2,
                      left: 2,
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #FF1B6B, #9C27B0)",
                      border: "2px solid #0d0518",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#FFF",
                      boxShadow: "0 4px 10px rgba(0,0,0,0.5)",
                      zIndex: 10,
                    }}
                  >
                    <Crown size={13} />
                  </Box>
                )}
              </Box>

              {/* Info Column */}
              <Stack spacing={0.4} alignItems="flex-start" sx={{ flex: 1, minWidth: 0 }}>
                {isVerified && (
                  <Box
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 0.5,
                      backgroundColor: "rgba(0, 230, 118, 0.15)",
                      border: "1px solid rgba(0, 230, 118, 0.3)",
                      px: 1.2,
                      py: 0.3,
                      borderRadius: "14px",
                    }}
                  >
                    <CheckCircle2 size={13} color="#00E676" style={{ fill: "#00E676", color: "#0d0518" }} />
                    <Typography sx={{ color: "#00E676", fontSize: "11px", fontWeight: 800, letterSpacing: "0.5px" }}>
                      VERIFIED
                    </Typography>
                  </Box>
                )}

                <Typography
                  noWrap
                  variant="h5"
                  sx={{
                    color: "#FFFFFF",
                    fontWeight: 800,
                    fontSize: { xs: "1.35rem", sm: "1.6rem" },
                    letterSpacing: "0.3px",
                  }}
                >
                  {advertiser.Username || "Vansh dev"}
                </Typography>

                {renderAgeGenderText()}

                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <MapPin size={13} color="rgba(255,255,255,0.6)" />
                  <Typography noWrap sx={{ color: "rgba(255, 255, 255, 0.65)", fontSize: "0.85rem", fontWeight: 500 }}>
                    {advertiser.Location?.replace(", USA", "") || "Washington, DC"}
                  </Typography>
                </Stack>
              </Stack>
            </Box>
          </Card>

          {/* VERIFY YOUR PROFILE CARD (Shown if not verified) */}
          {!isVerified && (
            <Card
              sx={{
                ...cardStyle,
                mb: 2,
                p: { xs: 2, sm: 2.5 },
                background: "linear-gradient(135deg, rgba(255, 27, 107, 0.12) 0%, rgba(112, 0, 255, 0.08) 50%, rgba(20, 10, 35, 0.8) 100%)",
                borderColor: "rgba(255, 27, 107, 0.3)",
              }}
            >
              <Stack
                direction={{ xs: "column", sm: "row" }}
                alignItems="center"
                justifyContent="space-between"
                spacing={2}
                textAlign={{ xs: "center", sm: "left" }}
              >
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: "14px",
                      background: "rgba(255, 27, 107, 0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <ShieldCheck size={26} color="#FF1B6B" />
                  </Box>
                  <Box>
                    <Typography sx={{ color: "#FFF", fontWeight: 800, fontSize: "1.05rem" }}>
                      Verify Your Profile
                    </Typography>
                    <Typography sx={{ color: "rgba(255,255,255,0.65)", fontSize: "0.85rem" }}>
                      Get the blue checkmark to stand out and build trust.
                    </Typography>
                  </Box>
                </Stack>

                <Button
                  onClick={() => router.push("/profile-verification")}
                  sx={{
                    background: "linear-gradient(90deg, #FF1B6B 0%, #7000FF 100%)",
                    color: "#FFF",
                    fontWeight: 800,
                    fontSize: "0.85rem",
                    borderRadius: "100px",
                    px: 3,
                    py: 1,
                    textTransform: "none",
                    boxShadow: "0 4px 20px rgba(255, 27, 107, 0.3)",
                    whiteSpace: "nowrap",
                    "&:hover": { filter: "brightness(1.1)" },
                    width: { xs: "100%", sm: "auto" },
                  }}
                >
                  Verify Now ›
                </Button>
              </Stack>
            </Card>
          )}

          {/* PREMIUM MEMBER UPGRADE BANNER (Shown if free member) */}
          {!isPaidMember && (
            <Card
              sx={{
                ...cardStyle,
                mb: 2,
                p: { xs: 2, sm: 2.5 },
                background: "linear-gradient(135deg, rgba(255, 215, 0, 0.12) 0%, rgba(255, 140, 0, 0.08) 50%, rgba(20, 10, 35, 0.8) 100%)",
                borderColor: "rgba(255, 215, 0, 0.3)",
              }}
            >
              <Stack
                direction={{ xs: "column", sm: "row" }}
                alignItems="center"
                justifyContent="space-between"
                spacing={2}
                textAlign={{ xs: "center", sm: "left" }}
              >
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: "14px",
                      background: "rgba(255, 215, 0, 0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Crown size={26} color="#FFD700" />
                  </Box>
                  <Box>
                    <Typography sx={{ color: "#FFF", fontWeight: 800, fontSize: "1.05rem" }}>
                      Premium Member
                    </Typography>
                    <Typography sx={{ color: "rgba(255,255,255,0.65)", fontSize: "0.85rem" }}>
                      Unlock exclusive features and see who liked you.
                    </Typography>
                  </Box>
                </Stack>

                <Button
                  onClick={() => router.push("/membership")}
                  sx={{
                    background: "linear-gradient(90deg, #FFD700 0%, #FF8C00 100%)",
                    color: "#000",
                    fontWeight: 800,
                    fontSize: "0.85rem",
                    borderRadius: "100px",
                    px: 3,
                    py: 1,
                    textTransform: "none",
                    boxShadow: "0 4px 20px rgba(255, 215, 0, 0.3)",
                    whiteSpace: "nowrap",
                    "&:hover": { filter: "brightness(1.1)" },
                    width: { xs: "100%", sm: "auto" },
                  }}
                >
                  Upgrade Now ›
                </Button>
              </Stack>
            </Card>
          )}

          {/* 4. QUICK ACTIONS ROW (3 ITEMS: Membership, Preferences, Logout) */}
          <Card
            sx={{
              ...cardStyle,
              mb: 2.5,
              p: 1.5,
            }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 1,
              }}
            >
              <Box
                onClick={() => router.push("/membership")}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  py: 1,
                  gap: 0.8,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  borderRadius: "12px",
                  "&:hover": { background: "rgba(255, 255, 255, 0.05)" },
                }}
              >
                <Gem size={22} color="#C084FC" />
                <Typography sx={{ color: "#FFF", fontSize: "0.78rem", fontWeight: 700 }}>
                  Membership
                </Typography>
              </Box>

              <Box
                onClick={() => router.push("/prefrences")}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  py: 1,
                  gap: 0.8,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  borderRadius: "12px",
                  "&:hover": { background: "rgba(255, 255, 255, 0.05)" },
                }}
              >
                <Sliders size={22} color="#C084FC" />
                <Typography sx={{ color: "#FFF", fontSize: "0.78rem", fontWeight: 700 }}>
                  Preferences
                </Typography>
              </Box>

              <Box
                onClick={handleLogout}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  py: 1,
                  gap: 0.8,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  borderRadius: "12px",
                  "&:hover": { background: "rgba(255, 82, 82, 0.1)" },
                }}
              >
                <LogOut size={22} color="#FF5252" />
                <Typography sx={{ color: "#FF5252", fontSize: "0.78rem", fontWeight: 700 }}>
                  Logout
                </Typography>
              </Box>
            </Box>
          </Card>

          {/* 5. SEGMENTED TAB CONTROL (Overview | Gallery | Details 🔒) */}
          <Box
            sx={{
              position: "sticky",
              top: { xs: 60, md: 80 },
              zIndex: 100,
              mb: 2.5,
            }}
          >
            <Card
              sx={{
                background: "rgba(22, 12, 38, 0.9)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "100px",
                p: 0.5,
              }}
            >
              <Tabs
                value={activeTab}
                onChange={(_, val) => setActiveTab(val)}
                variant="fullWidth"
                sx={{
                  minHeight: 44,
                  "& .MuiTabs-indicator": { display: "none" },
                  "& .MuiTab-root": {
                    color: "rgba(255,255,255,0.6)",
                    fontWeight: 700,
                    textTransform: "none",
                    fontSize: "0.9rem",
                    minHeight: 44,
                    borderRadius: "100px",
                    transition: "all 0.3s ease",
                  },
                  "& .Mui-selected": {
                    color: "#FFF !important",
                    background: "linear-gradient(90deg, #FF1B6B 0%, #7000FF 100%)",
                    boxShadow: "0 4px 15px rgba(255, 27, 107, 0.3)",
                  },
                }}
              >
                <Tab label="Overview" />
                <Tab label="Gallery" />
                <Tab
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <span>Details</span>
                      <Lock size={14} />
                    </Box>
                  }
                />
              </Tabs>
            </Card>
          </Box>

          {/* TAB CONTENTS */}
          {activeTab === 0 && (
            <Fade in timeout={400}>
              <Box>
                <Stack spacing={2}>
                  {/* About Me Card */}
                  <Card sx={{ ...cardStyle, p: { xs: 2, md: 2.5 } }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            background: "rgba(112, 0, 255, 0.2)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <User size={18} color="#C084FC" />
                        </Box>
                        <Typography sx={{ color: "#FFF", fontWeight: 800, fontSize: "1.1rem" }}>
                          About Me
                        </Typography>
                      </Stack>
                      <Button
                        size="small"
                        onClick={() => setOpenAboutDrawer(true)}
                        startIcon={<Pencil size={14} />}
                        sx={{
                          color: "#C084FC",
                          fontWeight: 700,
                          textTransform: "none",
                          fontSize: "0.85rem",
                          "&:hover": { background: "rgba(192, 132, 252, 0.1)" },
                        }}
                      >
                        Edit
                      </Button>
                    </Stack>

                    {advertiser.Tagline && (
                      <Typography
                        sx={{
                          fontWeight: 700,
                          fontSize: "0.95rem",
                          color: "#FF6FA5",
                          mb: 1,
                          fontStyle: "italic",
                          wordBreak: "break-word",
                          overflowWrap: "anywhere",
                        }}
                      >
                        "{advertiser.Tagline}"
                      </Typography>
                    )}

                    <Typography
                      sx={{
                        color: "rgba(255,255,255,0.75)",
                        fontSize: "0.9rem",
                        lineHeight: 1.6,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {advertiser.About || "No bio written yet..."}
                    </Typography>
                  </Card>

                  {/* My Photos Section */}
                  <Card sx={{ ...cardStyle, p: { xs: 2, md: 2.5 } }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            background: "rgba(255, 27, 107, 0.2)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Camera size={18} color="#FF1B6B" />
                        </Box>
                        <Typography sx={{ color: "#FFF", fontWeight: 800, fontSize: "1.1rem" }}>
                          My Photos
                        </Typography>
                      </Stack>
                      <Button
                        size="small"
                        onClick={() => setActiveTab(1)}
                        sx={{ color: "#FF1B6B", fontWeight: 800, textTransform: "none", fontSize: "0.88rem" }}
                      >
                        View All
                      </Button>
                    </Stack>

                    <Box
                      sx={{
                        display: "flex",
                        gap: 1.5,
                        overflowX: "auto",
                        pb: 1,
                        "::-webkit-scrollbar": { height: 6 },
                        "::-webkit-scrollbar-thumb": { background: "rgba(255,255,255,0.2)", borderRadius: 3 },
                      }}
                    >
                      {/* + Add Photos Dashed Square Button */}
                      {profileImages.length < 6 && (
                        <Box
                          onClick={() => setOpenGalleryDrawer(true)}
                          sx={{
                            width: 110,
                            height: 110,
                            flexShrink: 0,
                            borderRadius: "16px",
                            border: "2px dashed #FF1B6B",
                            background: "rgba(255, 27, 107, 0.08)",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 0.8,
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            "&:hover": { background: "rgba(255, 27, 107, 0.15)", transform: "scale(1.02)" },
                          }}
                        >
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: "50%",
                              background: "linear-gradient(135deg, #FF1B6B, #7000FF)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Plus size={18} color="#FFF" />
                          </Box>
                          <Typography sx={{ color: "#FF1B6B", fontSize: "0.75rem", fontWeight: 800 }}>
                            Add Photos
                          </Typography>
                        </Box>
                      )}

                      {profileImages.map((img: any) => (
                        <Box
                          key={img.Id}
                          onClick={() => setActiveTab(1)}
                          sx={{
                            width: 110,
                            height: 110,
                            flexShrink: 0,
                            borderRadius: "16px",
                            overflow: "hidden",
                            position: "relative",
                            border: "2px solid rgba(255,255,255,0.08)",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            "&:hover": { transform: "scale(1.03)", borderColor: "#FF1B6B" },
                          }}
                        >
                          <Image src={img.Url} alt="Photo" fill sizes="110px" style={{ objectFit: "cover" }} />
                        </Box>
                      ))}
                    </Box>
                  </Card>

                  {/* Core Identity Card */}
                  <Card sx={{ ...cardStyle, p: { xs: 2, md: 2.5 } }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            background: "rgba(112, 0, 255, 0.2)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Fingerprint size={18} color="#C084FC" />
                        </Box>
                        <Typography sx={{ color: "#FFF", fontWeight: 800, fontSize: "1.1rem" }}>
                          Core Identity
                        </Typography>
                      </Stack>
                      <Button
                        size="small"
                        onClick={() => setOpenBasicDrawer(true)}
                        startIcon={<Pencil size={14} />}
                        sx={{
                          color: "#C084FC",
                          fontWeight: 700,
                          textTransform: "none",
                          fontSize: "0.85rem",
                          "&:hover": { background: "rgba(192, 132, 252, 0.1)" },
                        }}
                      >
                        Edit
                      </Button>
                    </Stack>

                    <Stack spacing={1.5}>
                      {[
                        { label: "Account Type:", value: advertiser.AccountType || "Single" },
                        { label: "Gender:", value: advertiser.Gender || "Male" },
                        {
                          label: "Age:",
                          value:
                            parseInt(advertiser.Age) > 18
                              ? advertiser.Age
                              : advertiser.DateOfBirth
                              ? new Date().getFullYear() - new Date(advertiser.DateOfBirth).getFullYear()
                              : advertiser.Age || "22",
                        },
                        ...(advertiser.AccountType === "Couple" || advertiser.AccountType === "Throuple"
                          ? [
                              { label: "Partner Gender:", value: advertiser.PartnerGender || "—" },
                              {
                                label: "Partner Age:",
                                value:
                                  parseInt(advertiser.PartnerAge) > 18
                                    ? advertiser.PartnerAge
                                    : advertiser.PartnerDateOfBirth
                                    ? new Date().getFullYear() - new Date(advertiser.PartnerDateOfBirth).getFullYear()
                                    : advertiser.PartnerAge || "—",
                              },
                            ]
                          : []),
                        {
                          label: "Member Since:",
                          value: advertiser.CreatedAt
                            ? new Date(advertiser.CreatedAt).toLocaleDateString("en-US", {
                                month: "long",
                                year: "numeric",
                              })
                            : advertiser.Created_at
                            ? new Date(advertiser.Created_at).toLocaleDateString("en-US", {
                                month: "long",
                                year: "numeric",
                              })
                            : "July 2026",
                        },
                      ].map((item) => (
                        <Box
                          key={item.label}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            py: 0.5,
                          }}
                        >
                          <Typography sx={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "0.95rem", fontWeight: 500 }}>
                            {item.label}
                          </Typography>
                          <Typography sx={{ color: "#FFFFFF", fontSize: "0.95rem", fontWeight: 800 }}>
                            {item.value}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Card>

                  {/* Physical Attributes Card */}
                  <Card sx={{ ...cardStyle, p: { xs: 2, md: 2.5 } }}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      onClick={() => setIsPhysicalExpanded(!isPhysicalExpanded)}
                      sx={{ cursor: "pointer", userSelect: "none" }}
                    >
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            background: "rgba(112, 0, 255, 0.2)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Dna size={18} color="#C084FC" />
                        </Box>
                        <Typography sx={{ color: "#FFF", fontWeight: 800, fontSize: "1.1rem" }}>
                          Physical Attributes
                        </Typography>
                      </Stack>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Button
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenPhysicalDrawer(true);
                          }}
                          startIcon={<Pencil size={14} />}
                          sx={{
                            color: "#C084FC",
                            fontWeight: 700,
                            textTransform: "none",
                            fontSize: "0.85rem",
                            "&:hover": { background: "rgba(192, 132, 252, 0.1)" },
                          }}
                        >
                          Edit
                        </Button>
                        {isPhysicalExpanded ? (
                          <ChevronUp size={20} color="rgba(255,255,255,0.6)" />
                        ) : (
                          <ChevronDown size={20} color="rgba(255,255,255,0.6)" />
                        )}
                      </Stack>
                    </Stack>

                    <Collapse in={isPhysicalExpanded} timeout={300}>
                      <Stack spacing={2} mt={2}>
                        {[
                          { label: "BODY TYPE", value: advertiser.BodyType || "Slim", icon: <User size={16} color="#FFF" /> },
                          { label: "HAIR COLOR", value: advertiser.HairColor || "Black", icon: <Palette size={16} color="#FFF" /> },
                          { label: "EYE COLOR", value: advertiser.EyeColor || "Black", icon: <Eye size={16} color="#FFF" /> },
                          { label: "SEXUAL ORIENTATION", value: advertiser.SexualOrientation || "Straight", icon: <Heart size={16} color="#FFF" /> },
                        ].map((item) => (
                          <Box key={item.label} sx={{ display: "flex", alignItems: "center", gap: 1.8 }}>
                            <Box
                              sx={{
                                width: 34,
                                height: 34,
                                borderRadius: "50%",
                                background: "rgba(112, 0, 255, 0.2)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              {item.icon}
                            </Box>
                            <Box>
                              <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.5px" }}>
                                {item.label}
                              </Typography>
                              <Typography sx={{ color: "#FFF", fontSize: "0.95rem", fontWeight: 800 }}>
                                {item.value}
                              </Typography>
                            </Box>
                          </Box>
                        ))}
                      </Stack>
                    </Collapse>
                  </Card>

                  {/* Contact Info Card */}
                  <Card sx={{ ...cardStyle, p: { xs: 2, md: 2.5 } }}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      onClick={() => setIsContactExpanded(!isContactExpanded)}
                      sx={{ cursor: "pointer", userSelect: "none" }}
                    >
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            background: "rgba(112, 0, 255, 0.2)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Activity size={18} color="#C084FC" />
                        </Box>
                        <Typography sx={{ color: "#FFF", fontWeight: 800, fontSize: "1.1rem" }}>
                          Contact Info
                        </Typography>
                      </Stack>
                      {isContactExpanded ? (
                        <ChevronUp size={20} color="rgba(255,255,255,0.6)" />
                      ) : (
                        <ChevronDown size={20} color="rgba(255,255,255,0.6)" />
                      )}
                    </Stack>

                    <Collapse in={isContactExpanded} timeout={300}>
                      <Stack spacing={2} mt={2}>
                        {[
                          {
                            label: "EMAIL ADDRESS",
                            value: advertiser?.Email || "baldhavansh2505@gmail.com",
                            icon: <Mail size={16} color="#FFF" />,
                            action: () => handleOpenDrawer("email"),
                          },
                          {
                            label: "PHONE NUMBER",
                            value: advertiser?.Phone || "+919737392505",
                            icon: <Phone size={16} color="#FFF" />,
                            action: () => handleOpenDrawer("phone"),
                          },
                          {
                            label: "LOCATION",
                            value: advertiser?.Location || "Washington, DC",
                            icon: <MapPin size={16} color="#FFF" />,
                            action: () => handleOpenDrawer("location"),
                          },
                          {
                            label: "MEMBER SINCE",
                            value: advertiser?.CreatedAt
                              ? new Date(advertiser.CreatedAt).toLocaleDateString("en-US", {
                                  month: "long",
                                  year: "numeric",
                                })
                              : advertiser?.Created_at
                              ? new Date(advertiser.Created_at).toLocaleDateString("en-US", {
                                  month: "long",
                                  year: "numeric",
                                })
                              : "July 2026",
                            icon: <Calendar size={16} color="#FFF" />,
                          },
                        ].map((item) => (
                          <Box key={item.label} sx={{ display: "flex", alignItems: "center", gap: 1.8 }}>
                            <Box
                              sx={{
                                width: 34,
                                height: 34,
                                borderRadius: "50%",
                                background: "rgba(112, 0, 255, 0.2)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              {item.icon}
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.5px" }}>
                                {item.label}
                              </Typography>
                              <Typography noWrap sx={{ color: "#FFF", fontSize: "0.95rem", fontWeight: 800 }}>
                                {item.value}
                              </Typography>
                            </Box>
                            {item.action && (
                              <IconButton
                                size="small"
                                onClick={item.action}
                                sx={{ color: "rgba(255,255,255,0.5)", "&:hover": { color: "#FF1B6B" } }}
                              >
                                <Pencil size={14} />
                              </IconButton>
                            )}
                          </Box>
                        ))}
                      </Stack>
                    </Collapse>
                  </Card>

                  {/* Swing Styles Card */}
                  <Card sx={{ ...cardStyle, p: { xs: 2, md: 2.5 } }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            background: "rgba(112, 0, 255, 0.2)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Globe size={18} color="#C084FC" />
                        </Box>
                        <Typography sx={{ color: "#FFF", fontWeight: 800, fontSize: "1.1rem" }}>
                          Swing Styles
                        </Typography>
                      </Stack>
                      <Button
                        size="small"
                        onClick={() => setOpenSwingDrawer(true)}
                        startIcon={<Pencil size={14} />}
                        sx={{
                          color: "#C084FC",
                          fontWeight: 700,
                          textTransform: "none",
                          fontSize: "0.85rem",
                          "&:hover": { background: "rgba(192, 132, 252, 0.1)" },
                        }}
                      >
                        Edit
                      </Button>
                    </Stack>

                    <Stack direction="row" flexWrap="wrap" gap={1.2}>
                      {advertiser.SwingStyleTags?.length > 0 ? (
                        advertiser.SwingStyleTags.map((tag: string) => (
                          <Chip
                            key={tag}
                            label={formatSwingLabel(tag)}
                            sx={{
                              background: "rgba(112, 0, 255, 0.25)",
                              color: "#C084FC",
                              height: 34,
                              px: 1,
                              fontSize: "0.85rem",
                              fontWeight: 700,
                              border: "1px solid rgba(112, 0, 255, 0.4)",
                              borderRadius: "100px",
                            }}
                          />
                        ))
                      ) : (
                        <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem", fontStyle: "italic" }}>
                          No swing styles selected yet.
                        </Typography>
                      )}
                    </Stack>
                  </Card>

                  {/* Upcoming Events Card */}
                  <Card sx={{ ...cardStyle, p: { xs: 2, md: 2.5 } }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            background: "rgba(255, 215, 0, 0.2)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Calendar size={18} color="#FFD700" />
                        </Box>
                        <Typography sx={{ color: "#FFF", fontWeight: 800, fontSize: "1.1rem" }}>
                          Upcoming Events
                        </Typography>
                      </Stack>
                      <Button
                        size="small"
                        onClick={() => router.push("/events")}
                        sx={{ color: "#FF1B6B", fontWeight: 800, textTransform: "none", fontSize: "0.88rem" }}
                      >
                        View All
                      </Button>
                    </Stack>

                    <Stack spacing={1.5}>
                      {events
                        .filter((e: any) => new Date(e.StartTime) >= new Date())
                        .sort((a: any, b: any) => new Date(a.StartTime).getTime() - new Date(b.StartTime).getTime())
                        .slice(0, 4).length > 0 ? (
                        events
                          .filter((e: any) => new Date(e.StartTime) >= new Date())
                          .sort((a: any, b: any) => new Date(a.StartTime).getTime() - new Date(b.StartTime).getTime())
                          .slice(0, 4)
                          .map((event: any, idx: number) => (
                            <Box
                              key={event.Id || idx}
                              onClick={() => router.push(`/events/detail/${event.Id}`)}
                              sx={{
                                p: 1.5,
                                background: "rgba(22, 12, 38, 0.6)",
                                borderRadius: "16px",
                                border: "1px solid rgba(255,255,255,0.08)",
                                display: "flex",
                                gap: 1.5,
                                alignItems: "center",
                                cursor: "pointer",
                                transition: "all 0.25s ease",
                                "&:hover": { transform: "translateY(-2px)", borderColor: "#FF1B6B" },
                              }}
                            >
                              <Box
                                sx={{
                                  width: 70,
                                  height: 70,
                                  borderRadius: "12px",
                                  overflow: "hidden",
                                  position: "relative",
                                  flexShrink: 0,
                                  background: "#120820",
                                }}
                              >
                                {event.CoverImageUrl ? (
                                  <Image src={event.CoverImageUrl} alt="Event" fill sizes="70px" style={{ objectFit: "cover" }} />
                                ) : (
                                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                                    <Calendar size={24} color="rgba(255,255,255,0.3)" />
                                  </Box>
                                )}
                              </Box>
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography noWrap sx={{ color: "#FFF", fontWeight: 800, fontSize: "0.95rem" }}>
                                  {event.Name}
                                </Typography>
                                <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.78rem", mt: 0.3 }}>
                                  {new Date(event.StartTime).toLocaleDateString("en-US")}
                                </Typography>
                                {event.Venue && (
                                  <Typography noWrap sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.78rem", mt: 0.2 }}>
                                    {event.Venue}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          ))
                      ) : (
                        <Typography sx={{ textAlign: "center", py: 4, color: "rgba(255,255,255,0.4)", fontStyle: "italic" }}>
                          No upcoming events found.
                        </Typography>
                      )}
                    </Stack>
                  </Card>
                </Stack>
              </Box>
            </Fade>
          )}

          {activeTab === 1 && <Fade in timeout={400}>{renderImageGalleryGrid("public")}</Fade>}
          {activeTab === 2 && <Fade in timeout={400}>{renderImageGalleryGrid("private")}</Fade>}
        </Container>

        {isMobileOrTablet ? <AppFooterMobile /> : <AppFooterDesktop />}

        {/* Feedback Snackbar */}
        <Snackbar
          open={snack.open}
          autoHideDuration={2000}
          onClose={() => setSnack({ ...snack, open: false })}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <Alert
            onClose={() => setSnack({ ...snack, open: false })}
            severity={snack.severity}
            variant="filled"
            sx={{
              borderRadius: "12px",
              boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
              fontWeight: 700,
            }}
          >
            {snack.message}
          </Alert>
        </Snackbar>

        {/* All Drawer Components */}
        <EmailDrawer
          open={openEmailDrawer}
          onClose={() => setOpenEmailDrawer(false)}
          profileId={profileId}
          currentEmail={advertiser.Email}
          username={advertiser.Username}
          onSuccess={(val: string) => handleContactSuccess("email", val)}
          onNotify={showToast}
        />
        <PhoneDrawer
          open={openPhoneDrawer}
          onClose={() => setOpenPhoneDrawer(false)}
          profileId={profileId}
          currentPhone={advertiser.Phone}
          onSuccess={(val: string) => handleContactSuccess("phone", val)}
          onNotify={showToast}
        />
        <LocationUpdateDrawer
          open={openLocationDrawer}
          onClose={() => setOpenLocationDrawer(false)}
          profileId={profileId}
          currentCity={advertiser.Location}
          onSuccess={(val: string) => handleContactSuccess("location", val)}
          onNotify={showToast}
        />

        <SwingStyleDrawer
          open={openSwingDrawer}
          onClose={() => setOpenSwingDrawer(false)}
          profileId={profileId}
          currentStyles={advertiser.SwingStyleTags}
          onSuccess={handleSwingSuccess}
          onNotify={showToast}
        />

        <PublicGalleryDrawer
          open={openGalleryDrawer}
          onClose={() => setOpenGalleryDrawer(false)}
          profileId={profileId}
          images={profileImages}
          onRefresh={handleRefreshGallery}
          onNotify={showToast}
        />

        <PrivateGalleryDrawer
          open={openPrivateDrawer}
          onClose={() => setOpenPrivateDrawer(false)}
          profileId={profileId}
          images={privateImages}
          onRefresh={handleRefreshPrivateGallery}
          onNotify={showToast}
        />

        <ImageCropDrawer
          open={openAvatarDrawer || openBannerDrawer}
          onClose={() => {
            setOpenAvatarDrawer(false);
            setOpenBannerDrawer(false);
          }}
          type={openAvatarDrawer ? "avatar" : "banner"}
          profileId={profileId}
          onSuccess={openAvatarDrawer ? handleAvatarSuccess : handleBannerSuccess}
          onNotify={showToast}
        />

        <PhysicalAttributesDrawer
          open={openPhysicalDrawer}
          onClose={() => setOpenPhysicalDrawer(false)}
          profileId={profileId}
          data={{
            BodyType: advertiser.BodyType,
            HairColor: advertiser.HairColor,
            EyeColor: advertiser.EyeColor,
            SexualOrientation: advertiser.SexualOrientation,
            Gender: advertiser.Gender,
            BirthDay: advertiser.BirthDay,
            AccountType: advertiser.AccountType,
            Location: advertiser.Location,
          }}
          onSuccess={handlePhysicalSuccess}
          onNotify={showToast}
        />

        <PartnerInfoDrawer
          open={openPartnerDrawer}
          onClose={() => setOpenPartnerDrawer(false)}
          profileId={profileId}
          data={{
            PartnerGender: advertiser.PartnerGender,
            PartnerSexualOrientation: advertiser.PartnerSexualOrientation,
            PartnerBirthDay: advertiser.PartnerBirthDay,
            PartnerBodyType: advertiser.PartnerBodyType,
            PartnerHairColor: advertiser.PartnerHairColor,
            PartnerEyeColor: advertiser.PartnerEyeColor,
          }}
          onSuccess={handlePartnerSuccess}
          onNotify={showToast}
        />

        <AboutMeDrawer
          open={openAboutDrawer}
          onClose={() => setOpenAboutDrawer(false)}
          profileId={profileId}
          data={{
            Tagline: advertiser.Tagline,
            About: advertiser.About,
          }}
          onSuccess={handleAboutSuccess}
          onNotify={showToast}
        />

        <BasicInfoDrawer
          open={openBasicDrawer}
          onClose={() => setOpenBasicDrawer(false)}
          profileId={profileId}
          data={{
            Username: advertiser.Username,
            AccountType: advertiser.AccountType,
            Gender: advertiser.Gender,
            Age: advertiser.Age,
            BirthDay: advertiser.BirthDay,
            PartnerGender: advertiser.PartnerGender,
            PartnerAge: advertiser.PartnerAge,
            PartnerBirthDay: advertiser.PartnerBirthDay,
          }}
          onSuccess={handleBasicSuccess}
          onNotify={showToast}
        />
      </Box>
    </ThemeProvider>
  );
};

export default ProfileDetail;
