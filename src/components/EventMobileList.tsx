"use client";

import { useEffect, useState, useMemo, startTransition, useRef } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Paper,
  Button,
  Stack,
  alpha,
  TextField,
  InputAdornment,
  IconButton,
  Autocomplete,
  CircularProgress,
  Chip,
  Slider,
  Drawer,
  Divider,
} from "@mui/material";
import { Add, Search, CalendarMonth, Tune as TuneIcon, AccessTime as AccessTimeIcon } from "@mui/icons-material";
import ClearIcon from "@mui/icons-material/Clear";
import { MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import Image from "next/image";
import Link from "next/link";
import { formatDateEST } from "@/utils/formatDateEST";
import Loader from "@/commonPage/Loader";
import { attachDistanceToEvent, cleanVenueText, formatDistanceText, getCoordsFromLocationText, parsePartnerEventDate, sortEventsByDateAndDistance } from "@/utils/distance";
import { getOptimizedImageUrl } from "@/utils/profileUtils";
import { isValidEventFlyer } from "@/utils/eventImageUtils";

function EventCardImage({ src, alt, priority, index }: { src?: string; alt: string; priority?: boolean; index: number }) {
  const [loaded, setLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [imgSrc, setImgSrc] = useState(() => (isValidEventFlyer(src) ? getOptimizedImageUrl(src, 600) : ""));

  useEffect(() => {
    if (isValidEventFlyer(src)) {
      const opt = getOptimizedImageUrl(src, 600);
      setImgSrc(opt);
      setHasError(false);
      setLoaded(false);
    } else {
      setImgSrc("");
      setHasError(true);
    }
  }, [src]);

  const isAboveTheFold = index < 4 || priority;

  if (!imgSrc || hasError) {
    return (
      <Box
        sx={{
          height: 260,
          width: "100%",
          background: "linear-gradient(135deg, #1f0838 0%, #0d021a 50%, #35002b 100%)",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          p: 3,
          textAlign: "center",
          borderBottom: "1px solid rgba(255, 45, 85, 0.2)",
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 800,
            background: "linear-gradient(45deg, #FFF 30%, #f50057 90%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
            fontSize: "1.1rem",
            lineHeight: 1.3,
          }}
        >
          {alt || "Exclusive Event"}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: 260,
        width: "100%",
        bgcolor: "#0A0216",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Shimmer Loader */}
      {!loaded && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(90deg, #180b30 25%, #2a154c 50%, #180b30 75%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.5s infinite linear",
            "@keyframes shimmer": {
              "0%": { backgroundPosition: "-200% 0" },
              "100%": { backgroundPosition: "200% 0" },
            },
            zIndex: 1,
          }}
        />
      )}

      {/* Main Optimized Poster */}
      <Image
        src={imgSrc}
        alt={alt || "Event Cover"}
        fill
        priority={isAboveTheFold}
        loading={isAboveTheFold ? "eager" : "lazy"}
        sizes="(max-width: 600px) 94vw, (max-width: 960px) 48vw, 420px"
        onLoad={() => setLoaded(true)}
        onError={() => setHasError(true)}
        style={{
          objectFit: "cover",
          objectPosition: "center",
          transition: "opacity 0.3s ease-in-out",
          opacity: loaded ? 1 : 0,
          zIndex: 2,
        }}
      />
    </Box>
  );
}

