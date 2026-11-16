"use client";

import { useEffect, useMemo, useState, startTransition, useRef } from "react";
import {
  Box,
  Grid,
  IconButton,
  Typography,
  Paper,
  Button,
  Chip,
  Stack,
  alpha,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Autocomplete,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  Drawer,
  Divider,
} from "@mui/material";
import {
  ChevronLeft,
  ChevronRight,
  CalendarToday,
  ViewList,
  Search,
  Clear as ClearIcon,
  Tune as TuneIcon,
} from "@mui/icons-material";
import AddIcon from "@mui/icons-material/Add";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";
import { jwtDecode } from "jwt-decode";
import CircularProgress from "@mui/material/CircularProgress";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { formatDateEST } from "@/utils/formatDateEST";
import Image from "next/image";
import Loader from "@/commonPage/Loader";
import Link from "next/link";
import { attachDistanceToEvent, cleanVenueText, formatDistanceText, getCoordsFromLocationText, parsePartnerEventDate, sortEventsByDateAndDistance } from "@/utils/distance";

const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;

type EventItem = {
  Id: string | number;
  Slug?: string;
  Name: string;
  Category?: string;
  StartTime: string;
  Venue?: string;
  Description?: string;
  CoverImageUrl?: string;
  isPartnerEvent?: boolean;
};

