"use client";

import {
  Box,
  Button,
  Typography,
  Grid,
  useTheme,
  useMediaQuery,
  Container,
  Stack,
  Card,
  CardContent,
  alpha,
  Paper,
  Chip,
} from "@mui/material";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { useState, useEffect } from "react";
import isBetween from "dayjs/plugin/isBetween";
import { ArrowLeft, Calendar as CalendarIcon, Clock, MapPin } from "lucide-react";
import AppFooterMobile from "@/layout/AppFooterMobile";
import AppFooterDesktop from "@/layout/AppFooterDesktop";
import AppHeaderMobile from "@/layout/AppHeaderMobile";
import AppHeaderDesktop from "@/layout/AppHeaderDesktop";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { jwtDecode } from "jwt-decode";
import Loader from "@/commonPage/Loader";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isBetween);

const EST_TZ = "America/New_York";


export default function Calendar() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState<any>(dayjs());
  const [selectedDate, setSelectedDate] = useState<any>(dayjs().tz("America/New_York"));
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery("(max-width: 900px)") ? true : false;
  const [profileId, setProfileId] = useState<any>(null);

  const startOfMonth = currentDate.startOf("month");
  const endOfMonth = currentDate.endOf("month");
  const daysInMonth = endOfMonth.date();
  const startDayOfWeek = startOfMonth.day();

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("loginInfo");
      if (token) {
        try {
          const decodeToken = jwtDecode<any>(token);
          setProfileId(decodeToken?.profileId || null);
        } catch (e) {
          console.warn("Failed to decode token", e);
          setProfileId(null);
        }
      } else {
        router.push("/login");
      }
    }
  }, [router]);

  useEffect(() => {
    if (!mounted) return;
    if (profileId) {
      handleGetEvents(profileId);
    } else {
      handleGetEvents("a0cf00e0-6245-4d03-9d07-48d6626f4f57"); // Same default profile
    }
  }, [profileId, mounted]);

  const handleGetEvents = async (userid: any) => {
    try {
      const response = await fetch("/api/user/events?id=" + userid, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const eventsData = await response.json();
      setEvents(eventsData?.events || []);
      setLoading(false);
    } catch (error) {
      console.error("Error:", error);
      setLoading(false);
    }
  };

  const goToPreviousMonth = () => {
    const newMonth = currentDate.subtract(1, "month");
    setCurrentDate(newMonth);
    setSelectedDate(newMonth.startOf("month"));
  };
  const goToNextMonth = () => {
    const newMonth = currentDate.add(1, "month");
    setCurrentDate(newMonth);
    setSelectedDate(newMonth.startOf("month"));
  };

  // Find events matching the selected day
  const selectedDayEvents = events.filter((event: any) =>
    dayjs(event.StartTime).tz(EST_TZ).isSame(
      selectedDate.tz(EST_TZ), "day"
    )
  );

  const generateCalendar = () => {
    const days = [];
    let dayCounter = 1;

    for (let week = 0; week < 6; week++) {
      const weekRow = [];
      let isNextMonthWeek = true;

      for (let day = 0; day < 7; day++) {
        if (week === 0 && day < startDayOfWeek) {
          const prevMonthDay = endOfMonth.subtract(1, "month").endOf("month").date() - (startDayOfWeek - day - 1);
          weekRow.push(
            <Box
              key={`prev-${week}-${day}`}
              sx={{ p: 1, color: "rgba(255,255,255,0.2)", cursor: "default", textAlign: "center" }}
            >
              <Typography variant="body2">{prevMonthDay}</Typography>
            </Box>
          );
          isNextMonthWeek = false;
        } else if (dayCounter > daysInMonth) {
          weekRow.push(
            <Box
              key={`next-${week}-${day}`}
              sx={{ p: 1, color: "rgba(255,255,255,0.2)", cursor: "default", textAlign: "center" }}
            >
              <Typography variant="body2">{dayCounter - daysInMonth}</Typography>
            </Box>
          );
          dayCounter++;
        } else {
          isNextMonthWeek = false;
          const currentDay = dayCounter;
          const currentDayjs = currentDate.date(currentDay);
          const isSelected = selectedDate.isSame(currentDayjs, "day");
          const isToday = dayjs().isSame(currentDayjs, "day");

          // Do we have an event?
          const hasEvent = events.some((event: any) =>
            dayjs(event.StartTime).tz(EST_TZ).isSame(
              currentDayjs.tz(EST_TZ), "day"
            )
          );


          weekRow.push(
            <Box
              key={`day-${week}-${day}`}
              onClick={() => setSelectedDate(currentDayjs)}
              sx={{
                p: { xs: 1, sm: 1.5 },
                textAlign: "center",
                cursor: "pointer",
                borderRadius: "12px",
                position: "relative",
                transition: "all 0.2s ease",
                bgcolor: isSelected ? "#f50057" : isToday ? "rgba(245,0,87,0.1)" : "transparent",
                color: isSelected ? "#fff" : isToday ? "#f50057" : "rgba(255,255,255,0.9)",
                "&:hover": {
                  bgcolor: isSelected ? "#c51162" : "rgba(255,255,255,0.1)",
                },
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: isSelected || isToday ? "bold" : "regular", fontSize: { xs: "0.85rem", sm: "1rem" } }}>
                {currentDay}
              </Typography>
              {hasEvent && (
                <Box
                  sx={{
                    position: "absolute",
                    bottom: "2px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "5px",
                    height: "5px",
                    borderRadius: "50%",
                    bgcolor: isSelected ? "#fff" : "#00e676",
                    boxShadow: "0 0 8px rgba(0,230,118,0.5)",
                  }}
                />
              )}
            </Box>
          );
          dayCounter++;
        }
      }

      if (!isNextMonthWeek) {
        days.push(
          <Grid container spacing={0} justifyContent="space-between" key={`week-${week}`} sx={{ mb: 1 }}>
            {weekRow.map((day, index) => (
              <Grid item xs={1.7} key={index} sx={{ display: 'flex', justifyContent: 'center' }}>
                {day}
              </Grid>
            ))}
          </Grid>
        );
      }
    }
    return days;
  };

  if (!mounted || loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#0a0e27" }}>
        <Loader />
      </Box>
    );
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <Box sx={{ background: "linear-gradient(160deg, #14071f 0%, #0a0412 100%)", color: "white", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {isMobile ? <AppHeaderMobile /> : <AppHeaderDesktop />}

      <Container maxWidth="xl" sx={{ flexGrow: 1, px: { xs: 1, sm: 2, md: 3 }, pb: 10, pt: { xs: 2, md: "110px" } }}>
        <Grid container spacing={{ xs: 2, md: 4 }}>
          {/* Calendar Section */}
          <Grid item xs={12} md={6} lg={5}>
            <Box
              sx={{
                bgcolor: "rgba(20, 10, 35, 0.6)",
                borderRadius: 4,
                p: { xs: 2, sm: 4 },
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.05)",
                boxShadow: "0 16px 40px rgba(0,0,0,0.4)",
              }}
            >
              {/* Header inside calendar */}
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
                <Button
                  onClick={() => router.back()}
                  startIcon={<ArrowLeft size={20} />}
                  sx={{
                    textTransform: "none",
                    color: "rgba(255,255,255,0.7)",
                    borderRadius: "12px",
                    fontWeight: "bold",
                    px: 2,
                    "&:hover": { color: "#fff", bgcolor: "rgba(255,255,255,0.1)" },
                  }}
                >
                  Back
                </Button>

                <Typography variant="h6" sx={{ fontWeight: "bold", background: "linear-gradient(45deg, #e91e63, #9c27b0)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  {currentDate.format("MMMM YYYY")}
                </Typography>
              </Stack>

              {/* Navigation */}
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3, alignItems: "center" }}>
                <Button
                  onClick={goToPreviousMonth}
                  sx={{ color: "#fff", bgcolor: "rgba(255,255,255,0.1)", borderRadius: "12px", px: 2, textTransform: "none", fontWeight: "bold", "&:hover": { bgcolor: "rgba(255,255,255,0.2)" } }}
                >
                  Prev
                </Button>
                <Typography variant="button" sx={{ fontWeight: "bold", letterSpacing: 1, opacity: 0.8 }}>
                  {currentDate.format("YYYY")}
                </Typography>
                <Button
                  onClick={goToNextMonth}
                  sx={{ color: "#fff", bgcolor: "rgba(255,255,255,0.1)", borderRadius: "12px", px: 2, textTransform: "none", fontWeight: "bold", "&:hover": { bgcolor: "rgba(255,255,255,0.2)" } }}
                >
                  Next
                </Button>
              </Box>

              {/* Days Header */}
              <Grid container spacing={0} justifyContent="space-between" sx={{ mb: 2 }}>
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <Grid item xs={1.7} key={day} sx={{ textAlign: "center", color: "rgba(255,255,255,0.5)", fontWeight: "bold", fontSize: "0.8rem", textTransform: "uppercase" }}>
                    {day}
                  </Grid>
                ))}
              </Grid>

              {/* Calendar Grid */}
              <Box>{generateCalendar()}</Box>
            </Box>
          </Grid>

          {/* Events Display Section */}
          <Grid item xs={12} md={6} lg={7}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, px: { xs: 1, md: 0 }, mt: { xs: 2, md: 0 } }}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: "bold", display: "flex", alignItems: "center", gap: 1 }}>
                  {selectedDate.isBefore(dayjs(), "day") ? "Past Events" : dayjs().isSame(selectedDate, "day") ? "Today's Events" : "Events"} on {selectedDate.format("MMMM D")}
                </Typography>
              </Box>
              <Chip label={`${selectedDayEvents.length} found`} size="small" sx={{ bgcolor: "rgba(255,255,255,0.1)", color: "#fff", fontWeight: "bold" }} />
            </Box>

            <AnimatePresence mode="wait">
              {selectedDayEvents.length > 0 ? (
                <motion.div key={selectedDate.format("YYYY-MM-DD")} variants={containerVariants} initial="hidden" animate="show" exit="hidden">
                  <Stack spacing={3}>
                    {selectedDayEvents.map((post: any, index: number) => (
                      <motion.div variants={itemVariants} key={post.Id}>
                        <motion.div whileTap={{ scale: 0.98 }}>
                          <Card
                            onClick={() => router.push("/events/detail/" + post?.Id)}
                            sx={{
                              borderRadius: 4,
                              border: "1px solid rgba(255,255,255,0.08)",
                              overflow: "hidden",
                              bgcolor: "rgba(30, 30, 30, 0.4)",
                              backdropFilter: "blur(20px)",
                              color: "white",
                              boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                              cursor: "pointer",
                              transition: "all 0.2s",
                              "&:hover": { borderColor: "rgba(245,0,87,0.4)" }
                            }}
                          >
                            <Box sx={{ position: "relative", width: "100%", height: "260px", overflow: "hidden", bgcolor: "rgba(0,0,0,0.3)" }}>
                              <Box sx={{ position: "absolute", top: -20, bottom: -20, left: -20, right: -20, filter: "blur(20px)", opacity: 0.6, transform: "scale(1.1)" }}>
                                <Image src={post?.CoverImageUrl || "/placeholder-image.png"} alt="bg blur" fill unoptimized style={{ objectFit: "cover" }} />
                              </Box>
                              <Image src={post?.CoverImageUrl || "/placeholder-image.png"} alt={post?.Name} fill unoptimized priority={index < 2} style={{ objectFit: "contain", zIndex: 1 }} />

                              {selectedDate.isBefore(dayjs(), "day") && (
                                <Box sx={{ position: "absolute", top: 16, right: 16, zIndex: 3 }}>
                                  <Chip label="Past Event" size="small" sx={{ bgcolor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", color: "#fff", fontWeight: "bold", border: "1px solid rgba(255,255,255,0.2)" }} />
                                </Box>
                              )}
                            </Box>

                            <CardContent sx={{ p: 3, position: "relative", zIndex: 2, background: "rgba(20, 10, 35, 0.95)", }}>
                              <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1, fontSize: "1.3rem" }}>{post.Name}</Typography>
                              <Stack direction="row" alignItems="center" spacing={1} sx={{ color: "rgba(255,255,255,0.7)", mb: 1 }}>
                                <Clock size={16} color="#f50057" />
                                <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                                  {/* {dayjs(post.StartTime).format("h:mm A")} - {dayjs(post.EndTime).format("h:mm A")} */}
                                  {new Intl.DateTimeFormat("en-US", {
                                    month: "short",
                                    day: "2-digit",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                    timeZone: "America/New_York",
                                  }).format(new Date(post.StartTime))}{" "}
                                  EST
                                </Typography>
                              </Stack>
                              {/* {post.Venue && (
                                <Stack direction="row" alignItems="center" spacing={1} sx={{ color: "rgba(255,255,255,0.5)" }}>
                                  <MapPin size={16} />
                                  <Typography variant="body2" noWrap sx={{ maxWidth: '90%' }}>{post.Venue}</Typography>
                                </Stack>
                              )} */}
                            </CardContent>
                          </Card>
                        </motion.div>
                      </motion.div>
                    ))}
                  </Stack>
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <Paper sx={{ p: 6, bgcolor: "rgba(20, 10, 35, 0.4)", borderRadius: 4, border: "1px dashed rgba(255,255,255,0.1)", textAlign: "center" }}>
                    <CalendarIcon size={48} color="rgba(245,0,87,0.4)" style={{ marginBottom: "16px", display: "inline-block" }} />
                    <Typography variant="h6" sx={{ color: "rgba(255,255,255,0.8)" }}>No limits on fun today!</Typography>
                    <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.4)", mt: 1 }}>Select a different date or tap 'Create' from the main menu.</Typography>
                  </Paper>
                </motion.div>
              )}
            </AnimatePresence>
          </Grid>
        </Grid>
      </Container>

      {isMobile ? <AppFooterMobile /> : <AppFooterDesktop />}
    </Box>
  );
}