export default function EventMobileList({ profileId: propProfileId, initialEvents }: { profileId?: any; initialEvents?: any[] }) {
  const router = useRouter();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>(initialEvents || []);
  const [tabValue, setTabValue] = useState<"upcoming" | "past">("upcoming");
  const [searchText, setSearchText] = useState("");
  const [profileId, setProfileId] = useState<any>(propProfileId);

  // Floating Filter Drawer Open state
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const savedScrollYRef = useRef<number>(0);

  const handleOpenDrawer = () => {
    if (typeof window !== "undefined") {
      savedScrollYRef.current = window.scrollY || window.pageYOffset || 0;
    }
    setFilterDrawerOpen(true);
  };

  const handleApplyFilters = () => {
    const scrollTarget = savedScrollYRef.current;
    setFilterDrawerOpen(false);
    
    // Ensure display count is enlarged if expanded list has more events
    setDisplayCount((prev) => Math.max(prev, 30));

    if (typeof window !== "undefined") {
      requestAnimationFrame(() => {
        window.scrollTo({ top: scrollTarget, behavior: "instant" });
      });
      setTimeout(() => {
        window.scrollTo({ top: scrollTarget, behavior: "instant" });
      }, 50);
      setTimeout(() => {
        window.scrollTo({ top: scrollTarget, behavior: "instant" });
      }, 150);
    }
  };

  // Client Requirement: Mileage Range filter (Defaults to 0 - 100 miles)
  const [mileageRange, setMileageRange] = useState<number[]>(() => {
    if (typeof window === "undefined") return [0, 100];
    try {
      const saved = sessionStorage.getItem("mobile_events_search_state") || sessionStorage.getItem("events_search_state");
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed.mileageRange) ? parsed.mileageRange : [0, 100];
      }
    } catch (e) {}
    return [0, 100];
  });

  // Client Requirement: City & State Location Search (Synchronously restored from sessionStorage)
  const [selectedState, setSelectedState] = useState<any | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const saved = sessionStorage.getItem("mobile_events_search_state") || sessionStorage.getItem("events_search_state");
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.selectedState || null;
      }
    } catch (e) {}
    return null;
  });

  const [cityInput, setCityInput] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    try {
      const saved = sessionStorage.getItem("mobile_events_search_state") || sessionStorage.getItem("events_search_state");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.selectedState) {
          return parsed.selectedState.StateFull && parsed.selectedState.State
            ? `${parsed.selectedState.StateFull} (${parsed.selectedState.State})`
            : parsed.selectedState.StateFull || parsed.selectedState.State || "";
        }
        if (typeof parsed.cityInput === "string") return parsed.cityInput;
      }
    } catch (e) {}
    return "";
  });

  const [openCity, setOpenCity] = useState(false);
  const [cityLoading, setCityLoading] = useState(false);
  const [cityOption, setCityOption] = useState<any[]>([]);

  const [displayCount, setDisplayCount] = useState(15);
  const [isLocationLoading, setIsLocationLoading] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      const saved = sessionStorage.getItem("mobile_events_search_state") || sessionStorage.getItem("events_search_state");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.selectedState || parsed.cityInput) return false;
      }
    } catch (e) {}
    return true;
  });

  // Save filter state to sessionStorage on change
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stateToSave = {
        selectedState,
        cityInput,
        searchText,
        tabValue,
        mileageRange,
      };
      sessionStorage.setItem("mobile_events_search_state", JSON.stringify(stateToSave));
      sessionStorage.setItem("events_search_state", JSON.stringify(stateToSave));
    } catch (e) {
      console.error("Failed to save mobile events search state:", e);
    }
  }, [selectedState, cityInput, searchText, tabValue, mileageRange]);

  useEffect(() => {
    if (propProfileId) {
      setProfileId(propProfileId);
    } else if (typeof window !== "undefined") {
      const token = localStorage.getItem("loginInfo");
      if (token) {
        try {
          const decoded: any = jwtDecode(token);
          setProfileId(decoded?.profileId);
        } catch {
          // ignore
        }
      }
    }
  }, [propProfileId]);

  useEffect(() => {
    if (!openCity) {
      setCityOption([]);
      return;
    }
    if (cityInput === "") return;

    const fetchData = async () => {
      setCityLoading(true);
      try {
        const response = await fetch(`/api/usStates?state=${encodeURIComponent(cityInput)}`);
        if (response.ok) {
          const { states } = await response.json();
          const normalizeKey = (item: any) =>
            `${(item?.StateFull || "").replace(/,/g, "").replace(/\s+/g, " ").trim().toLowerCase()}_${(item?.State || "").trim().toLowerCase()}`;
          const uniqueStates = states.filter(
            (state: any, index: number, self: any[]) =>
              index === self.findIndex((t: any) => normalizeKey(t) === normalizeKey(state))
          );
          setCityOption(uniqueStates);
        }
      } catch (error) {
        console.error("Error fetching states:", error);
      } finally {
        setCityLoading(false);
      }
    };

    fetchData();
  }, [cityInput, openCity]);

  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [activeLocationLabel, setActiveLocationLabel] = useState<string>("");
  const [isTravelModeActive, setIsTravelModeActive] = useState<boolean>(false);

  // Compute Active Location Coordinates (Search box input takes precedence, otherwise fallback to User Profile / Travel Location)
  const activeCoords = useMemo(() => {
    if (cityInput.trim()) {
      const parsedCoords = getCoordsFromLocationText(cityInput);
      if (parsedCoords) {
        return { latitude: parsedCoords.lat, longitude: parsedCoords.lon };
      }
    }
    if (selectedState) {
      const stateText = selectedState.StateFull || selectedState.State || "";
      const parsedCoords = getCoordsFromLocationText(stateText);
      if (parsedCoords) {
        return { latitude: parsedCoords.lat, longitude: parsedCoords.lon };
      }
    }
    return userCoords;
  }, [cityInput, selectedState, userCoords]);

  // Search & Location Filter logic pulling from Event Title, Venue, or Selected Location
  const filteredEvents = useMemo(() => {
    let list = events;

    // 1. Keyword search (Name or Venue)
    const normalizedValue = searchText.replace(/\s+/g, " ").trim().toLowerCase();
    if (normalizedValue !== "") {
      list = list.filter((e: any) => {
        const titleMatch = (e.Name || "").toLowerCase().includes(normalizedValue);
        const venueMatch = (e.Venue || "").toLowerCase().includes(normalizedValue);
        const searchTxtMatch = (e.SearchText || "").toLowerCase().includes(normalizedValue);
        return titleMatch || venueMatch || searchTxtMatch;
      });
    }

    // 2. City & State Location Filter (e.g., "Arlington, VA", "Las Vegas, NV", "Virginia")
    // When coordinates are successfully resolved for the typed city/state,
    // distance-based radius filtering handles location matching accurately across nearby cities.
    if (!activeCoords) {
      const locRaw = (selectedState?.StateFull || selectedState?.State || cityInput || "").trim().toLowerCase();
      if (locRaw !== "") {
        const cleanLoc = locRaw.replace(/\s*\([a-z]{2}\)\s*$/i, "").trim();

        list = list.filter((e: any) => {
          const venue = (e.Venue || e.location || e.location_name || "").toLowerCase();
          const name = (e.Name || e.original_title || "").toLowerCase();
          const searchTxt = (e.SearchText || "").toLowerCase();
          const fullTxt = `${name} ${venue} ${searchTxt}`;

          if (cleanLoc.includes(",")) {
            const cityPart = cleanLoc.split(",")[0].trim();
            if (cityPart !== "") {
              return fullTxt.includes(cityPart);
            }
          }

          const stateFull = (selectedState?.StateFull || "").toLowerCase();
          const stateCode = (selectedState?.State || "").toLowerCase();
          if (stateFull && !stateFull.includes(",")) {
            const matchStateName = fullTxt.includes(stateFull);
            const matchStateCode = stateCode !== "" && (venue.includes(`, ${stateCode}`) || venue.endsWith(` ${stateCode}`));
            return matchStateName || matchStateCode;
          }

          return fullTxt.includes(cleanLoc);
        });
      }
    }

    return list;
  }, [events, searchText, selectedState, cityInput, activeCoords]);

  // Fetch both profile location AND travel mode preferences
  useEffect(() => {
    if (!profileId) {
      setUserCoords(null);
      setActiveLocationLabel("");
      setIsTravelModeActive(false);
      setIsLocationLoading(false);
      return;
    }

    let isMounted = true;

    async function loadUserLocationAndPreferences() {
      try {
        setIsLocationLoading(true);
        const [userRes, prefRes] = await Promise.allSettled([
          fetch(`/api/user/sweeping/user?id=${profileId}`).then((r) => r.json()),
          fetch("/api/user/preference", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: profileId }),
          }).then((r) => r.json()),
        ]);

        if (!isMounted) return;

        let travelMode = false;
        let travelLocation = "";
        let homeLocation = "";

        if (prefRes.status === "fulfilled" && prefRes.value) {
          const prefObj =
            prefRes.value?.data?.[0]?.get_preferences ??
            prefRes.value?.data?.[0] ??
            prefRes.value?.data ??
            null;

          if (prefObj) {
            travelMode = Number(prefObj.TravelMode) === 1;
            travelLocation = (prefObj.TravelLocation || "").trim();
            homeLocation = (prefObj.CityState || "").trim();
          }
        }

        if (userRes.status === "fulfilled" && userRes.value?.user) {
          const u = userRes.value.user;
          const userLoc =
            u?.Location ||
            u?.location ||
            u?.CityState ||
            (u?.City && u?.State ? `${u.City}, ${u.State}` : u?.City || u?.State || u?.Address || "");
          if (userLoc && userLoc.trim()) {
            homeLocation = userLoc.trim();
          }
        }

        let targetLocStr = homeLocation;

        if (targetLocStr) {
          const coords = getCoordsFromLocationText(targetLocStr);
          if (coords && isMounted) {
            setUserCoords({ latitude: coords.lat, longitude: coords.lon });
            setActiveLocationLabel(targetLocStr);
            setIsTravelModeActive(false);
            return;
          }
        }

        if (isMounted) {
          setUserCoords(null);
          setActiveLocationLabel("");
          setIsTravelModeActive(false);
        }
      } catch (err) {
        console.error("Failed to load user location/preferences:", err);
        if (isMounted) {
          setUserCoords(null);
          setActiveLocationLabel("");
          setIsTravelModeActive(false);
        }
      } finally {
        if (isMounted) {
          setIsLocationLoading(false);
        }
      }
    }

    loadUserLocationAndPreferences();

    const handlePrefUpdate = () => {
      loadUserLocationAndPreferences();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("preferencesUpdated", handlePrefUpdate);
      window.addEventListener("storage", handlePrefUpdate);
    }

    return () => {
      isMounted = false;
      if (typeof window !== "undefined") {
        window.removeEventListener("preferencesUpdated", handlePrefUpdate);
        window.removeEventListener("storage", handlePrefUpdate);
      }
    };
  }, [profileId]);

  const filteredByDistance = useMemo(() => {
    const eventsWithDistance = filteredEvents.map((e) => attachDistanceToEvent(e, activeCoords));
    return eventsWithDistance.filter((e) => {
      if (activeCoords && typeof e.distanceMiles === "number") {
        const dist = e.distanceMiles;
        if (dist < mileageRange[0]) return false;
        if (mileageRange[1] < 500 && dist > mileageRange[1]) return false;
      } else if (activeCoords && mileageRange[1] < 500) {
        return false;
      }
      return true;
    });
  }, [filteredEvents, activeCoords, mileageRange]);

  const startOfToday = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const displayUpcoming = useMemo(() => {
    const upcoming = filteredByDistance.filter((e) => e?.StartTime && new Date(e.StartTime) >= startOfToday);
    return sortEventsByDateAndDistance(upcoming, "upcoming");
  }, [filteredByDistance, startOfToday]);

  const displayPast = useMemo(() => {
    const past = filteredByDistance.filter((e) => e?.StartTime && new Date(e.StartTime) < startOfToday);
    return sortEventsByDateAndDistance(past, "past");
  }, [filteredByDistance, startOfToday]);

  const activeEventsList = tabValue === "upcoming" ? displayUpcoming : displayPast;

  if (isLocationLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          width: "100%",
          py: 8,
        }}
      >
        <Loader />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 8, px: 1 }}>
      {/* Top Header Row */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1.5,
          pt: 1,
        }}
      >
        <Box>
          <Typography
            variant="h5"
            color="white"
            sx={{
              fontWeight: 700,
              background: "linear-gradient(45deg, #e91e63, #9c27b0)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontSize: "1.80rem",
            }}
          >
            Events
          </Typography>
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)", display: "block", mt: -0.5 }}>
            Showing events within <strong style={{ color: "#ff2d55" }}>{mileageRange[0]} - {mileageRange[1] >= 500 ? "500+ miles" : `${mileageRange[1]} miles`}</strong>
          </Typography>
        </Box>

        {profileId && (
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              onClick={() => router.push("/events/calendar")}
              sx={{
                minWidth: "40px",
                width: "40px",
                height: "40px",
                p: 0,
                borderRadius: "12px",
                bgcolor: "rgba(255,255,255,0.1)",
                color: "#fff",
                backdropFilter: "blur(10px)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.2)" },
              }}
            >
              <CalendarMonth sx={{ fontSize: "1.2rem" }} />
            </Button>

            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => router.push("/events/create")}
              sx={{
                background: "linear-gradient(90deg, #FF2D55, #7000FF)",
                color: "#fff",
                fontWeight: "bold",
                textTransform: "none",
                borderRadius: "12px",
                px: 2,
                "&:hover": { opacity: 0.9 },
              }}
            >
              Create
            </Button>
          </Stack>
        )}
      </Box>

      {/* Inline Search Bar & Filter Toggle */}
      <Box sx={{ mb: 2.5 }}>
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              fullWidth
              size="small"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search events by name or venue..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: "rgba(255,255,255,0.5)", fontSize: 18 }} />
                  </InputAdornment>
                ),
                endAdornment: searchText ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchText("")} sx={{ color: "rgba(255,255,255,0.6)" }}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
              sx={{
                flex: 1,
                "& .MuiOutlinedInput-root": {
                  height: "44px",
                  color: "white",
                  bgcolor: "rgba(20, 10, 35, 0.6)",
                  borderRadius: "14px",
                  "& fieldset": { borderColor: "rgba(255,255,255,0.15)" },
                  "&:hover fieldset": { borderColor: "rgba(255,255,255,0.3)" },
                  "&.Mui-focused fieldset": { borderColor: "#ff2d55" },
                },
              }}
            />

            {/* Quick Filter Toggle Button */}
            <Button
              variant="contained"
              onClick={handleOpenDrawer}
              sx={{
                minWidth: "44px",
                width: "44px",
                height: "44px",
                p: 0,
                borderRadius: "14px",
                background: "linear-gradient(135deg, #FF2D55 0%, #7000FF 100%)",
                color: "#ffffff",
                boxShadow: "none",
                "&:hover": { opacity: 0.9, boxShadow: "none" },
              }}
            >
              <TuneIcon sx={{ fontSize: "1.2rem" }} />
            </Button>
          </Stack>

          <Stack direction="row" spacing={1} sx={{ width: "100%", bgcolor: "rgba(20, 10, 35, 0.4)", p: 0.5, borderRadius: "12px" }}>
            <Button
              fullWidth
              onClick={() => setTabValue("upcoming")}
              sx={{
                borderRadius: "10px",
                py: 0.6,
                fontSize: "0.9rem",
                textTransform: "none",
                fontWeight: tabValue === "upcoming" ? "bold" : "medium",
                color: tabValue === "upcoming" ? "#fff" : "rgba(255,255,255,0.5)",
                bgcolor: tabValue === "upcoming" ? "#c51162" : "transparent",
                transition: "all 0.3s ease",
              }}
            >
              Upcoming ({displayUpcoming.length})
            </Button>
            <Button
              fullWidth
              onClick={() => setTabValue("past")}
              sx={{
                borderRadius: "10px",
                py: 0.6,
                fontSize: "0.9rem",
                textTransform: "none",
                fontWeight: tabValue === "past" ? "bold" : "medium",
                color: tabValue === "past" ? "#fff" : "rgba(255,255,255,0.5)",
                bgcolor: tabValue === "past" ? "rgba(112, 0, 255, 0.8)" : "transparent",
                transition: "all 0.3s ease",
              }}
            >
              Past ({displayPast.length})
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* Floating Sticky Filter Icon Button (Positioned cleanly above bottom navbar) */}
      <Box
        sx={{
          position: "fixed",
          bottom: 95,
          right: 16,
          zIndex: 999,
        }}
      >
        <Button
          variant="contained"
          onClick={handleOpenDrawer}
          startIcon={<TuneIcon sx={{ fontSize: "1.1rem", color: "#ffffff" }} />}
          sx={{
            background: "linear-gradient(135deg, #FF2D55 0%, #7000FF 100%)",
            color: "#ffffff",
            fontWeight: 800,
            fontSize: "0.8rem",
            borderRadius: "30px",
            px: 2,
            py: 1,
            height: "40px",
            boxShadow: "none",
            border: "1.5px solid rgba(255, 255, 255, 0.4)",
            backdropFilter: "blur(12px)",
            textTransform: "none",
            transition: "all 0.25s ease-in-out",
            "&:hover": {
              transform: "scale(1.05)",
              boxShadow: "none",
            },
            "&:active": { transform: "scale(0.95)" },
          }}
        >
          Filters ({mileageRange[0]}-{mileageRange[1] >= 500 ? "500+" : `${mileageRange[1]}`} mi)
        </Button>
      </Box>

      {/* Popup Filter Drawer / Bottom Sheet */}
      <Drawer
        anchor="bottom"
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        disableScrollLock={true}
        PaperProps={{
          sx: {
            borderTopLeftRadius: "24px",
            borderTopRightRadius: "24px",
            bgcolor: "#140824",
            color: "white",
            p: 3,
            borderTop: "2px solid rgba(255, 45, 85, 0.5)",
            boxShadow: "0 -10px 40px rgba(0, 0, 0, 0.8)",
            maxHeight: "85vh",
          },
        }}
      >
        <Stack spacing={2.5}>
          {/* Drawer Header */}
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: "white", display: "flex", alignItems: "center", gap: 1 }}>
                <TuneIcon sx={{ color: "#ff2d55" }} /> Event Filters & Radius
              </Typography>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)" }}>
                Adjust distance, location & search keyword
              </Typography>
            </Box>
            <IconButton onClick={() => setFilterDrawerOpen(false)} sx={{ color: "rgba(255,255,255,0.7)", bgcolor: "rgba(255,255,255,0.08)" }}>
              <ClearIcon />
            </IconButton>
          </Stack>

          <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />

          {/* City & State Location Search */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "white", mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
              <MapPin size={16} color="#ff2d55" /> Location (City & State)
            </Typography>
            <Autocomplete
              id="drawer-location-autocomplete"
              open={openCity}
              onOpen={() => setOpenCity(true)}
              onClose={() => setOpenCity(false)}
              isOptionEqualToValue={(option, value) => option.StateFull === value.StateFull}
              getOptionLabel={(option) =>
                option.StateFull && option.State
                  ? `${option.StateFull} (${option.State})`
                  : option.StateFull || ""
              }
              options={cityOption}
              loading={cityLoading}
              inputValue={cityInput}
              value={selectedState}
              size="small"
              fullWidth
              noOptionsText="Type city or state..."
              onInputChange={(e, v) => {
                if (e?.type === "change" || e?.type === "click") setCityInput(v);
              }}
              onChange={(_, v) => {
                startTransition(() => {
                  setSelectedState(v || null);
                  if (!v) setCityInput("");
                });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Search by state or city..."
                  size="small"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: <MapPin size={18} color="rgba(255,255,255,0.5)" style={{ marginRight: 6 }} />,
                    endAdornment: (
                      <>
                        {cityLoading && <CircularProgress color="inherit" size={15} />}
                        {(selectedState || cityInput) && (
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedState(null);
                              setCityInput("");
                            }}
                            sx={{ color: "rgba(255, 255, 255, 0.7)", p: "2px" }}
                          >
                            <ClearIcon sx={{ fontSize: "1rem" }} />
                          </IconButton>
                        )}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      height: "45px",
                      color: "white",
                      bgcolor: "rgba(20, 10, 35, 0.6)",
                      borderRadius: "14px",
                      "& fieldset": { borderColor: "rgba(255,255,255,0.15)" },
                      "&:hover fieldset": { borderColor: "rgba(255,255,255,0.3)" },
                      "&.Mui-focused fieldset": { borderColor: "#ff2d55" },
                    },
                  }}
                />
              )}
            />
          </Box>

          {/* Dual Range Mileage Slider */}
          <Box sx={{ px: 1, pt: 1 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="subtitle2" sx={{ color: "white", fontWeight: 700 }}>
                Distance Range: <span style={{ color: "#FF2D55" }}>{mileageRange[0]} - {mileageRange[1] >= 500 ? "500+ mi" : `${mileageRange[1]} mi`}</span>
              </Typography>
              <Chip
                label="Reset 0-100 mi"
                size="small"
                onClick={() => setMileageRange([0, 100])}
                sx={{ height: 22, fontSize: "0.7rem", bgcolor: "rgba(255,45,85,0.2)", color: "#ff2d55", fontWeight: 700, cursor: "pointer" }}
              />
            </Stack>
            <Slider
              value={mileageRange}
              min={0}
              max={500}
              step={25}
              onChange={(_, value) => setMileageRange(value as number[])}
              valueLabelDisplay="auto"
              valueLabelFormat={(val) => `${val} mi`}
              disableSwap
              marks={[
                { value: 0, label: "0" },
                { value: 100, label: "100" },
                { value: 250, label: "250" },
                { value: 500, label: "500+" },
              ]}
              sx={{
                color: "#FF2D55",
                py: 1.5,
                touchAction: "none",
                "& .MuiSlider-track": { height: 6, borderRadius: 99, background: "linear-gradient(90deg, #FF2D55, #7000FF)" },
                "& .MuiSlider-rail": { height: 6, opacity: 0.2, borderRadius: 99, bgcolor: "#ffffff" },
                "& .MuiSlider-thumb": {
                  width: 26,
                  height: 26,
                  bgcolor: "#ffffff",
                  border: "3px solid #FF2D55",
                  boxShadow: "0 4px 12px rgba(255,45,85,0.5)",
                  touchAction: "none",
                  "&:focus, &:hover, &.Mui-active, &.Mui-focusVisible": {
                    boxShadow: "0 0 0 10px rgba(255, 45, 85, 0.25)",
                  },
                },
                "& .MuiSlider-markLabel": { color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: 600 },
                "& .MuiSlider-valueLabel": {
                  background: "linear-gradient(90deg, #FF2D55, #7000FF)",
                  borderRadius: "6px",
                  fontSize: 11,
                  fontWeight: 700,
                },
              }}
            />
          </Box>

          {/* Action Buttons */}
          <Stack direction="row" spacing={2} sx={{ pt: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                setMileageRange([0, 100]);
                setCityInput("");
                setSelectedState(null);
                setSearchText("");
              }}
              sx={{
                borderColor: "rgba(255,255,255,0.2)",
                color: "white",
                fontWeight: 700,
                borderRadius: "14px",
                py: 1.2,
                textTransform: "none",
              }}
            >
              Clear All
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={handleApplyFilters}
              sx={{
                background: "linear-gradient(90deg, #FF2D55, #7000FF)",
                color: "white",
                fontWeight: 800,
                borderRadius: "14px",
                py: 1.2,
                textTransform: "none",
                boxShadow: "none",
                "&:hover": { boxShadow: "none" },
              }}
            >
              Apply Filters ({activeEventsList.length})
            </Button>
          </Stack>
        </Stack>
      </Drawer>

      {/* Cards List - EXACT SAME Card Design as Desktop Mode */}
      <Stack spacing={3}>
        {activeEventsList.slice(0, displayCount).map((ev: any, index: number) => (
          <Paper
            key={ev?.Id}
            elevation={8}
            component={Link}
            href={ev?.isPartnerEvent ? '/partner-events/' + (ev.Slug || String(ev.Id).replace('partner_', '')) : "/events/detail/" + ev?.Id}
            sx={{
              p: 0,
              display: "flex",
              flexDirection: "column",
              background: "rgba(20, 10, 35, 0.95)",
              backdropFilter: "blur(20px)",
              overflow: "hidden",
              border: "2px solid rgba(245, 0, 87, 0.6)",
              borderRadius: "16px",
              cursor: "pointer",
              transition: "all 0.3s ease-in-out",
              textDecoration: "none",
              "&:hover": {
                borderColor: "rgba(245, 0, 87, 0.9)",
                boxShadow: "0 12px 30px rgba(245, 0, 87, 0.3)",
              },
            }}
          >
            <Box sx={{ position: "relative", display: "flex", flexDirection: "column" }}>
              {/* Fast Image Component with Shimmer Loading & Fallback */}
              <EventCardImage src={ev?.CoverImageUrl} alt={ev?.Name || "Event Cover"} index={index} />

                {/* Top Badges Container (Type, Category, Distance) */}
                <Box
                  sx={{
                    position: "absolute",
                    top: 14,
                    left: 14,
                    right: 14,
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 1,
                    zIndex: 10,
                    pointerEvents: "none",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, flexWrap: "wrap", minWidth: 0, flex: 1 }}>
                    <Chip
                      label={ev?.isPartnerEvent ? "Partner Event" : "Platform Event"}
                      size="small"
                      sx={{
                        bgcolor: ev?.isPartnerEvent ? "rgba(255, 45, 85, 0.95)" : "rgba(112, 0, 255, 0.95)",
                        color: "#ffffff",
                        fontWeight: 800,
                        fontSize: "0.72rem",
                        height: 24,
                        border: "1px solid rgba(255, 255, 255, 0.3)",
                        backdropFilter: "blur(8px)",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.4)",
                      }}
                    />
                    {ev?.Category && ev?.Category !== "Partner Event" && (
                      <Chip
                        label={ev.Category}
                        size="small"
                        sx={{
                          bgcolor: alpha("#000", 0.8),
                          color: "#ffffff",
                          fontWeight: 700,
                          fontSize: "0.72rem",
                          height: 24,
                          border: "1px solid rgba(255, 255, 255, 0.2)",
                          backdropFilter: "blur(10px)",
                          maxWidth: "120px",
                          "& .MuiChip-label": {
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          },
                        }}
                      />
                    )}
                  </Box>

                  {/* Distance Badge */}
                  {typeof ev.distanceMiles === "number" && (
                    <Chip
                      icon={<MapPin size={12} color="#ff2d55" style={{ marginLeft: 6 }} />}
                      label={formatDistanceText(ev.distanceMiles)}
                      size="small"
                      sx={{
                        bgcolor: "rgba(0,0,0,0.85)",
                        color: "#ffffff",
                        fontWeight: 800,
                        fontSize: "0.72rem",
                        height: 24,
                        backdropFilter: "blur(8px)",
                        border: "1px solid rgba(255,45,85,0.5)",
                        flexShrink: 0,
                      }}
                    />
                  )}
                </Box>

              {/* Card Body & Details (Same as Desktop mode) */}
              <Box
                sx={{
                  p: 3,
                  flexGrow: 1,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    mb: 1,
                    fontWeight: "bold",
                    background: "linear-gradient(45deg, #FFF 30%, #f50057 90%)",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    color: "transparent",
                    lineHeight: 1.3,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {ev.Name}
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: 1.5,
                  }}
                >
                  <AccessTimeIcon sx={{ fontSize: 16, color: alpha("#fff", 0.7) }} />
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)" }}>
                    <strong>Starts:</strong> {formatDateEST(ev.StartTime)}
                  </Typography>
                </Box>

                {(ev.Venue || typeof ev.distanceMiles === "number") && (
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ color: "rgba(255,255,255,0.7)", mb: 2.5 }}>
                    <MapPin size={15} color="#f50057" />
                    <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                      {cleanVenueText(ev.Venue) || "Location"}
                      {typeof ev.distanceMiles === "number" ? ` • ${formatDistanceText(ev.distanceMiles)}` : ""}
                    </Typography>
                  </Stack>
                )}

                <Button
                  fullWidth
                  variant="contained"
                  sx={{
                    background: "linear-gradient(45deg, #FF2D55, #7000FF)",
                    color: "#ffffff",
                    fontWeight: 700,
                    borderRadius: "10px",
                    py: 1,
                    mt: "auto",
                  }}
                >
                  View Details
                </Button>
              </Box>
            </Box>
          </Paper>
        ))}
      </Stack>

      {activeEventsList.length > displayCount && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4, mb: 1 }}>
          <Button
            onClick={() => setDisplayCount((prev) => prev + 15)}
            variant="outlined"
            sx={{
              borderColor: "#f50057",
              color: "#f50057",
              fontWeight: "bold",
              borderRadius: "12px",
              px: 4,
              py: 1.2,
            }}
          >
            Load More Events
          </Button>
        </Box>
      )}

      {/* Expand Mileage Callout Banner (Appears when range is < 500 mi e.g. 0-100 mi) */}
      {mileageRange[1] < 500 && (
        <Paper
          elevation={6}
          sx={{
            mt: 4,
            mb: 2,
            p: 3,
            borderRadius: "20px",
            background: "linear-gradient(135deg, rgba(20, 10, 35, 0.95) 0%, rgba(40, 15, 60, 0.95) 100%)",
            border: "1.5px dashed rgba(255, 45, 85, 0.6)",
            textAlign: "center",
            boxShadow: "none",
          }}
        >
          <Stack spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                bgcolor: "rgba(255, 45, 85, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FF2D55",
              }}
            >
              <MapPin size={24} color="#FF2D55" />
            </Box>

            <Typography variant="h6" sx={{ fontWeight: 800, color: "white", fontSize: "1.05rem" }}>
              Reached end of events within {mileageRange[0]} - {mileageRange[1]} miles!
            </Typography>

            <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.7)", maxWidth: "340px", fontSize: "0.85rem" }}>
              Want to see more events across the country? Expand your distance range to {mileageRange[1] < 250 ? "250 miles" : "500+ miles"}.
            </Typography>

            <Button
              variant="contained"
              onClick={() => setFilterDrawerOpen(true)}
              startIcon={<TuneIcon />}
              sx={{
                mt: 1,
                background: "linear-gradient(90deg, #FF2D55, #7000FF)",
                color: "white",
                fontWeight: 800,
                borderRadius: "12px",
                px: 3,
                py: 1.2,
                fontSize: "0.85rem",
                textTransform: "none",
                boxShadow: "none",
                transition: "transform 0.2s ease-in-out",
                "&:hover": { transform: "scale(1.03)", boxShadow: "none" },
              }}
            >
              Adjust Filter & Expand Miles
            </Button>
          </Stack>
        </Paper>
      )}
    </Box>
  );
}
