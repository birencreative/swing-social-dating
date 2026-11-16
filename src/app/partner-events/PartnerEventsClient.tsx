"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { PartnerEvent } from "../../../types/event";
import {
    Box,
    Container,
    Typography,
    Grid,
    Paper,
    Stack,
    Button,
    Chip,
    alpha,
    Pagination,
    useMediaQuery,
    TextField,
    InputAdornment,
    Autocomplete,
    IconButton,
} from "@mui/material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PersonIcon from "@mui/icons-material/Person";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import { Search, Clear as ClearIcon } from "@mui/icons-material";
import FilterListIcon from "@mui/icons-material/FilterList";
import CircularProgress from "@mui/material/CircularProgress";
import { MapPin } from "lucide-react";
import { jwtDecode } from "jwt-decode";

import AppHeaderMobile from "@/layout/AppHeaderMobile";
import AppHeaderDesktop from "@/layout/AppHeaderDesktop";
import AppFooterMobile from "@/layout/AppFooterMobile";
import AppFooterDesktop from "@/layout/AppFooterDesktop";
import { formatDateEST } from "@/utils/formatDateEST";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isValidEventFlyer } from "@/utils/eventImageUtils";
import { getOptimizedImageUrl } from "@/utils/profileUtils";

const EVENTS_PER_PAGE = 300;

// ─── Normalised shape shared by both sources ───────────────────────────────
interface UnifiedEvent {
    uid: string;
    title: string;
    description?: string;
    eventType?: string;
    image?: string;
    detailUrl: string;
    dateDisplay: string;   // human-readable date string shown in the card
    timeDisplay?: string;  // human-readable time string
    venueName?: string;
    venueLocation?: string;
    hostName?: string;
    isInternal: boolean;   // true = from /api/user/events, false = partner
    sortDate: number;      // ms timestamp for chronological sorting
}

// Internal EventItem from the platform API
interface EventItem {
    Id: string | number;
    Name: string;
    Category?: string;
    StartTime: string;
    Venue?: string;
    Description?: string;
    CoverImageUrl?: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Strip HTML tags, decode entities, and collapse whitespace */
function stripHtml(raw?: string | null): string | undefined {
    if (!raw) return undefined;
    return raw
        // Remove HTML comments (e.g. <!--StartFragment-->)
        .replace(/<!--[\s\S]*?-->/g, "")
        // Remove all HTML tags
        .replace(/<[^>]+>/g, " ")
        // Decode common HTML entities
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&nbsp;/gi, " ")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        // Collapse extra whitespace
        .replace(/\s+/g, " ")
        .trim() || undefined;
}

/** Parse partner-event date strings like "Thursday Apr 17" into a timestamp */
function parsePartnerDate(dateStr: string): number {
    const match = dateStr.match(/[A-Za-z]+\s+([A-Za-z]+)\s+(\d+)/);
    if (!match) return 0;
    const [, monthStr, dayStr] = match;
    const year = new Date().getFullYear();
    const parsed = new Date(`${monthStr} ${dayStr}, ${year}`);
    if (isNaN(parsed.getTime())) return 0;
    // Roll to next year if already past
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    if (parsed.getTime() < todayStart.getTime() - 24 * 60 * 60 * 1000) {
        parsed.setFullYear(year + 1);
    }
    return parsed.getTime();
}

function normalisePartnerEvent(e: PartnerEvent): UnifiedEvent {
    const rawImg = e.what?.image;
    const validImg = isValidEventFlyer(rawImg) ? getOptimizedImageUrl(rawImg, 600) : undefined;
    return {
        uid: `partner-${e.id}`,
        title: e.what.title,
        description: stripHtml(e.what.description),
        eventType: e.what.type,
        image: validImg,
        detailUrl: `/partner-events/${e.slug_name || e.id}`,
        dateDisplay: e.when.date,
        timeDisplay: e.when.time,
        venueName: e.where.name,
        venueLocation: e.where.location,
        hostName: e.who.name,
        isInternal: false,
        sortDate: parsePartnerDate(e.when.date),
    };
}