const dateKey = (d: Date) =>
  `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();
const sameMonth = (a: Date, b: Date) =>
  a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();

const decodeHtml = (html: string) => {
  if (!html) return "";
  return html.replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'");
};

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
          height: 280,
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
        height: 280,
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

const MILEAGE_OPTIONS = [
  { value: 50, label: "50 miles" },
  { value: 100, label: "100 miles (Default)" },
  { value: 150, label: "150 miles" },
  { value: 250, label: "250 miles" },
  { value: 500, label: "500 miles" },
  { value: 9999, label: "Everywhere (All)" },
];

export default function TestEventDesktopList({ 
  initialEvents, 
  profileId: propProfileId 
}: { 
  initialEvents?: EventItem[]; 
  profileId?: string | number | null; 
}) {
  const router = useRouter();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<EventItem[]>(initialEvents || []);
  const [sortedEvents, setSortedEvents] = useState<EventItem[]>(initialEvents || []);
  const [processedEvents, setProcessedEvents] = useState<
    Record<string, EventItem[]>
  >({});
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [profileId, setProfileId] = useState<string | number | undefined>(propProfileId || undefined);
  const [viewType, setViewType] = useState<"list" | "calendar">("list");
  const [loading, setLoading] = useState(!initialEvents);
  const [isLocationLoading, setIsLocationLoading] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      const saved = sessionStorage.getItem("events_search_state") || sessionStorage.getItem("mobile_events_search_state");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.selectedState || parsed.cityInput) return false;
      }
    } catch (e) {}
    return true;
  });
  const [tabValue, setTabValue] = useState<"upcoming" | "past">("upcoming");
  const [searchText, setSearchText] = useState("");
  const [showAllEvents, setShowAllEvents] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "platform" | "partner">("all");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // Client Requirement: Mileage Range filter (Defaults to 0 - 100 miles dual-slider)
  const [mileageRange, setMileageRange] = useState<number[]>(() => {
    if (typeof window === "undefined") return [0, 100];
    try {
      const saved = sessionStorage.getItem("events_search_state") || sessionStorage.getItem("mobile_events_search_state");
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
      const saved = sessionStorage.getItem("events_search_state") || sessionStorage.getItem("mobile_events_search_state");
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
      const saved = sessionStorage.getItem("events_search_state") || sessionStorage.getItem("mobile_events_search_state");
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

  const [displayCount, setDisplayCount] = useState(12);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stateToSave = {
        selectedState,
        cityInput,
        searchText,
        filterType,
        tabValue,
        showAllEvents,
        mileageRange,
      };
      sessionStorage.setItem("events_search_state", JSON.stringify(stateToSave));
      sessionStorage.setItem("mobile_events_search_state", JSON.stringify(stateToSave));
    } catch (e) {
      console.error("Failed to save events search state:", e);
    }
  }, [selectedState, cityInput, searchText, filterType, tabValue, showAllEvents, mileageRange]);

  useEffect(() => {
    setDisplayCount(12);
  }, [tabValue, searchText, selectedState, filterType, showAllEvents, mileageRange]);

  const filterEventsByState = (list: EventItem[], state: any | null) => {
    // When coordinates are successfully resolved for the active location filter (search box or profile location),
    // distance-based radius filtering handles location matching accurately across nearby cities.
    if (activeCoords) return list;

    const locRaw = (state?.StateFull || state?.State || cityInput || "").trim().toLowerCase();
    if (!locRaw) return list;

    const cleanLoc = locRaw.replace(/\s*\([a-z]{2}\)\s*$/i, "").trim();

    return list.filter((e) => {
      const venue = (e.Venue || (e as any).location || "").toLowerCase();
      const name = (e.Name || (e as any).original_title || "").toLowerCase();
      const searchTxt = ((e as any).SearchText || "").toLowerCase();
      const fullTxt = `${name} ${venue} ${searchTxt}`;

      if (cleanLoc.includes(",")) {
        const cityPart = cleanLoc.split(",")[0].trim();
        if (cityPart !== "") {
          return fullTxt.includes(cityPart);
        }
      }

      const stateFull = (state?.StateFull || "").toLowerCase();
      const stateCode = (state?.State || "").toLowerCase();
      if (stateFull && !stateFull.includes(",")) {
        const matchStateName = fullTxt.includes(stateFull);
        const matchStateCode = stateCode !== "" && (venue.includes(`, ${stateCode}`) || venue.endsWith(` ${stateCode}`));
        return matchStateName || matchStateCode;
      }

      return fullTxt.includes(cleanLoc);
    });
  };

  useEffect(() => {
    if (!openCity) {
      setCityOption([]);
      return;
    }
    if (cityInput === "") return;

    const fetchData = async () => {
      setCityLoading(true);
      try {
        const response = await fetch(`/api/usStates?state=${cityInput}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const { states } = await response.json();

        const normalizeKey = (item: any) =>
          `${(item?.StateFull || "").replace(/,/g, "").replace(/\s+/g, " ").trim().toLowerCase()}_${(item?.State || "").trim().toLowerCase()}`;

        const uniqueStates = states.filter(
          (state: any, index: number, self: any[]) =>
            index ===
            self.findIndex((t: any) => normalizeKey(t) === normalizeKey(state)),
        );

        setCityOption(uniqueStates);
      } catch (error) {
        console.error("Error fetching states:", error);
      } finally {
        setCityLoading(false);
      }
    };

    fetchData();
  }, [cityInput, openCity]);

  // Client Requirement: Search events pulling from Venue OR Event Name
  useEffect(() => {
    let baseList = showAllEvents
      ? events
      : events.filter(
          (e) => e?.StartTime && sameMonth(new Date(e.StartTime), currentDate),
        );

    baseList = filterEventsByState(baseList, selectedState);

    const searchVal = searchText.toLowerCase().trim();
    if (searchVal) {
      baseList = baseList.filter((e: any) => {
        const nameMatch = (e.Name || "").toLowerCase().includes(searchVal);
        const venueMatch = (e.Venue || "").toLowerCase().includes(searchVal);
        const searchTxtMatch = (e.SearchText || "").toLowerCase().includes(searchVal);
        return nameMatch || venueMatch || searchTxtMatch;
      });
    }

    setSortedEvents(baseList);
  }, [events, currentDate, showAllEvents, selectedState, searchText]);

  useEffect(() => {
    if (propProfileId) {
      setProfileId(propProfileId);
      return;
    }
    const token =
      typeof window !== "undefined" ? localStorage.getItem("loginInfo") : null;
    if (token) {
      try {
        const decoded = jwtDecode<any>(token);
        setProfileId(decoded?.profileId);
      } catch {
        // ignore
      }
    }
  }, [propProfileId]);

  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [activeLocationLabel, setActiveLocationLabel] = useState<string>("");
  const [isTravelModeActive, setIsTravelModeActive] = useState<boolean>(false);

  // Compute Active Location Coordinates (Search Box input takes precedence, otherwise fallback to User Profile / Travel Location)
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

  // Client Requirement: Default filter within 0-100 miles of user's location, sorted chronologically from today onward
  const filteredByType = useMemo(() => {
    const eventsWithDistance = sortedEvents.map((e) => attachDistanceToEvent(e, activeCoords));
    return eventsWithDistance.filter((e) => {
      if (activeCoords && typeof (e as any).distanceMiles === "number") {
        const dist = (e as any).distanceMiles;
        if (dist < mileageRange[0]) return false;
        if (mileageRange[1] < 500 && dist > mileageRange[1]) return false;
      } else if (activeCoords && mileageRange[1] < 500) {
        return false;
      }
      if (filterType === "all") return true;
      if (filterType === "partner") return e?.isPartnerEvent;
      if (filterType === "platform") return !e?.isPartnerEvent;
      return true;
    });
  }, [sortedEvents, filterType, activeCoords, mileageRange]);

  const startOfToday = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const displayUpcoming = useMemo(() => {
    const upcoming = filteredByType.filter((e) => e?.StartTime && new Date(e.StartTime) >= startOfToday);
    return sortEventsByDateAndDistance(upcoming, "upcoming");
  }, [filteredByType, startOfToday]);

  const displayPast = useMemo(() => {
    const past = filteredByType.filter((e) => e?.StartTime && new Date(e.StartTime) < startOfToday);
    return sortEventsByDateAndDistance(past, "past");
  }, [filteredByType, startOfToday]);

  const effectiveLocationText = useMemo(() => {
    if (cityInput.trim()) return cityInput.trim();
    if (selectedState) return selectedState.StateFull || selectedState.State || "";
    return activeLocationLabel;
  }, [cityInput, selectedState, activeLocationLabel]);

  if (loading || isLocationLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "50vh",
          width: "100%",
          py: 10,
        }}
      >
        <Loader />
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", pt: 2, pb: 8 }}>
      {/* Header & Controls Bar (Sticky at top) */}
      <Box
        sx={{
          position: "sticky",
          top: profileId ? "85px" : "20px",
          zIndex: 100,
          mb: 4,
          p: 3,
          borderRadius: 4,
          background: "linear-gradient(135deg, rgba(20, 8, 36, 0.96), rgba(10, 4, 18, 0.98))",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 45, 85, 0.35)",
          boxShadow: "0 12px 35px rgba(0,0,0,0.7)",
          transition: "top 0.2s ease",
        }}
      >
        <Stack direction={{ xs: "column", md: "row" }} spacing={2.5} alignItems="center" justifyContent="between">
          {/* Main Title & Indicator */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: "white" }}>
              National Events Calendar
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", mt: 0.5, display: "flex", alignItems: "center", flexWrap: "wrap", gap: 0.5 }}>
              <span>Showing events within <strong style={{ color: "#ff2d55" }}>{mileageRange[0]} - {mileageRange[1] >= 500 ? "500+ miles" : `${mileageRange[1]} miles`}</strong></span>
              {effectiveLocationText && (
                <Chip
                  icon={<MapPin size={13} color="#fff" />}
                  label={`${!cityInput.trim() && !selectedState && isTravelModeActive ? "✈️ Travel Mode: " : "📍 "}${effectiveLocationText}`}
                  size="small"
                  sx={{
                    bgcolor: !cityInput.trim() && !selectedState && isTravelModeActive ? "rgba(156, 39, 176, 0.25)" : "rgba(255, 45, 85, 0.25)",
                    color: "#fff",
                    fontWeight: 700,
                    border: !cityInput.trim() && !selectedState && isTravelModeActive ? "1px solid rgba(156, 39, 176, 0.5)" : "1px solid rgba(255, 45, 85, 0.5)",
                    fontSize: "0.75rem",
                    height: 24,
                  }}
                />
              )}
              <span>sorted chronologically from today forward.</span>
            </Typography>
          </Box>

          {/* Filter Bar: City/State Search, Dual Range Slider, & Event/Venue Keyword Search */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems="center">
            {/* City & State Search Input */}
            <Autocomplete
              id="test-city-autocomplete"
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
              size="small"
              sx={{ width: { xs: "100%", sm: 200 } }}
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
                  placeholder="City & State"
                  size="small"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: <MapPin size={16} color="#ff2d55" style={{ marginRight: 6 }} />,
                  }}
                  sx={{
                    bgcolor: "rgba(0, 0, 0, 0.4)",
                    borderRadius: "10px",
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.15)" },
                    "& input": { color: "#ffffff", fontSize: "0.85rem" },
                  }}
                />
              )}
            />

            {/* Client Requirement: Dual Range Mileage Slider (Default 0 - 100 miles) */}
            <Box sx={{ minWidth: 260, px: 1 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)", fontWeight: 700 }}>
                  Distance: <span style={{ color: "#FF2D55" }}>{mileageRange[0]} - {mileageRange[1] >= 500 ? "500+ mi" : `${mileageRange[1]} mi`}</span>
                </Typography>
                <Chip label="Default 0-100 mi" size="small" onClick={() => setMileageRange([0, 100])} sx={{ height: 18, fontSize: "0.65rem", bgcolor: "rgba(255,45,85,0.2)", color: "#ff2d55", fontWeight: 700, cursor: "pointer" }} />
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
                  py: 1,
                  "& .MuiSlider-track": { height: 6, borderRadius: 99, background: "linear-gradient(90deg, #FF2D55, #7000FF)" },
                  "& .MuiSlider-rail": { height: 6, opacity: 0.2, borderRadius: 99, bgcolor: "#ffffff" },
                  "& .MuiSlider-thumb": {
                    width: 18,
                    height: 18,
                    bgcolor: "#ffffff",
                    border: "2px solid #FF2D55",
                    boxShadow: "0 4px 12px rgba(255,45,85,0.5)",
                    "&:hover": { boxShadow: "0 4px 16px rgba(255,45,85,0.8)" },
                  },
                  "& .MuiSlider-markLabel": { color: "rgba(255,255,255,0.6)", fontSize: 10, fontWeight: 600 },
                  "& .MuiSlider-valueLabel": {
                    background: "linear-gradient(90deg, #FF2D55, #7000FF)",
                    borderRadius: "6px",
                    fontSize: 11,
                    fontWeight: 700,
                  },
                }}
              />
            </Box>

            {/* Client Requirement: Search Box pulling from Event Title OR Venue */}
            <TextField
              size="small"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search event or venue..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: "#ff2d55", fontSize: 18 }} />
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
                width: { xs: "100%", sm: 220 },
                bgcolor: "rgba(0, 0, 0, 0.4)",
                borderRadius: "10px",
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.15)" },
                "& input": { color: "#ffffff", fontSize: "0.85rem" },
              }}
            />
          </Stack>
        </Stack>
      </Box>

      {/* Events Grid Display */}
      {displayUpcoming.length === 0 ? (
        <Box
          sx={{
            textAlign: "center",
            py: 8,
            px: 3,
            bgcolor: "rgba(20, 8, 36, 0.6)",
            borderRadius: 4,
            border: "1px solid rgba(255, 45, 85, 0.2)",
          }}
        >
          <Typography variant="h6" sx={{ color: "white", fontWeight: 700 }}>
            No events found within {mileageRange[0]} - {mileageRange[1] >= 500 ? "500+ miles" : `${mileageRange[1]} miles`}
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)", mt: 1, mb: 3 }}>
            Try increasing your distance range filter or clear your search keyword.
          </Typography>
          <Button
            variant="contained"
            onClick={() => {
              const target = mileageRange[1] < 250 ? 250 : 500;
              setMileageRange([mileageRange[0], target]);
              setSearchText("");
            }}
            sx={{
              background: "linear-gradient(45deg, #FF2D55, #7000FF)",
              fontWeight: 700,
              borderRadius: "10px",
            }}
          >
            Expand Range to {mileageRange[1] < 250 ? "250 miles" : "500+ miles"}
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {displayUpcoming.slice(0, displayCount).map((ev: any, index: number) => (
            <Grid item xs={12} sm={6} md={4} key={ev?.Id}>
              <Paper
                elevation={8}
                component={Link}
                href={ev?.isPartnerEvent ? '/partner-events/' + (ev.Slug || String(ev.Id).replace('partner_', '')) : "/events/detail/" + ev?.Id}
                sx={{
                  p: 0,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  background: "rgba(20, 10, 35, 0.95)",
                  backdropFilter: "blur(20px)",
                  overflow: "hidden",
                  border: "2px solid rgba(245, 0, 87, 0.6)",
                  borderRadius: "12px",
                  cursor: "pointer",
                  transition: "all 0.3s ease-in-out",
                  textDecoration: "none",
                  "&:hover": {
                    transform: "translateY(-8px)",
                    borderColor: "rgba(245, 0, 87, 0.9)",
                    boxShadow: "0 12px 30px rgba(245, 0, 87, 0.3)",
                  },
                }}
              >
                <Box sx={{ position: "relative", height: "100%", display: "flex", flexDirection: "column" }}>
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

                  {/* Card Body & Details */}
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
                        minHeight: "1em",
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
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 2,
                        }}
                      >
                        <MapPin size={16} color="#f50057" />
                        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)" }}>
                          {cleanVenueText(ev.Venue) || "Location"}
                          {typeof ev.distanceMiles === "number" ? ` • ${formatDistanceText(ev.distanceMiles)}` : ""}
                        </Typography>
                      </Box>
                    )}

                    <Button
                      variant="contained"
                      size="small"
                      sx={{
                        bgcolor: "#FFFFFF",
                        color: "#d81b60",
                        fontWeight: "bold",
                        mt: "auto",
                        alignSelf: "flex-end",
                        borderRadius: "8px",
                        border: "2px solid transparent",
                        textTransform: "none",
                        fontSize: "0.95rem",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                        transition: "all 0.3s ease-in-out",
                        "&:hover": {
                          transform: "translateY(-2px)",
                          bgcolor: "#FFFFFF",
                        },
                      }}
                    >
                      View Details
                    </Button>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {displayUpcoming.length > displayCount && (
        <Box sx={{ textAlign: "center", mt: 4 }}>
          <Button
            onClick={() => setDisplayCount((c) => c + 12)}
            variant="outlined"
            sx={{
              borderColor: "#ff2d55",
              color: "#ff2d55",
              fontWeight: 700,
              borderRadius: "10px",
              px: 4,
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
            mt: 5,
            mb: 3,
            p: 4,
            borderRadius: "20px",
            background: "linear-gradient(135deg, rgba(20, 10, 35, 0.95) 0%, rgba(40, 15, 60, 0.95) 100%)",
            border: "1.5px dashed rgba(255, 45, 85, 0.6)",
            textAlign: "center",
            boxShadow: "none",
          }}
        >
          <Stack spacing={2} alignItems="center">
            <Box
              sx={{
                width: 54,
                height: 54,
                borderRadius: "50%",
                bgcolor: "rgba(255, 45, 85, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FF2D55",
              }}
            >
              <MapPin size={28} color="#FF2D55" />
            </Box>

            <Typography variant="h6" sx={{ fontWeight: 800, color: "white", fontSize: "1.2rem" }}>
              Reached end of events within {mileageRange[0]} - {mileageRange[1]} miles!
            </Typography>

            <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.7)", maxWidth: "500px", fontSize: "0.95rem" }}>
              Want to see more lifestyle events across the country? Expand your distance range to {mileageRange[1] < 250 ? "250 miles" : "500+ miles"}.
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
                borderRadius: "14px",
                px: 4,
                py: 1.4,
                fontSize: "0.95rem",
                textTransform: "none",
                boxShadow: "none",
                transition: "transform 0.2s ease-in-out",
                "&:hover": { transform: "scale(1.04)", boxShadow: "none" },
              }}
            >
              Adjust Filter & Expand Miles
            </Button>
          </Stack>
        </Paper>
      )}

      {/* Popup Filter Drawer */}
      <Drawer
        anchor="right"
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        disableScrollLock={true}
        PaperProps={{
          sx: {
            width: { xs: "100%", sm: 420 },
            bgcolor: "#140824",
            color: "white",
            p: 3,
            borderLeft: "2px solid rgba(255, 45, 85, 0.5)",
            boxShadow: "-10px 0 40px rgba(0, 0, 0, 0.8)",
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
              id="test-desktop-drawer-location-autocomplete"
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
                "& .MuiSlider-track": { height: 6, borderRadius: 99, background: "linear-gradient(90deg, #FF2D55, #7000FF)" },
                "& .MuiSlider-rail": { height: 6, opacity: 0.2, borderRadius: 99, bgcolor: "#ffffff" },
                "& .MuiSlider-thumb": {
                  width: 24,
                  height: 24,
                  bgcolor: "#ffffff",
                  border: "3px solid #FF2D55",
                  boxShadow: "0 4px 12px rgba(255,45,85,0.5)",
                },
                "& .MuiSlider-markLabel": { color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: 600 },
              }}
            />
          </Box>

          <Button
            variant="contained"
            fullWidth
            onClick={() => setFilterDrawerOpen(false)}
            sx={{
              mt: 2,
              py: 1.3,
              background: "linear-gradient(90deg, #FF2D55, #7000FF)",
              fontWeight: 800,
              borderRadius: "14px",
              fontSize: "0.95rem",
              textTransform: "none",
            }}
          >
            Apply Filters
          </Button>
        </Stack>
      </Drawer>
    </Box>
  );
}
