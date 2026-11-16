"use client";

import { useState, useEffect, useMemo } from "react";
import { PartnerEvent } from "../../../../types/event";
import {
    Box,
    Container,
    Typography,
    Paper,
    Stack,
    Button,
    Chip,
    alpha,
    useMediaQuery,
    Divider,
    Grid,
} from "@mui/material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PersonIcon from "@mui/icons-material/Person";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import ReplyIcon from "@mui/icons-material/Reply";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";

import AppHeaderMobile from "@/layout/AppHeaderMobile";
import AppHeaderDesktop from "@/layout/AppHeaderDesktop";
import AppFooterMobile from "@/layout/AppFooterMobile";
import AppFooterDesktop from "@/layout/AppFooterDesktop";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDateEST } from "@/utils/formatDateEST";
import { parsePartnerEventDate } from "@/utils/distance";
import { getOptimizedImageUrl } from "@/utils/profileUtils";

export default function PartnerEventDetailClient({ event }: { event: PartnerEvent }) {
    const isMobile = useMediaQuery("(max-width: 900px)") ? true : false;
    const router = useRouter();
    const [loginProfileId, setLoginProfileId] = useState<any>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Filter out dummy/logo/icon assets and 1x1 blank pixels from venuePics
    const realVenuePics = useMemo(() => {
        if (!event?.venuePics || !Array.isArray(event.venuePics)) return [];
        return event.venuePics.filter((picUrl: string) => {
            if (!picUrl || typeof picUrl !== "string") return false;
            const lower = picUrl.toLowerCase().trim();
            if (!lower || lower === "") return false;

            if (
                lower.includes("logo") ||
                lower.includes("noavatar") ||
                lower.includes("bannerdefault") ||
                lower.includes("photocamera") ||
                lower.includes("resort_event_sample") ||
                lower.includes("fallback") ||
                lower.includes("removebg-preview") ||
                lower.endsWith(".svg") ||
                lower.includes("cud5lj13shr03vxzpniy") ||
                lower.includes("q4r2hwywto9bowy0sl5g") ||
                lower.includes("mmj2evexatmyny3yz36l")
            ) {
                return false;
            }
            return true;
        });
    }, [event?.venuePics]);

    useEffect(() => {
        const token = localStorage.getItem("loginInfo");
        const profileId = localStorage.getItem("logged_in_profile");
        if (token) {
            setLoginProfileId(profileId);
        } else {
            setLoginProfileId(null);
        }
        setIsLoaded(true);
    }, []);

    if (!event) return null;

    return (
        <Box
            sx={{
                bgcolor: "#1a1025",
                backgroundImage: "linear-gradient(to bottom right, rgba(255,27,107,0.05), rgba(0,210,255,0.05))",
                color: "white",
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
            }}
        >
            {loginProfileId && (isMobile ? <AppHeaderMobile /> : <AppHeaderDesktop />)}

            <Container
                maxWidth="lg"
                sx={{
                    flexGrow: 1,
                    px: { xs: 2, sm: 3, md: 4 },
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
                <Button
                    onClick={() => router.back()}
                    startIcon={<ArrowBackIcon />}
                    sx={{ color: "rgba(255,255,255,0.7)", mb: 4, textTransform: "none", "&:hover": { color: "white" } }}
                >
                    Back to Events
                </Button>

                <Box
                    sx={{
                        bgcolor: "rgba(20,20,20,0.8)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 4,
                        overflow: "hidden",
                    }}
                >
                    {/* Top Image Splash */}
                    {event.what.image ? (
                        <Box
                            sx={{
                                height: { xs: 300, md: 500 },
                                width: "100%",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                bgcolor: "#0A0A0A",
                                position: "relative",
                                overflow: "hidden",
                            }}
                        >
                            <Box
                                sx={{
                                    position: "absolute",
                                    top: -20,
                                    bottom: -20,
                                    left: -20,
                                    right: -20,
                                    filter: "blur(20px)",
                                    opacity: 0.6,
                                    transform: "scale(1.1)",
                                }}
                            >
                                <Box
                                    component="img"
                                    src={getOptimizedImageUrl(event.what.image, 1200)}
                                    alt="background blur"
                                    sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                            </Box>
                            <Box
                                component="img"
                                src={getOptimizedImageUrl(event.what.image, 1200)}
                                alt={event.what.title}
                                sx={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "contain",
                                    zIndex: 1,
                                    maxHeight: { xs: 300, md: 500 },
                                }}
                            />
                        </Box>
                    ) : (
                        <Box
                            sx={{
                                height: { xs: 200, md: 300 },
                                width: "100%",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                                alignItems: "center",
                                background: "linear-gradient(135deg, rgba(255,27,107,0.15) 0%, rgba(112,0,255,0.15) 100%)",
                                borderBottom: "1px solid rgba(255,255,255,0.1)",
                                gap: 2,
                            }}
                        >
                            <CalendarMonthIcon sx={{ fontSize: 64, color: "#FF2D55" }} />
                            <Typography variant="h5" sx={{ fontWeight: 700, color: "white", textAlign: "center", px: 2 }}>
                                {event.what.title}
                            </Typography>
                        </Box>
                    )}

                    {/* Core Header Data */}
                    <Box
                        sx={{
                            p: { xs: 3, md: 6 },
                            borderBottom: "1px solid rgba(255,255,255,0.1)",
                            bgcolor: alpha("#000", 0.4),
                        }}
                    >
                        <Typography
                            variant="h2"
                            sx={{
                                fontWeight: 900,
                                mb: 2,
                                fontSize: { xs: "2rem", md: "3.5rem" },
                                background: "linear-gradient(45deg, #FF1B6B, #FF758C)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                            }}
                        >
                            {event.what.title}
                        </Typography>
                        {event.what.seoDescription && (
                            <Typography
                                variant="h6"
                                sx={{
                                    color: "rgba(255,255,255,0.8)",
                                    lineHeight: 1.8,
                                    mb: 4,
                                    fontWeight: 400,
                                }}
                            >
                                {event.what.seoDescription}
                            </Typography>
                        )}
                        <Box sx={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          <Box>
                            <Typography
                                variant="caption"
                                color="gray"
                                display="block"
                                sx={{ letterSpacing: 1.5, fontWeight: "bold" }}
                            >
                                DATE
                            </Typography>
                            <Typography variant="body1" fontWeight={700}>
                                {event.when?.rawDate && (event.when.rawDate.includes("-") || event.when.rawDate.includes(" to ") || event.when.rawDate.includes("–"))
                                    ? event.when.rawDate
                                    : formatDateEST(parsePartnerEventDate(`${event.when?.date || ""} ${event.when?.time || ""}`))}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography
                                variant="caption"
                                color="gray"
                                display="block"
                                sx={{ letterSpacing: 1.5, fontWeight: "bold" }}
                            >
                                LOCATION
                            </Typography>
                            <Typography
                                variant="body1"
                                fontWeight={700}
                                sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                            >
                               <LocationOnIcon sx={{ fontSize: 16, color: "#FF1B6B" }} />
                               {event.where.name}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography
                                variant="caption"
                                color="gray"
                                display="block"
                                sx={{ letterSpacing: 1.5, fontWeight: "bold" }}
                            >
                                PRODUCER
                            </Typography>
                            <Typography variant="body1" fontWeight={700}>
                                {event.who.name}
                            </Typography>
                          </Box>
                        </Box>
                    </Box>

                    {/* Event Scraping Sub-Data */}
                    <Box sx={{ p: { xs: 3, md: 6 } }}>
                        <Grid container spacing={6}>
                            <Grid item xs={12} md={4}>
                                <Typography
                                    variant="h6"
                                    sx={{
                                        color: "#FF1B6B",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                        mb: 3,
                                        borderBottom: "1px solid rgba(255,27,107,0.3)",
                                        pb: 1,
                                        fontWeight: "bold",
                                    }}
                                >
                                    Deep Extracted Details
                                </Typography>
                                <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                    <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                                        {event.who.hostPic && (
                                            <Box
                                                component="img"
                                                src={event.who.hostPic}
                                                sx={{
                                                    width: 45,
                                                    height: 45,
                                                    borderRadius: "50%",
                                                    border: "1px solid rgba(255,255,255,0.1)",
                                                    objectFit: "cover",
                                                }}
                                                alt="host"
                                            />
                                        )}
                                        <Box>
                                            <Typography variant="caption" color="gray">
                                                Contact Host
                                            </Typography>
                                            <Typography variant="body1" fontWeight={600}>
                                                {event.who.name}
                                            </Typography>
                                            {event.who.contact && (
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        color: "rgba(255,255,255,0.7)",
                                                        mt: 0.5,
                                                        whiteSpace: "pre-line",
                                                    }}
                                                >
                                                    {event.who.contact}
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>

                                    <Box>
                                        <Typography variant="caption" color="gray" display="block" sx={{ mb: 1 }}>
                                            Booking Engine
                                        </Typography>
                                        <Stack spacing={2}>
                                            {event.what.url ? (
                                                <Button
                                                    component="a"
                                                    href={event.what.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    variant="contained"
                                                    startIcon={<ShoppingCartIcon />}
                                                    sx={{
                                                        background: "linear-gradient(45deg, #FF1B6B, #FF758C)",
                                                        color: "white",
                                                        textTransform: "none",
                                                        fontWeight: "bold",
                                                        borderRadius: 2,
                                                        py: 1,
                                                        "&:hover": {
                                                            background: "linear-gradient(45deg, #d81557, #e05d73)",
                                                        },
                                                    }}
                                                >
                                                    Buy Tickets
                                                </Button>
                                            ) : (
                                                <Typography variant="body2" color="gray">
                                                    No booking link provided.
                                                </Typography>
                                            )}

                                            {event.who.profileUrl && (
                                                <Button
                                                    component="a"
                                                    href={event.who.profileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    variant="outlined"
                                                    startIcon={<ReplyIcon sx={{ transform: "scaleX(-1)" }} />}
                                                    sx={{
                                                        color: "white",
                                                        borderColor: "rgba(255, 255, 255, 0.3)",
                                                        textTransform: "none",
                                                        fontWeight: "bold",
                                                        borderRadius: 2,
                                                        py: 1,
                                                        "&:hover": {
                                                            borderColor: "white",
                                                            bgcolor: "rgba(255,255,255,0.05)",
                                                        },
                                                    }}
                                                >
                                                    RSVP
                                                </Button>
                                            )}
                                        </Stack>
                                    </Box>                                     <Box>
                                        <Typography variant="caption" color="gray" display="block" sx={{ mb: 1 }}>
                                            Venue Information
                                        </Typography>
                                        <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                                            {realVenuePics[0] ? (
                                                <Box
                                                    component="img"
                                                    src={getOptimizedImageUrl(realVenuePics[0], 200)}
                                                    sx={{
                                                        width: 80,
                                                        height: 55,
                                                        borderRadius: 1,
                                                        objectFit: "cover",
                                                        border: "1px solid rgba(255,255,255,0.1)",
                                                    }}
                                                    alt="Venue"
                                                />
                                            ) : null}
                                            <Box>
                                                <Typography variant="body2" sx={{ fontWeight: "bold", color: "white" }}>
                                                    {event.where.name}
                                                </Typography>
                                                {(event.where.streetAddress || event.where.location) && (
                                                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)", display: "block", mt: 0.5 }}>
                                                        {event.where.streetAddress || event.where.location}
                                                    </Typography>
                                                )}
                                                <Button
                                                    component="a"
                                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.where.name + " " + (event.where.streetAddress || event.where.location))}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    startIcon={<LocationOnIcon sx={{ fontSize: "14px !important" }} />}
                                                    sx={{
                                                        p: 0,
                                                        mt: 0.5,
                                                        minWidth: 0,
                                                        color: "#FF758C",
                                                        textTransform: "none",
                                                        fontSize: "12px",
                                                        "&:hover": { textDecoration: "underline" },
                                                    }}
                                                >
                                                    Street Map
                                                </Button>
                                            </Box>
                                        </Box>
                                    </Box>
                                </Box>
                            </Grid>

                            {/* Rich Text Injection */}
                            {event.what.description && (
                                <Grid item xs={12} md={8}>
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            color: "#FF1B6B",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1,
                                            mb: 3,
                                            borderBottom: "1px solid rgba(255,27,107,0.3)",
                                            pb: 1,
                                            fontWeight: "bold",
                                        }}
                                    >
                                        Full Publisher Details
                                    </Typography>
                                    <Box
                                        sx={{
                                            bgcolor: "white",
                                            color: "black",
                                            p: { xs: 3, md: 5 },
                                            borderRadius: 3,
                                            "& img": {
                                                maxWidth: "100%",
                                                height: "auto",
                                                borderRadius: 2,
                                                my: 2,
                                                display: "block",
                                                mx: "auto",
                                            },
                                            "& a": { color: "#FF1B6B", textDecoration: "none", fontWeight: "bold" },
                                            "& h1, & h2, & h3, & h4": { color: "#333", mt: 3, mb: 2 },
                                            "& ul": { paddingLeft: 4, mb: 3 },
                                            "& li": { mb: 1, fontSize: "1.1rem" },
                                            "& p": { fontSize: "1.1rem", lineHeight: 1.8, mb: 2 },
                                        }}
                                        dangerouslySetInnerHTML={{ __html: event.what.description }}
                                    />
                                </Grid>
                            )}
                        </Grid>
                    </Box>
                </Box>

                {/* Additional Venue Pictures Gallery */}
                {realVenuePics.length > 0 && (
                    <Box sx={{ mt: 6, borderTop: "1px solid rgba(255,255,255,0.1)", pt: 4 }}>
                        <Typography variant="h6" sx={{ color: "white", mb: 3, fontWeight: "bold" }}>
                            Venue Photos
                        </Typography>
                        <Grid container spacing={2}>
                            {realVenuePics.map((pic: string, idx: number) => (
                                <Grid item xs={6} sm={3} key={idx}>
                                    <Box
                                        component="img"
                                        src={getOptimizedImageUrl(pic, 600)}
                                        alt={`Venue gallery ${idx + 1}`}
                                        sx={{
                                            width: "100%",
                                            height: 140,
                                            borderRadius: 2,
                                            objectFit: "cover",
                                            border: "1px solid rgba(255, 255, 255, 0.1)",
                                            cursor: "pointer",
                                            transition: "transform 0.2s",
                                            "&:hover": {
                                                transform: "scale(1.05)",
                                            },
                                        }}
                                    />
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                )}
            </Container>

            {loginProfileId && (isMobile ? <AppFooterMobile /> : <AppFooterDesktop />)}
        </Box>
    );
}