function normaliseInternalEvent(e: EventItem): UnifiedEvent {
    const d = new Date(e.StartTime);
    const rawImg = e.CoverImageUrl;
    const validImg = isValidEventFlyer(rawImg) ? getOptimizedImageUrl(rawImg, 600) : undefined;
    return {
        uid: `internal-${e.Id}`,
        title: e.Name,
        description: stripHtml(e.Description),
        eventType: e.Category,
        image: validImg,
        detailUrl: `/events/detail/${e.Id}`,
        dateDisplay: formatDateEST(e.StartTime),
        venueName: e.Venue,
        isInternal: true,
        hostName: undefined,
        sortDate: isNaN(d.getTime()) ? 0 : d.getTime(),
    };
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function PartnerEventsClient({ initialEvents }: { initialEvents: PartnerEvent[] }) {
    const isMobile = useMediaQuery("(max-width: 900px)");
    const router = useRouter();
    const [currentPage, setCurrentPage] = useState(1);
    const [searchText, setSearchText] = useState("");
    const [selectedType, setSelectedType] = useState<string>("All");
    const [loginProfileId, setLoginProfileId] = useState<any>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Internal events fetched client-side
    const [internalEvents, setInternalEvents] = useState<UnifiedEvent[]>([]);

    // State / location autocomplete filter
    const [cityInput, setCityInput] = useState("");
    const [openCity, setOpenCity] = useState(false);
    const [cityLoading, setCityLoading] = useState(false);
    const [cityOption, setCityOption] = useState<any[]>([]);
    const [selectedState, setSelectedState] = useState<any | null>(null);

    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            const saved = sessionStorage.getItem("partner_events_search_state");
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.selectedState) {
                    setSelectedState(parsed.selectedState);
                    setCityInput(
                        parsed.selectedState.StateFull && parsed.selectedState.State
                            ? `${parsed.selectedState.StateFull} (${parsed.selectedState.State})`
                            : parsed.selectedState.StateFull || parsed.selectedState.State || ""
                    );
                }
                if (typeof parsed.searchText === "string") setSearchText(parsed.searchText);
                if (parsed.selectedType) setSelectedType(parsed.selectedType);
            }
        } catch (e) {
            console.error("Failed to restore partner events search state:", e);
        }
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            if (selectedState || searchText || selectedType !== "All") {
                const stateToSave = {
                    selectedState,
                    searchText,
                    selectedType,
                };
                sessionStorage.setItem("partner_events_search_state", JSON.stringify(stateToSave));
            } else {
                sessionStorage.removeItem("partner_events_search_state");
            }
        } catch (e) {
            console.error("Failed to save partner events search state:", e);
        }
    }, [selectedState, searchText, selectedType]);

    // ── Fetch upcoming internal events on mount ──────────────────────────
    useEffect(() => {
        const token = typeof window !== "undefined" ? localStorage.getItem("loginInfo") : null;
        const storedProfileId = typeof window !== "undefined" ? localStorage.getItem("logged_in_profile") : null;
        if (token) {
            setLoginProfileId(storedProfileId);
            try {
                const decoded = jwtDecode<any>(token);
                const profileId = decoded?.profileId || storedProfileId;
                if (profileId) {
                    const now = new Date();
                    fetch(`/api/user/events?id=${profileId}`)
                        .then((r) => r.json())
                        .then((data) => {
                            const list: EventItem[] = data?.events || [];
                            const upcoming = list
                                .filter((e) => e?.StartTime && new Date(e.StartTime) >= now)
                                .map(normaliseInternalEvent);
                            setInternalEvents(upcoming);
                        })
                        .catch((err) => console.error("Failed to fetch internal events:", err));
                }
            } catch (err) {
                console.error("Failed to decode token:", err);
            }
        } else {
            setLoginProfileId(null);
        }
        setIsLoaded(true);
    }, []);

    // ── Fetch autocomplete options for state filter ──────────────────────
    const handleCityOpen = () => setOpenCity(true);

    const handleCityInputChange = async (value: string) => {
        setCityInput(value);
        if (!value) return;
        setCityLoading(true);
        try {
            const response = await fetch(`/api/usStates?state=${value}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const { states } = await response.json();
            const uniqueStates = states.filter(
                (s: any, i: number, arr: any[]) =>
                    i === arr.findIndex((t: any) => t.StateFull === s.StateFull)
            );
            setCityOption(uniqueStates);
        } catch (err) {
            console.error("Error fetching states:", err);
        } finally {
            setCityLoading(false);
        }
    };

    // ── Normalise partner events (deduplicate by title within partner source only) ──
    const allPartnerEvents = useMemo(() => {
        const seenTitles = new Set<string>();
        return initialEvents
            .map(normalisePartnerEvent)
            .filter((e) => {
                const key = e.title.toLowerCase().trim();
                if (seenTitles.has(key)) return false;
                seenTitles.add(key);
                return true;
            });
    }, [initialEvents]);

    // ── Unified merged list — internal events first, then partner events ──
    const mergedEvents = useMemo(() => {
        // Internal events are never deduplicated against partner events
        // Sort each group chronologically (0 sortDate → pushed to end)
        const sortAsc = (a: UnifiedEvent, b: UnifiedEvent) => {
            if (a.sortDate === 0 && b.sortDate === 0) return 0;
            if (a.sortDate === 0) return 1;
            if (b.sortDate === 0) return -1;
            return a.sortDate - b.sortDate;
        };

        const sortedInternal = [...internalEvents].sort(sortAsc);
        const sortedPartner = [...allPartnerEvents].sort(sortAsc);

        // Show upcoming platform events first, then all partner events
        return [...sortedInternal, ...sortedPartner];
    }, [allPartnerEvents, internalEvents]);

    // ── Unique event types for filter chips ─────────────────────────────
    const eventTypes = useMemo(() => {
        const types = new Set<string>();
        mergedEvents.forEach((e) => { if (e.eventType) types.add(e.eventType); });
        return ["All", "Platform Events", "Partner Events", ...Array.from(types)];
    }, [mergedEvents]);

    // ── Filtered list ────────────────────────────────────────────────────
    const filteredEvents = useMemo(() => {
        let list = [...mergedEvents];

        // Source filter
        if (selectedType === "Platform Events") {
            list = list.filter((e) => e.isInternal);
        } else if (selectedType === "Partner Events") {
            list = list.filter((e) => !e.isInternal);
        } else if (selectedType !== "All") {
            list = list.filter((e) => e.eventType === selectedType);
        }

        // State filter
        if (selectedState) {
            const full = selectedState.StateFull?.toLowerCase() || "";
            const abbr = selectedState.State?.toLowerCase() || "";
            list = list.filter((e) => {
                const loc = (e.venueLocation || e.venueName || "").toLowerCase();
                return (
                    (full && loc.includes(full)) ||
                    (abbr && loc.includes(`, ${abbr}`)) ||
                    (abbr && loc.endsWith(` ${abbr}`))
                );
            });
        }

        // Search filter
        if (searchText.trim()) {
            const v = searchText.toLowerCase().trim();
            list = list.filter(
                (e) =>
                    e.title?.toLowerCase().includes(v) ||
                    e.venueLocation?.toLowerCase().includes(v) ||
                    e.venueName?.toLowerCase().includes(v) ||
                    e.description?.toLowerCase().includes(v) ||
                    e.hostName?.toLowerCase().includes(v)
            );
        }

        return list;
    }, [mergedEvents, selectedState, selectedType, searchText]);

    const totalPages = Math.ceil(filteredEvents.length / EVENTS_PER_PAGE);
    const paginatedEvents = filteredEvents.slice(
        (currentPage - 1) * EVENTS_PER_PAGE,
        currentPage * EVENTS_PER_PAGE
    );

    const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
        setCurrentPage(value);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const reset = () => {
        setSearchText("");
        setSelectedType("All");
        setSelectedState(null);
        setCityInput("");
        setCurrentPage(1);
    };

    // ───────────────────────────────────────────────────────────────────────
    return (
        <Box
            sx={{
                background: "linear-gradient(160deg, #14071f 0%, #0a0412 100%)",
                color: "white",
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
            }}
        >
            {loginProfileId && (isMobile ? <AppHeaderMobile /> : <AppHeaderDesktop />)}

            <Container
                maxWidth="xl"
                sx={{
                    flexGrow: 1,
                    px: { xs: 2, sm: 2, md: 3 },
                    py: { xs: 4, md: loginProfileId ? 14 : 4 },
                    pb: { xs: 12 },
                }}
            >
                {!loginProfileId && isLoaded && (
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: { xs: "column", sm: "row" },
                            alignItems: "center",
                            justifyContent: "center",
                            gap: { xs: 1, sm: 3 },
                            mb: 4,
                            p: { xs: 2, sm: 2 },
                            borderRadius: 4,
                            background: "linear-gradient(90deg, rgba(255, 45, 85, 0.1), rgba(112, 0, 255, 0.1))",
                            backdropFilter: "blur(10px)",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            textAlign: "center",
                        }}
                    >
                        <Typography
                            variant="h6"
                            sx={{
                                fontWeight: 600,
                                fontSize: { xs: "16px", sm: "16px" },
                                background: "linear-gradient(45deg, #FF2D55, #7000FF)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                            }}
                        >
                            To view full event details you must have a swing social profile
                        </Typography>
                        <Stack
                            direction="row"
                            spacing={2}
                            justifyContent="center"
                        >
                            <Button
                                variant="contained"
                                onClick={() => router.push("/register")}
                                sx={{
                                    background: "linear-gradient(45deg, #FF2D55, #7000FF)",
                                    color: "white",
                                    fontWeight: 700,
                                    textTransform: "none",
                                    borderRadius: "10px",
                                    px: { xs: 3, sm: 3 },
                                    py: 0.25,
                                    fontSize: "0.85rem",
                                    "&:hover": {
                                        opacity: 0.9,
                                        transform: "scale(1.02)",
                                    },
                                    transition: "all 0.2s ease",
                                }}
                            >
                                Signup
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={() => router.push("/login")}
                                sx={{
                                    borderColor: "#FF2D55",
                                    color: "#FF2D55",
                                    fontWeight: 700,
                                    textTransform: "none",
                                    borderRadius: "10px",
                                    px: { xs: 3, sm: 3 },
                                    py: 0.25,
                                    fontSize: "0.85rem",
                                    borderWidth: "2px",
                                    "&:hover": {
                                        borderColor: "#7000FF",
                                        color: "#7000FF",
                                        borderWidth: "2px",
                                        background: "rgba(112, 0, 255, 0.05)",
                                    },
                                    transition: "all 0.2s ease",
                                }}
                            >
                                Login
                            </Button>
                        </Stack>
                    </Box>
                )}
                {/* ── Page Title ── */}
                <Box sx={{ color: "white", mt: 2, mb: 3 }}>
                    <Typography
                        variant="h5"
                        sx={{
                            fontWeight: 800,
                            letterSpacing: "0.05em",
                            textTransform: "uppercase",
                            background: "linear-gradient(45deg, #fff 30%, #f50057 90%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            position: "relative",
                            animation: "glow 2s ease-in-out infinite",
                            "@keyframes glow": {
                                "0%": { textShadow: "0 0 10px rgba(245, 0, 87, 0.5)" },
                                "50%": {
                                    textShadow:
                                        "0 0 20px rgba(245, 0, 87, 0.8), 0 0 30px rgba(245, 0, 87, 0.4)",
                                },
                                "100%": { textShadow: "0 0 10px rgba(245, 0, 87, 0.5)" },
                            },
                            "&::after": {
                                content: '""',
                                position: "absolute",
                                bottom: -8,
                                left: 0,
                                width: "50px",
                                height: "3px",
                                background: "#f50057",
                                transition: "width 0.3s ease",
                            },
                            "&:hover::after": { width: "100px" },
                        }}
                    >
                        Events
                    </Typography>
                    <Typography variant="body1" sx={{ color: alpha("#fff", 0.6), mt: 2 }}>
                        Upcoming platform events and partner swing social festivals — all in one place.
                    </Typography>
                </Box>

                {/* ── Filters Row ── */}
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: { xs: "column", md: "row" },
                        gap: 2,
                        alignItems: { xs: "stretch", md: "center" },
                        mb: 3,
                        flexWrap: "wrap",
                    }}
                >
                    {/* State autocomplete */}
                    <Autocomplete
                        id="partner-location-autocomplete"
                        open={openCity}
                        onOpen={handleCityOpen}
                        onClose={() => setOpenCity(false)}
                        isOptionEqualToValue={(option, value) =>
                            option.StateFull === value.StateFull
                        }
                        getOptionLabel={(option) =>
                            option.StateFull && option.State
                                ? `${option.StateFull} (${option.State})`
                                : option.StateFull || ""
                        }
                        options={cityOption}
                        loading={cityLoading}
                        inputValue={cityInput}
                        size="small"
                        sx={{ width: { xs: "100%", sm: 220, md: 230 } }}
                        noOptionsText="No states found"
                        onInputChange={(e, v) => {
                            if (e?.type === "change" || e?.type === "click") {
                                setCityInput(v);
                                handleCityInputChange(v);
                            }
                        }}
                        onChange={(_, v) => {
                            setSelectedState(v || null);
                            if (!v) setCityInput("");
                            setCurrentPage(1);
                        }}
                        componentsProps={{
                            paper: {
                                sx: {
                                    bgcolor: "#ffffff",
                                    color: "#000000",
                                    borderRadius: 2,
                                    border: "1px solid #f50057",
                                    boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
                                },
                            },
                        }}
                        ListboxProps={{
                            sx: {
                                maxHeight: 260,
                                paddingY: 0.5,
                                backgroundColor: "#ffffff",
                                color: "#000000",
                                "& .MuiAutocomplete-option": {
                                    fontSize: 14,
                                    paddingY: 0.75,
                                    color: "#000000",
                                    "&:hover": { backgroundColor: "rgba(0,0,0,0.08)" },
                                    '&[aria-selected="true"]': {
                                        backgroundColor: "rgba(245,0,87,0.18)",
                                        color: "#000",
                                    },
                                },
                            },
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                placeholder="Filter by state"
                                size="small"
                                InputProps={{
                                    ...params.InputProps,
                                    startAdornment: <MapPin size={20} color="#f50057" />,
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
                                                        setCurrentPage(1);
                                                        if (typeof window !== "undefined") {
                                                            sessionStorage.removeItem("partner_events_search_state");
                                                        }
                                                    }}
                                                    sx={{
                                                        color: "rgba(255, 255, 255, 0.7)",
                                                        p: "2px",
                                                        mr: 0.5,
                                                        "&:hover": { color: "#ffffff", bgcolor: "rgba(255, 255, 255, 0.15)" },
                                                    }}
                                                >
                                                    <ClearIcon sx={{ fontSize: "1.1rem" }} />
                                                </IconButton>
                                            )}
                                            {params.InputProps.endAdornment}
                                        </>
                                    ),
                                    sx: {
                                        color: "white",
                                        "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.23)" },
                                        "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.4)" },
                                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#f50057" },
                                        "& .MuiInputBase-input::placeholder": { color: "rgba(255,255,255,0.55)", opacity: 1 },
                                        "& .MuiAutocomplete-clearIndicator": {
                                            color: "rgba(255, 255, 255, 0.7)",
                                            "&:hover": { color: "#ffffff" },
                                        },
                                        "& .MuiAutocomplete-popupIndicator": {
                                            color: "rgba(255, 255, 255, 0.7)",
                                            "&:hover": { color: "#ffffff" },
                                        },
                                    },
                                }}
                            />
                        )}
                    />

                    {/* Search */}
                    <TextField
                        placeholder="Search events..."
                        variant="outlined"
                        size="small"
                        value={searchText}
                        onChange={(e) => { setSearchText(e.target.value); setCurrentPage(1); }}
                        sx={{
                            width: { xs: "100%", sm: 220, md: 230 },
                            input: { color: "white" },
                            "& .MuiOutlinedInput-root": {
                                "& fieldset": { borderColor: "rgba(255,255,255,0.23)" },
                                "&:hover fieldset": { borderColor: "rgba(255,255,255,0.45)" },
                                "&.Mui-focused fieldset": { borderColor: "#f50057" },
                            },
                            "& .MuiInputBase-input::placeholder": { color: "rgba(255,255,255,0.55)", opacity: 1 },
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search sx={{ color: "#f50057" }} />
                                </InputAdornment>
                            ),
                        }}
                    />

                    {/* Results count */}
                    {/* <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 1 }}>
                        <FilterListIcon sx={{ color: alpha("#fff", 0.5), fontSize: 18 }} />
                        <Typography variant="body2" sx={{ color: alpha("#fff", 0.6) }}>
                            {filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""}
                        </Typography>
                    </Box> */}
                </Box>

                {/* ── Type / Source Filter Chips ── */}
                {eventTypes.length > 1 && (
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 4 }}>
                        {eventTypes.map((type) => (
                            <Chip
                                key={type}
                                label={type}
                                onClick={() => { setSelectedType(type); setCurrentPage(1); }}
                                sx={{
                                    bgcolor: selectedType === type ? "#f50057" : alpha("#f50057", 0.1),
                                    color: selectedType === type ? "#fff" : "#f50057",
                                    border: `1px solid ${alpha("#f50057", selectedType === type ? 0.8 : 0.3)}`,
                                    fontWeight: selectedType === type ? "bold" : "normal",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                    "&:hover": {
                                        bgcolor: selectedType === type ? "#c51162" : alpha("#f50057", 0.2),
                                    },
                                }}
                            />
                        ))}
                    </Box>
                )}

                {/* ── Empty State ── */}
                {filteredEvents.length === 0 && (
                    <Paper
                        elevation={24}
                        sx={{
                            p: 6,
                            bgcolor: "#121212",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 2,
                            borderRadius: 3,
                        }}
                    >
                        <Box sx={{ bgcolor: alpha("#f50057", 0.1), p: 2, borderRadius: "50%", mb: 1 }}>
                            <CalendarMonthIcon sx={{ width: 48, height: 48, color: "#f50057" }} />
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: "bold", color: "white", textAlign: "center" }}>
                            No Events Found
                        </Typography>
                        <Typography variant="body1" sx={{ color: alpha("#fff", 0.7), textAlign: "center" }}>
                            {mergedEvents.length === 0
                                ? "No events available. Please check back later."
                                : "No events match your current filters. Try adjusting your search or filters."}
                        </Typography>
                        {mergedEvents.length > 0 && (
                            <Button
                                variant="outlined"
                                onClick={reset}
                                sx={{
                                    borderColor: "#f50057",
                                    color: "#f50057",
                                    "&:hover": { borderColor: "#f50057", bgcolor: alpha("#f50057", 0.1) },
                                }}
                            >
                                Clear Filters
                            </Button>
                        )}
                    </Paper>
                )}

                {/* ── Event Cards ── */}
                {filteredEvents.length > 0 && (
                    <Box>
                        <Grid container spacing={4}>
                            {paginatedEvents.map((event) => (
                                <Grid item xs={12} md={6} lg={4} key={event.uid}>
                                    <Paper
                                        elevation={8}
                                        sx={{
                                            p: 0,
                                            background: "rgba(20, 10, 35, 0.95)",
                                            backdropFilter: "blur(20px)",
                                            overflow: "hidden",
                                            border: "3px solid rgba(255,255,255,0.08)",
                                            borderRadius: "12px",
                                            cursor: "pointer",
                                            transition: "all 0.3s ease-in-out",
                                            display: "flex",
                                            flexDirection: "column",
                                            height: "100%",
                                            "&:hover": {
                                                transform: "translateY(-8px)",
                                                borderColor: "rgba(245, 0, 87, 0.5)",
                                                boxShadow: "0 20px 40px rgba(245, 0, 87, 0.15)",
                                            },
                                        }}
                                    >
                                        {/* Image */}
                                        <Box sx={{ position: "relative" }}>
                                            {event.image ? (
                                                <Box sx={{ height: 220, width: "100%", position: "relative", overflow: "hidden", bgcolor: "#0A0A0A" }}>
                                                    {/* Blurred bg */}
                                                    <Box
                                                        component="img"
                                                        src={event.image}
                                                        alt=""
                                                        sx={{
                                                            position: "absolute",
                                                            top: -20, bottom: -20, left: -20, right: -20,
                                                            width: "calc(100% + 40px)",
                                                            height: "calc(100% + 40px)",
                                                            objectFit: "cover",
                                                            filter: "blur(20px)",
                                                            opacity: 0.5,
                                                            transform: "scale(1.1)",
                                                        }}
                                                    />
                                                    {/* Main image */}
                                                    <Box
                                                        component="img"
                                                        src={event.image}
                                                        alt={event.title}
                                                        sx={{
                                                            position: "relative",
                                                            zIndex: 1,
                                                            width: "100%",
                                                            height: "100%",
                                                            objectFit: "contain",
                                                        }}
                                                    />
                                                </Box>
                                            ) : (
                                                <Box
                                                    sx={{
                                                        height: 200,
                                                        width: "100%",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        bgcolor: alpha("#000", 0.4),
                                                    }}
                                                >
                                                    <ImageOutlinedIcon sx={{ fontSize: 64, color: alpha("#fff", 0.2) }} />
                                                </Box>
                                            )}

                                            {/* Badges */}
                                            <Box sx={{ position: "absolute", top: 12, left: 12, zIndex: 2, display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                                                {/* Source badge */}
                                                <Chip
                                                    label={event.isInternal ? "Platform" : "Partner"}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: event.isInternal
                                                            ? alpha("#2196f3", 0.85)
                                                            : alpha("#000", 0.8),
                                                        color: event.isInternal ? "#fff" : "#f50057",
                                                        fontWeight: "bold",
                                                        border: `1px solid ${event.isInternal ? alpha("#2196f3", 0.5) : alpha("#f50057", 0.4)}`,
                                                        backdropFilter: "blur(10px)",
                                                        fontSize: "0.7rem",
                                                    }}
                                                />
                                                {/* Category badge */}
                                                {event.eventType && (
                                                    <Chip
                                                        label={event.eventType}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: alpha("#000", 0.8),
                                                            color: "#f50057",
                                                            fontWeight: "bold",
                                                            border: `1px solid ${alpha("#f50057", 0.4)}`,
                                                            backdropFilter: "blur(10px)",
                                                        }}
                                                    />
                                                )}
                                            </Box>
                                        </Box>

                                        {/* Content */}
                                        <Box
                                            sx={{
                                                p: 3,
                                                display: "flex",
                                                flexDirection: "column",
                                                flexGrow: 1,
                                            }}
                                        >
                                            {/* Title */}
                                            <Link href={event.detailUrl} style={{ textDecoration: "none" }}>
                                                <Typography
                                                    variant="h6"
                                                    sx={{
                                                        mb: 1.5,
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
                                                        transition: "opacity 0.2s",
                                                        "&:hover": { opacity: 0.85 },
                                                    }}
                                                >
                                                    {event.title}
                                                </Typography>
                                            </Link>

                                            {/* Description */}
                                            {event.description && (
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        color: alpha("#fff", 0.7),
                                                        mb: 2,
                                                        display: "-webkit-box",
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: "vertical",
                                                        overflow: "hidden",
                                                    }}
                                                >
                                                    {event.description}
                                                </Typography>
                                            )}

                                            {/* Meta */}
                                            <Stack spacing={1.5} sx={{ mt: "auto", mb: 3 }}>
                                                {/* Date / time */}
                                                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                                                    <CalendarMonthIcon sx={{ fontSize: 20, color: "#f50057", mt: 0.2 }} />
                                                    <Box>
                                                        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.9)" }}>
                                                            {event.dateDisplay}
                                                        </Typography>
                                                        {event.timeDisplay && (
                                                            <Typography
                                                                variant="body2"
                                                                sx={{
                                                                    color: "rgba(255,255,255,0.7)",
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    gap: 0.5,
                                                                    mt: 0.5,
                                                                }}
                                                            >
                                                                <AccessTimeIcon sx={{ fontSize: 16 }} />
                                                                {event.timeDisplay}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </Box>

                                                {/* Venue */}
                                                {(event.venueName || event.venueLocation) && (
                                                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                                                        <LocationOnIcon sx={{ fontSize: 20, color: "#f50057", mt: 0.2 }} />
                                                        <Box>
                                                            {event.venueName && (
                                                                <Typography
                                                                    variant="body2"
                                                                    sx={{
                                                                        color: "rgba(255,255,255,0.9)",
                                                                        fontWeight: "bold",
                                                                        display: "-webkit-box",
                                                                        WebkitLineClamp: 1,
                                                                        WebkitBoxOrient: "vertical",
                                                                        overflow: "hidden",
                                                                    }}
                                                                >
                                                                    {event.venueName}
                                                                </Typography>
                                                            )}
                                                            {event.venueLocation && (
                                                                <Typography
                                                                    variant="body2"
                                                                    sx={{
                                                                        color: alpha("#fff", 0.7),
                                                                        display: "-webkit-box",
                                                                        WebkitLineClamp: 1,
                                                                        WebkitBoxOrient: "vertical",
                                                                        overflow: "hidden",
                                                                    }}
                                                                >
                                                                    {event.venueLocation}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </Box>
                                                )}

                                                {/* Host (partner events only) */}
                                                {event.hostName && (
                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                                        <PersonIcon sx={{ fontSize: 20, color: "#f50057" }} />
                                                        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.9)" }}>
                                                            {event.hostName}
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </Stack>

                                            {/* CTA */}
                                            <Link href={event.detailUrl} passHref style={{ width: "100%" }}>
                                                <Button
                                                    variant="contained"
                                                    fullWidth
                                                    size="small"
                                                    sx={{
                                                        bgcolor: "#FFFFFF",
                                                        color: "#f50057",
                                                        fontWeight: "bold",
                                                        borderRadius: "8px",
                                                        border: "2px solid transparent",
                                                        textTransform: "none",
                                                        fontSize: "0.95rem",
                                                        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                                                        transition: "all 0.3s ease-in-out",
                                                        "&:hover": { transform: "translateY(-2px)", bgcolor: "#f8f8f8" },
                                                        "&:active": { transform: "translateY(0)" },
                                                    }}
                                                >
                                                    View Details
                                                </Button>
                                            </Link>
                                        </Box>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
                                <Pagination
                                    count={totalPages}
                                    page={currentPage}
                                    onChange={handlePageChange}
                                    color="primary"
                                    sx={{
                                        "& .MuiPaginationItem-root": {
                                            color: "white",
                                            "&:hover": { bgcolor: alpha("#f50057", 0.2) },
                                        },
                                        "& .Mui-selected": { bgcolor: "#f50057 !important", color: "white" },
                                        "& .MuiPaginationItem-icon": { color: "#f50057" },
                                    }}
                                />
                            </Box>
                        )}
                    </Box>
                )}
            </Container>

            {loginProfileId && (isMobile ? <AppFooterMobile /> : <AppFooterDesktop />)}
        </Box>
    );
}
