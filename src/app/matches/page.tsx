"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { toast } from "react-toastify";
import {
  Box,
  Typography,
  Grid,
  Button,
  IconButton,
  Modal,
  FormControlLabel,
  Checkbox,
  Container,
  CircularProgress,
  TextField,
  Select,
  MenuItem,
  FormControl,
  Autocomplete,
  useMediaQuery,
  useTheme,
  Menu,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FlagIcon from "@mui/icons-material/Flag";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import FilterListIcon from "@mui/icons-material/FilterList";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import BlockIcon from "@mui/icons-material/Block";
import PeopleIcon from "@mui/icons-material/People";
import CancelIcon from "@mui/icons-material/Cancel";
import SortIcon from "@mui/icons-material/Sort";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import CloseIcon from "@mui/icons-material/Close";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import ReportIcon from "@mui/icons-material/Report";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import UserProfileModal from "@/components/UserProfileModal";
import ProfileImgCheckerModel from "@/components/ProfileImgCheckerModel";
import AppFooterMobile from "@/layout/AppFooterMobile";
import AppFooterDesktop from "@/layout/AppFooterDesktop";
import AppHeaderMobile from "@/layout/AppHeaderMobile";
import AppHeaderDesktop from "@/layout/AppHeaderDesktop";
import Loader from "@/commonPage/Loader";

interface Profile {
  Id: string;
  Username: string;
  Avatar: string | null;
  Age?: number | string;
  Gender?: string;
  Location?: string;
  Distance?: string;
  Bio?: string;
  DateOfBirth?: string | null;
  PartnerDateOfBirth?: string | null;
  PartnerGender?: string;
  PartnerAge?: number | string;
  ActionDate?: string | null;
  Category?: string;
  IsVerified?: boolean | string | number;
  is_verified?: boolean | string | number;
  selfie_verification_status?: string | boolean | number;
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

const isUserVerified = (p: Profile) =>
  checkVerified(p.IsVerified) ||
  checkVerified(p.is_verified) ||
  checkVerified(p.selfie_verification_status);

const formatActionTime = (dateStr?: string | null): string | null => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;

  const now = new Date();
  const isToday =
    d.getUTCFullYear() === now.getUTCFullYear() &&
    d.getUTCMonth() === now.getUTCMonth() &&
    d.getUTCDate() === now.getUTCDate();

  if (isToday) return "Today";

  const yesterday = new Date(now);
  yesterday.setUTCDate(now.getUTCDate() - 1);
  const isYesterday =
    d.getUTCFullYear() === yesterday.getUTCFullYear() &&
    d.getUTCMonth() === yesterday.getUTCMonth() &&
    d.getUTCDate() === yesterday.getUTCDate();

  if (isYesterday) return "Yesterday";

  const diffMs = Math.max(0, now.getTime() - d.getTime());
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;

  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const formatAgeGender = (profile: Profile) => {
  let mainPart = "";
  let partnerPart = "";

  const calcAge = (dob?: string | null, ageVal?: any) => {
    const ageNum = parseInt(String(ageVal || "0"), 10);
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

  const age1 = calcAge(profile.DateOfBirth, profile.Age);
  const age2 = calcAge(profile.PartnerDateOfBirth, profile.PartnerAge);

  if (age1) mainPart += age1;
  if (profile.Gender) {
    if (profile.Gender === "Male" || profile.Gender === "M") mainPart += "M";
    else if (profile.Gender === "Female" || profile.Gender === "F") mainPart += "F";
    else if (profile.Gender === "Couple" || profile.Gender === "C") mainPart += "C";
    else mainPart += ` ${profile.Gender}`;
  }

  if (age2) partnerPart += age2;
  if (profile.PartnerGender) {
    if (profile.PartnerGender === "Male" || profile.PartnerGender === "M") partnerPart += "M";
    else if (profile.PartnerGender === "Female" || profile.PartnerGender === "F") partnerPart += "F";
    else partnerPart += ` ${profile.PartnerGender}`;
  }

  if (mainPart && partnerPart) {
    return `${mainPart} | ${partnerPart}`;
  }
  return mainPart || partnerPart || "";
};

const filterTabs = [
  { key: "Matches", label: "Matches", icon: <FavoriteIcon sx={{ fontSize: 18 }} /> },
  { key: "Liked", label: "Liked", icon: <ThumbUpIcon sx={{ fontSize: 18 }} /> },
  { key: "Blocked", label: "Blocked", icon: <BlockIcon sx={{ fontSize: 18 }} /> },
  { key: "LikesMe", label: "Likes Me", icon: <FavoriteIcon sx={{ fontSize: 18 }} /> },
  { key: "Friends", label: "Friends", icon: <PeopleIcon sx={{ fontSize: 18 }} /> },
  { key: "Denied", label: "Denied", icon: <CancelIcon sx={{ fontSize: 18 }} /> },
  { key: "Search", label: "Search", icon: <SearchIcon sx={{ fontSize: 18 }} /> },
];

export default function MatchesPage() {
  const router = useRouter();
  const theme = useTheme();
  const isMobileOrTablet = useMediaQuery(theme.breakpoints.down("md"));

  const [profileId, setProfileId] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState("Matches");
  const [searchQuery, setSearchQuery] = useState("");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  // Sort State
  const [sortOption, setSortOption] = useState<"newest" | "oldest" | "alphabetical">("newest");
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);

  // Modals
  const [showDetail, setShowDetail] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportOptions, setReportOptions] = useState<ReportOptions>({
    reportUser: false,
    blockUser: false,
    reportImage: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Advanced Search Form States
  const [showSearchForm, setShowSearchForm] = useState(true);
  const [searchProfiles, setSearchProfiles] = useState<Profile[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [searchUsername, setSearchUsername] = useState("");
  const [selectedCityState, setSelectedCityState] = useState("");
  const [onlyWithPhotos, setOnlyWithPhotos] = useState(false);
  const [herAgeMin, setHerAgeMin] = useState("");
  const [herAgeMax, setHerAgeMax] = useState("");
  const [hisAgeMin, setHisAgeMin] = useState("");
  const [hisAgeMax, setHisAgeMax] = useState("");
  const [hisOrientation, setHisOrientation] = useState("");
  const [herOrientation, setHerOrientation] = useState("");

  const [cityOption, setCityOption] = useState<any[]>([]);
  const [cityLoading, setCityLoading] = useState(false);
  const [cityInput, setCityInput] = useState("");

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

  // City Autocomplete API Fetch
  useEffect(() => {
    if (!cityInput.trim()) {
      setCityOption([]);
      return;
    }
    const timer = setTimeout(async () => {
      setCityLoading(true);
      try {
        const res = await fetch(`/api/user/city?city=${encodeURIComponent(cityInput.trim())}`);
        if (res.ok) {
          const data = await res.json();
          const uniqueCities = (data.cities || []).filter(
            (c: any, index: number, self: any[]) => index === self.findIndex((t) => t.City === c.City)
          );
          setCityOption(uniqueCities);
        }
      } catch (err) {
        console.error("City fetch error:", err);
      } finally {
        setCityLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [cityInput]);

  // Fetch Profiles by Match Tab
  const fetchProfilesList = useCallback(async (filterType: string) => {
    if (filterType === "Search") {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/user/matches?id=${profileId}&match=${filterType}`);
      if (res.ok) {
        const data = await res.json();
        const apiProfiles = data.profiles || [];
        const mapped: Profile[] = apiProfiles.map((p: any) => ({
          Id: p.Id || p.id || p.TargetProfileId,
          Username: p.Username || p.username || "User",
          Avatar: p.Avatar || p.avatar || null,
          Age: p.Age || p.age || "",
          Gender: p.Gender || p.gender || "",
          Location: p.Location || p.location || "",
          Distance: p.Distance ? `${parseFloat(String(p.Distance).replace(/[^0-9.]/g, "") || "0.0").toFixed(1)} mi.` : "",
          Bio: p.Bio || p.bio || "",
          DateOfBirth: p.DateOfBirth || p.dateofbirth || null,
          PartnerDateOfBirth: p.PartnerDateOfBirth || p.partnerdateofbirth || null,
          PartnerGender: p.PartnerGender || p.partnergender || "",
          PartnerAge: p.PartnerAge || p.partnerage || "",
          ActionDate: p.lastupdate || p.LastUpdate || p.CreatedAt || p.createdat || null,
          Category: p.Category || p.category || filterType,
          IsVerified: p.IsVerified || p.is_verified || p.selfie_verification_status,
        }));
        setProfiles(mapped);
      } else {
        setProfiles([]);
      }
    } catch (err) {
      console.error("Error fetching matches:", err);
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    if (profileId && activeFilter !== "Search") {
      fetchProfilesList(activeFilter);
    }
  }, [profileId, activeFilter, fetchProfilesList]);

  // Filter & Sort profiles
  useEffect(() => {
    let list = [...profiles];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.Username.toLowerCase().includes(q) ||
          (p.Location && p.Location.toLowerCase().includes(q)) ||
          (p.Bio && p.Bio.toLowerCase().includes(q))
      );
    }

    list.sort((a, b) => {
      const tA = a.ActionDate ? new Date(a.ActionDate).getTime() : 0;
      const tB = b.ActionDate ? new Date(b.ActionDate).getTime() : 0;

      if (sortOption === "newest") return tB - tA;
      if (sortOption === "oldest") return tA - tB;
      if (sortOption === "alphabetical") return a.Username.localeCompare(b.Username);
      return 0;
    });

    setFilteredProfiles(list);
  }, [searchQuery, profiles, sortOption]);

  // Advanced Search Submit Handler
  const handleAdvancedSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSearching(true);
    setShowSearchForm(false);

    const queryParams = new URLSearchParams({
      loginprofileid: String(profileId),
      q_username: searchUsername.trim(),
      q_citystate: selectedCityState.trim(),
      q_onlywithphotos: onlyWithPhotos ? "1" : "0",
      q_hisagemin: hisAgeMin,
      q_hisagemax: hisAgeMax,
      q_heragemin: herAgeMin,
      q_heragemax: herAgeMax,
      q_herorientation: herOrientation,
      q_hisorientation: hisOrientation,
    }).toString();

    try {
      const res = await fetch(`/api/user/matches/search?${queryParams}`);
      if (res.ok) {
        const data = await res.json();
        const rawProfiles = data.profiles || [];
        const mapped: Profile[] = rawProfiles.map((p: any) => ({
          Id: p.Id || p.id,
          Username: p.Username || p.username || "User",
          Avatar: p.Avatar || p.avatar || null,
          Age: p.Age || p.age || "",
          Gender: p.Gender || p.gender || "",
          Location: p.Location || p.location || "",
          Distance: p.Distance ? `${parseFloat(String(p.Distance).replace(/[^0-9.]/g, "") || "0.0").toFixed(1)} mi.` : "",
          Bio: p.Bio || p.bio || "",
          DateOfBirth: p.DateOfBirth || p.dateofbirth || null,
          PartnerDateOfBirth: p.PartnerDateOfBirth || p.partnerdateofbirth || null,
          PartnerGender: p.PartnerGender || p.partnergender || "",
          PartnerAge: p.PartnerAge || p.partnerage || "",
          IsVerified: p.IsVerified || p.is_verified || p.selfie_verification_status,
        }));
        setSearchProfiles(mapped);
      } else {
        setSearchProfiles([]);
      }
    } catch (err) {
      console.error("Advanced search error:", err);
      setSearchProfiles([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Report & Action Handling
  const handleReportModalToggle = (profile: Profile | null) => {
    setSelectedProfile(profile);
    setIsReportModalOpen(!!profile);
    if (!profile) {
      setReportOptions({ reportUser: false, blockUser: false, reportImage: false });
    }
  };

  const handleReportSubmit = async () => {
    if (!selectedProfile || !profileId) return;
    setIsSubmitting(true);
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
            reportedUserId: selectedProfile.Id,
            reportedUserName: selectedProfile.Username,
            image: selectedProfile.Avatar || "",
          }),
        });
      }

      if (reportOptions.reportUser || reportOptions.blockUser) {
        await fetch("/api/user/sweeping/report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profileid: profileId, targetid: selectedProfile.Id }),
        });
      }

      toast.success("Report submitted successfully");
      setIsReportModalOpen(false);
      setProfiles((prev) => prev.filter((p) => p.Id !== selectedProfile.Id));
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const orientationOptions = ["Straight", "Bi", "Bi-curious", "Open minded", "All"];

  const renderProfileCard = (p: Profile) => {
    const ageGender = formatAgeGender(p);
    const verified = isUserVerified(p);
    const actionTime = formatActionTime(p.ActionDate);
    const city = p.Location ? p.Location.split(",")[0].trim().toUpperCase() : "";
    const dist = p.Distance || "0.0 mi.";
    const locationText = city ? `${city} • ${dist}` : dist;

    return (
      <Grid item xs={6} sm={4} md={3} lg={3} key={p.Id}>
        <Box
          onClick={() => {
            setSelectedUserId(p.Id);
            setShowDetail(true);
          }}
          sx={{
            position: "relative",
            width: "100%",
            aspectRatio: "0.72",
            borderRadius: "20px",
            overflow: "hidden",
            backgroundColor: "#1e1233",
            cursor: "pointer",
            transition: "transform 0.3s ease, box-shadow 0.3s ease",
            "&:hover": {
              transform: "translateY(-4px)",
              boxShadow: "0 12px 24px rgba(0,0,0,0.5), 0 0 15px rgba(255, 27, 107, 0.25)",
            },
          }}
        >
          {/* Card Avatar Image */}
          <Image
            src={p.Avatar || "/default-avatar.png"}
            alt={p.Username}
            fill
            sizes="(max-width: 600px) 50vw, (max-width: 960px) 33vw, 25vw"
            style={{ objectFit: "cover" }}
          />

          {/* Action Date / Time Ago Badge (Top Left) */}
          {actionTime && (
            <Box
              sx={{
                position: "absolute",
                top: 8,
                left: 8,
                backgroundColor: "rgba(0, 0, 0, 0.72)",
                borderRadius: "12px",
                px: 1,
                py: 0.4,
                display: "flex",
                alignItems: "center",
                gap: 0.4,
                border: "1px solid rgba(255, 255, 255, 0.15)",
                zIndex: 10,
              }}
            >
              <AccessTimeIcon sx={{ fontSize: 11, color: "#FFD700" }} />
              <Typography sx={{ color: "#FFD700", fontSize: "0.65rem", fontWeight: 700, lineHeight: 1 }}>
                {actionTime}
              </Typography>
            </Box>
          )}



          {/* Vignette Gradient Overlay at Bottom */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to bottom, transparent 45%, rgba(0, 0, 0, 0.4) 75%, rgba(0, 0, 0, 0.85) 100%)",
              zIndex: 1,
              pointerEvents: "none",
            }}
          />

          {/* Bottom Overlay Content */}
          <Box
            sx={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              p: 1.2,
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              zIndex: 2,
            }}
          >
            <Box sx={{ flex: 1, mr: 0.8, minWidth: 0 }}>
              <Typography
                sx={{
                  color: "#ffffff",
                  fontSize: { xs: "0.88rem", sm: "0.95rem" },
                  fontWeight: 800,
                  lineHeight: 1.2,
                  textShadow: "0 1px 3px rgba(0,0,0,0.6)",
                }}
                noWrap
              >
                {p.Username}{ageGender ? `, ${ageGender}` : ""}
              </Typography>

              <Typography
                sx={{
                  color: "rgba(255, 255, 255, 0.8)",
                  fontSize: { xs: "0.64rem", sm: "0.72rem" },
                  mt: 0.3,
                  textShadow: "0 1px 3px rgba(0,0,0,0.6)",
                }}
                noWrap
              >
                {locationText}
              </Typography>
            </Box>

            {/* Flag Action Button */}
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleReportModalToggle(p);
              }}
              sx={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                backgroundColor: "rgba(18, 8, 32, 0.85)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                color: "#ff3366",
                p: 0,
                flexShrink: 0,
                "&:hover": { backgroundColor: "rgba(255, 51, 102, 0.2)", borderColor: "#ff3366" },
              }}
            >
              <FlagIcon sx={{ fontSize: 14, color: "#ff3366" }} />
            </IconButton>
          </Box>
        </Box>
      </Grid>
    );
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

        <Box sx={{ flexGrow: 1, pt: { xs: 1, md: 16 }, pb: { xs: 12, md: 6 } }}>
          <Container maxWidth="xl">
            {/* Header Section matching Expo */}
            <Box sx={{ mb: { xs: 1.2, md: 2 }, px: { xs: 0.5, md: 0 } }}>
              <Typography
                sx={{
                  color: "#FF1B6B",
                  fontSize: { xs: "1.65rem", sm: "2rem", md: "2.2rem" },
                  fontWeight: 800,
                  letterSpacing: "0.02em",
                  mb: 0.2,
                }}
              >
                Matches
              </Typography>
              <Typography
                sx={{
                  color: "rgba(255, 255, 255, 0.6)",
                  fontSize: { xs: "0.85rem", sm: "0.95rem" },
                  fontWeight: 500,
                }}
              >
                Interact with your active matches and likes
              </Typography>
            </Box>

            {/* Horizontal Scrollable Filter Tabs Bar */}
            <Box
              sx={{
                display: "flex",
                gap: 1,
                overflowX: "auto",
                pb: 0.8,
                mb: 1,
                scrollbarWidth: "none",
                "&::-webkit-scrollbar": { display: "none" },
              }}
            >
              {filterTabs.map((tab) => {
                const isActive = activeFilter === tab.key;
                return (
                  <Button
                    key={tab.key}
                    onClick={() => {
                      setSearchQuery("");
                      setActiveFilter(tab.key);
                    }}
                    startIcon={tab.icon}
                    sx={{
                      px: 2,
                      py: 0.6,
                      borderRadius: "24px",
                      textTransform: "none",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      background: isActive
                        ? "linear-gradient(135deg, #FF1B6B 0%, #c2185b 100%)"
                        : "rgba(255, 255, 255, 0.08)",
                      color: isActive ? "#ffffff" : "rgba(255, 255, 255, 0.65)",
                      border: isActive ? "none" : "1px solid rgba(255, 255, 255, 0.12)",
                      boxShadow: "none !important",
                      "&:hover": {
                        background: isActive
                          ? "linear-gradient(135deg, #FF1B6B 0%, #c2185b 100%)"
                          : "rgba(255, 255, 255, 0.15)",
                        color: "#fff",
                        boxShadow: "none !important",
                      },
                    }}
                  >
                    {tab.label}
                  </Button>
                );
              })}
            </Box>

            {/* Solid Pink/Red Horizontal Divider Line (Exact match to 2nd reference screenshot) */}
            <Box
              sx={{
                width: "100%",
                height: "2px",
                background: "linear-gradient(90deg, #FF1B6B 0%, #FF2D55 50%, #7000FF 100%)",
                mb: 1.2,
                borderRadius: "1px",
              }}
            />

            {/* Quick Search Input for List Tabs */}
            {activeFilter !== "Search" && (
              <Box sx={{ mb: 1.5 }}>
                <TextField
                  fullWidth
                  size="small"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, location or bio..."
                  variant="outlined"
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ color: "rgba(255,255,255,0.4)", mr: 1, fontSize: 20 }} />,
                    endAdornment: searchQuery ? (
                      <IconButton size="small" onClick={() => setSearchQuery("")} sx={{ color: "rgba(255,255,255,0.4)" }}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    ) : null,
                    sx: {
                      color: "#fff",
                      backgroundColor: "rgba(255, 255, 255, 0.06)",
                      borderRadius: "12px",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      "& fieldset": { border: "none" },
                      "& .MuiOutlinedInput-input": {
                        py: "8px",
                        fontSize: "0.88rem",
                      },
                    },
                  }}
                />
              </Box>
            )}

            {/* Main Content Area */}
            {activeFilter === "Search" ? (
              showSearchForm ? (
                <Box
                  component="form"
                  onSubmit={handleAdvancedSearch}
                  sx={{
                    backgroundColor: "#160b24",
                    borderRadius: 4,
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    p: { xs: 2.5, sm: 4 },
                    mb: 4,
                  }}
                >
                  <Typography variant="h6" sx={{ color: "#fff", fontWeight: 800, mb: 3 }}>
                    Advanced Member Search
                  </Typography>

                  <Grid container spacing={2.5}>
                    {/* Username */}
                    <Grid item xs={12} sm={6}>
                      <Typography sx={{ color: "rgba(255,255,255,0.7)", fontWeight: 600, fontSize: "0.85rem", mb: 0.8 }}>
                        Username
                      </Typography>
                      <TextField
                        fullWidth
                        value={searchUsername}
                        onChange={(e) => setSearchUsername(e.target.value)}
                        placeholder="Search by username"
                        variant="outlined"
                        InputProps={{
                          sx: {
                            color: "#fff",
                            backgroundColor: "rgba(255,255,255,0.05)",
                            borderRadius: "10px",
                            "& fieldset": { borderColor: "rgba(255,255,255,0.15)" },
                          },
                        }}
                      />
                    </Grid>

                    {/* City, State Autocomplete */}
                    <Grid item xs={12} sm={6}>
                      <Typography sx={{ color: "rgba(255,255,255,0.7)", fontWeight: 600, fontSize: "0.85rem", mb: 0.8 }}>
                        City, State
                      </Typography>
                      <Autocomplete
                        options={cityOption.map((c) => `${c.City}, ${c.State}`)}
                        loading={cityLoading}
                        onInputChange={(_, newValue) => setCityInput(newValue)}
                        onChange={(_, newValue) => setSelectedCityState(newValue || "")}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder="Select City, State"
                            variant="outlined"
                            InputProps={{
                              ...params.InputProps,
                              sx: {
                                color: "#fff",
                                backgroundColor: "rgba(255,255,255,0.05)",
                                borderRadius: "10px",
                                "& fieldset": { borderColor: "rgba(255,255,255,0.15)" },
                              },
                            }}
                          />
                        )}
                      />
                    </Grid>

                    {/* Only Photos Checkbox */}
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={onlyWithPhotos}
                            onChange={(e) => setOnlyWithPhotos(e.target.checked)}
                            sx={{ color: "rgba(255,255,255,0.4)", "&.Mui-checked": { color: "#FF1B6B" } }}
                          />
                        }
                        label={
                          <Typography sx={{ color: "#fff", fontWeight: 600, fontSize: "0.9rem" }}>
                            Only profiles with Photos
                          </Typography>
                        }
                      />
                    </Grid>

                    {/* Her Age Range */}
                    <Grid item xs={12} sm={6}>
                      <Typography sx={{ color: "rgba(255,255,255,0.7)", fontWeight: 600, fontSize: "0.85rem", mb: 0.8 }}>
                        Her age between
                      </Typography>
                      <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                        <TextField
                          type="number"
                          value={herAgeMin}
                          onChange={(e) => setHerAgeMin(e.target.value)}
                          placeholder="Min"
                          InputProps={{
                            sx: {
                              color: "#fff",
                              backgroundColor: "rgba(255,255,255,0.05)",
                              borderRadius: "10px",
                              "& fieldset": { borderColor: "rgba(255,255,255,0.15)" },
                            },
                          }}
                        />
                        <Typography sx={{ color: "rgba(255,255,255,0.4)" }}>-</Typography>
                        <TextField
                          type="number"
                          value={herAgeMax}
                          onChange={(e) => setHerAgeMax(e.target.value)}
                          placeholder="Max"
                          InputProps={{
                            sx: {
                              color: "#fff",
                              backgroundColor: "rgba(255,255,255,0.05)",
                              borderRadius: "10px",
                              "& fieldset": { borderColor: "rgba(255,255,255,0.15)" },
                            },
                          }}
                        />
                      </Box>
                    </Grid>

                    {/* His Age Range */}
                    <Grid item xs={12} sm={6}>
                      <Typography sx={{ color: "rgba(255,255,255,0.7)", fontWeight: 600, fontSize: "0.85rem", mb: 0.8 }}>
                        His age between
                      </Typography>
                      <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                        <TextField
                          type="number"
                          value={hisAgeMin}
                          onChange={(e) => setHisAgeMin(e.target.value)}
                          placeholder="Min"
                          InputProps={{
                            sx: {
                              color: "#fff",
                              backgroundColor: "rgba(255,255,255,0.05)",
                              borderRadius: "10px",
                              "& fieldset": { borderColor: "rgba(255,255,255,0.15)" },
                            },
                          }}
                        />
                        <Typography sx={{ color: "rgba(255,255,255,0.4)" }}>-</Typography>
                        <TextField
                          type="number"
                          value={hisAgeMax}
                          onChange={(e) => setHisAgeMax(e.target.value)}
                          placeholder="Max"
                          InputProps={{
                            sx: {
                              color: "#fff",
                              backgroundColor: "rgba(255,255,255,0.05)",
                              borderRadius: "10px",
                              "& fieldset": { borderColor: "rgba(255,255,255,0.15)" },
                            },
                          }}
                        />
                      </Box>
                    </Grid>

                    {/* Her Orientation */}
                    <Grid item xs={12} sm={6}>
                      <Typography sx={{ color: "rgba(255,255,255,0.7)", fontWeight: 600, fontSize: "0.85rem", mb: 0.8 }}>
                        Her Sexual Orientation
                      </Typography>
                      <FormControl fullWidth>
                        <Select
                          value={herOrientation}
                          onChange={(e) => setHerOrientation(e.target.value)}
                          displayEmpty
                          sx={{
                            color: "#fff",
                            backgroundColor: "rgba(255,255,255,0.05)",
                            borderRadius: "10px",
                            "& fieldset": { borderColor: "rgba(255,255,255,0.15)" },
                          }}
                        >
                          <MenuItem value="">Any Orientation</MenuItem>
                          {orientationOptions.map((opt) => (
                            <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* His Orientation */}
                    <Grid item xs={12} sm={6}>
                      <Typography sx={{ color: "rgba(255,255,255,0.7)", fontWeight: 600, fontSize: "0.85rem", mb: 0.8 }}>
                        His Sexual Orientation
                      </Typography>
                      <FormControl fullWidth>
                        <Select
                          value={hisOrientation}
                          onChange={(e) => setHisOrientation(e.target.value)}
                          displayEmpty
                          sx={{
                            color: "#fff",
                            backgroundColor: "rgba(255,255,255,0.05)",
                            borderRadius: "10px",
                            "& fieldset": { borderColor: "rgba(255,255,255,0.15)" },
                          }}
                        >
                          <MenuItem value="">Any Orientation</MenuItem>
                          {orientationOptions.map((opt) => (
                            <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* Search Submit Button */}
                    <Grid item xs={12} sx={{ mt: 1 }}>
                      <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{
                          py: 1.4,
                          borderRadius: 3,
                          fontWeight: 700,
                          fontSize: "1rem",
                          textTransform: "none",
                          background: "linear-gradient(135deg, #FF1B6B 0%, #c2185b 100%)",
                          color: "#ffffff !important",
                          boxShadow: "none !important",
                          "&:hover": {
                            background: "linear-gradient(135deg, #e0175d 0%, #ad1450 100%)",
                            boxShadow: "none !important",
                          },
                        }}
                      >
                        Search Profiles
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              ) : (
                /* Search Results View */
                <Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                    <Button
                      startIcon={<FilterListIcon />}
                      onClick={() => setShowSearchForm(true)}
                      sx={{
                        color: "#FF1B6B",
                        fontWeight: 700,
                        backgroundColor: "rgba(255, 27, 107, 0.1)",
                        borderRadius: 3,
                        px: 2,
                        "&:hover": { backgroundColor: "rgba(255, 27, 107, 0.2)" },
                      }}
                    >
                      Modify Search Filters
                    </Button>
                    <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.88rem", fontWeight: 600 }}>
                      Found {searchProfiles.length} profiles
                    </Typography>
                  </Box>

                  {isSearching ? (
                    <Box sx={{ py: 10, display: "flex", justifyContent: "center" }}>
                      <CircularProgress color="secondary" />
                    </Box>
                  ) : searchProfiles.length === 0 ? (
                    <Box
                      sx={{
                        py: 10,
                        textAlign: "center",
                        backgroundColor: "rgba(20, 10, 35, 0.4)",
                        borderRadius: 6,
                        border: "1px solid rgba(255, 255, 255, 0.06)",
                      }}
                    >
                      <Typography sx={{ fontSize: "3rem", mb: 2 }}>🔍</Typography>
                      <Typography variant="h6" sx={{ color: "#fff", fontWeight: 800, mb: 1 }}>
                        No Profiles Found
                      </Typography>
                      <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.9rem" }}>
                        Try adjusting your search filters.
                      </Typography>
                    </Box>
                  ) : (
                    <Grid container spacing={{ xs: 1.5, sm: 2.5, md: 3 }}>
                      {searchProfiles.map((p) => renderProfileCard(p))}
                    </Grid>
                  )}
                </Box>
              )
            ) : loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 12 }}>
                <Loader />
              </Box>
            ) : filteredProfiles.length === 0 ? (
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
                  my: 3,
                }}
              >
                <Typography sx={{ fontSize: "3.5rem", mb: 2 }}>❤️</Typography>
                <Typography variant="h6" sx={{ color: "#fff", fontWeight: 800, mb: 1 }}>
                  No Connections Found
                </Typography>
                <Typography sx={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "0.92rem", mb: 3, maxWidth: 380 }}>
                  {searchQuery
                    ? "Try searching for a different name or location."
                    : activeFilter === "Matches"
                    ? "Keep swiping on the Members feed to discover mutual matches!"
                    : activeFilter === "LikesMe"
                    ? "No likes yet! Boost your profile to increase visibility."
                    : `Your ${activeFilter.toLowerCase()} list is currently empty.`}
                </Typography>
                {activeFilter === "Matches" && !searchQuery && (
                  <Button
                    variant="contained"
                    onClick={() => router.push("/members")}
                    sx={{
                      background: "linear-gradient(135deg, #FF1B6B 0%, #c2185b 100%)",
                      color: "#ffffff !important",
                      fontWeight: 700,
                      px: 3.5,
                      py: 1.2,
                      borderRadius: 3,
                      textTransform: "none",
                      boxShadow: "none !important",
                      "&:hover": {
                        background: "linear-gradient(135deg, #e0175d 0%, #ad1450 100%)",
                        boxShadow: "none !important",
                      },
                    }}
                  >
                    Start Swiping
                  </Button>
                )}
              </Box>
            ) : (
              /* Profiles Grid View */
              <Box>
                {/* Count & Sort Header Bar */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5, px: 0.5 }}>
                  <Typography sx={{ color: "rgba(255,255,255,0.7)", fontSize: "0.88rem", fontWeight: 600 }}>
                    {filteredProfiles.length} {filterTabs.find((t) => t.key === activeFilter)?.label || activeFilter} profile
                    {filteredProfiles.length === 1 ? "" : "s"}
                  </Typography>

                  <Button
                    onClick={(e) => setSortAnchorEl(e.currentTarget)}
                    startIcon={<SortIcon sx={{ color: "#FF1B6B" }} />}
                    endIcon={<KeyboardArrowDownIcon sx={{ color: "#FF1B6B" }} />}
                    sx={{
                      color: "#FF1B6B",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      textTransform: "none",
                      backgroundColor: "rgba(255, 27, 107, 0.08)",
                      borderRadius: "12px",
                      px: 1.8,
                      py: 0.6,
                      "&:hover": { backgroundColor: "rgba(255, 27, 107, 0.15)" },
                    }}
                  >
                    {sortOption === "newest"
                      ? "Recently Actioned"
                      : sortOption === "oldest"
                      ? "Oldest Actioned"
                      : "Alphabetical (A-Z)"}
                  </Button>

                  <Menu
                    anchorEl={sortAnchorEl}
                    open={Boolean(sortAnchorEl)}
                    onClose={() => setSortAnchorEl(null)}
                    PaperProps={{
                      sx: {
                        backgroundColor: "#160b24",
                        color: "#fff",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: "12px",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                      },
                    }}
                  >
                    <MenuItem
                      selected={sortOption === "newest"}
                      onClick={() => {
                        setSortOption("newest");
                        setSortAnchorEl(null);
                      }}
                      sx={{ fontSize: "0.88rem", fontWeight: 600 }}
                    >
                      Recently Actioned
                    </MenuItem>
                    <MenuItem
                      selected={sortOption === "oldest"}
                      onClick={() => {
                        setSortOption("oldest");
                        setSortAnchorEl(null);
                      }}
                      sx={{ fontSize: "0.88rem", fontWeight: 600 }}
                    >
                      Oldest Actioned
                    </MenuItem>
                    <MenuItem
                      selected={sortOption === "alphabetical"}
                      onClick={() => {
                        setSortOption("alphabetical");
                        setSortAnchorEl(null);
                      }}
                      sx={{ fontSize: "0.88rem", fontWeight: 600 }}
                    >
                      Alphabetical (A-Z)
                    </MenuItem>
                  </Menu>
                </Box>

                {/* Profiles Grid */}
                <Grid container spacing={{ xs: 1.5, sm: 2.5, md: 3 }}>
                  {filteredProfiles.map((p) => renderProfileCard(p))}
                </Grid>
              </Box>
            )}
          </Container>
        </Box>

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
              onClick={() =>
                setReportOptions({ ...reportOptions, reportImage: !reportOptions.reportImage })
              }
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
              onClick={() =>
                setReportOptions({ ...reportOptions, reportUser: !reportOptions.reportUser })
              }
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
              onClick={() =>
                setReportOptions({ ...reportOptions, blockUser: !reportOptions.blockUser })
              }
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
                color: "#ffffff !important",
                borderRadius: 4,
                py: 1.5,
                fontWeight: 700,
                fontSize: "1rem",
                textTransform: "none",
                boxShadow: "none !important",
                "&:hover": {
                  background: "linear-gradient(135deg, #E91E63 0%, #7B1FA2 100%)",
                  boxShadow: "none !important",
                },
                "&:disabled": {
                  background: "rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.3) !important",
                },
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

      {/* User Detail Profile Modal */}
      <UserProfileModal
        handleGrantAccess={() => {}}
        open={showDetail}
        handleClose={() => setShowDetail(false)}
        userid={selectedUserId || ""}
      />
    </Box>
  );
}
