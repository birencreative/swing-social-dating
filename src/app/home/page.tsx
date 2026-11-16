"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Container,
  Typography,
  useMediaQuery,
  Grid,
  alpha,
  useTheme,
  Dialog,
  DialogContent,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { jwtDecode } from "jwt-decode";
import ProfileImgCheckerModel from "@/components/ProfileImgCheckerModel";
import AppFooterMobile from "@/layout/AppFooterMobile";
import AppFooterDesktop from "@/layout/AppFooterDesktop";
import AppHeaderMobile from "@/layout/AppHeaderMobile";
import AppHeaderDesktop from "@/layout/AppHeaderDesktop";
import CustomDialog from "@/components/CustomDialog";
import { useLocation } from "@/hooks/useLocation";
import {
  MessageSquare,
  Zap,
  Heart,
  Sparkles,
  X,
  ArrowRight,
  Flame,
  Calendar,
  Plane,
  ShoppingBag,
  BookOpen,
  Search,
  ChevronRight,
  ShieldCheck, Users, MapPin, Star
} from "lucide-react";

const categories = [
  {
    title: "What's Hot",
    description: "Trending in the community",
    icon: Flame,
    url: "/whatshot",
    featured: true,
    color: "#FF1B6B",
  },
  {
    title: "Events",
    description: "Discover exciting community events",
    icon: Calendar,
    url: "/events",
    color: "#00D2FF",
  },
  {
    title: "Travel",
    description: "Explore new destinations",
    icon: Plane,
    url: "https://swingsocial.co/travel/",
    color: "#7000FF",
  },
  {
    title: "Marketplace",
    description: "Buy and sell in the community",
    icon: ShoppingBag,
    url: "/marketplace",
    isComingSoon: false,
    color: "#FFD700",
  },
  {
    title: "Learning & Blogs",
    description: "Expand your knowledge",
    icon: BookOpen,
    url: "https://swingsocial.co/blog/",
    color: "#00FFAB",
  },
  {
    title: "Search",
    description: "Find your people",
    icon: Search,
    url: "/members",
    isComingSoon: false,
    color: "#FF5ACD",
  },
];

interface WelcomePopupProps {
  name: string;
  isNewMessage: boolean;
  onClose: () => void;
  onMatchesClick: () => void;
  onMessagesClick: () => void;
}

const GlobalStyles = () => (
  <style dangerouslySetInnerHTML={{
    __html: `
    @keyframes float {
      0%, 100% { transform: translate(0, 0) scale(1); }
      33% { transform: translate(30px, -50px) scale(1.1); }
      66% { transform: translate(-20px, 20px) scale(0.9); }
    }
    @keyframes spin-border {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `}} />
);


const PulseDot = ({ color }: { color: string }) => (
  <Box
    sx={{
      width: 7,
      height: 7,
      borderRadius: "50%",
      bgcolor: color,
      flexShrink: 0,
      "@keyframes dot-pulse": {
        "0%": { boxShadow: `0 0 0 0 ${color}99` },
        "70%": { boxShadow: `0 0 0 5px ${color}00` },
        "100%": { boxShadow: `0 0 0 0 ${color}00` },
      },
      animation: "dot-pulse 2s infinite",
    }}
  />
);



const ExploreCard = ({
  category,
  featured = false,
  onClick,
}: {
  category: any;
  featured?: boolean;
  onClick: () => void;
}) => {
  const Icon = category.icon;
  const color = category.color || "#FF1B6B";

  return (
    <Box
      component={motion.div}
      whileHover={{ y: -12, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      sx={{
        background: `linear-gradient(145deg, rgba(22,12,38,0.9) 0%, ${alpha(color, 0.08)} 100%)`,
        backdropFilter: "blur(30px)",
        border: `1.5px solid ${alpha(color, 0.3)}`,
        borderRadius: "28px",
        height: "100%",
        minHeight: featured ? { xs: "130px", md: "230px" } : { xs: "100px", md: "160px" },
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        p: { xs: "14px 14px", md: "28px" },
        cursor: "pointer",
        transition: "all 0.5s cubic-bezier(0.23, 1, 0.32, 1)",
        boxShadow: `0 4px 20px ${alpha(color, 0.1)}`,
        "&:hover": {
          background: `linear-gradient(145deg, rgba(28,14,48,0.95) 0%, ${alpha(color, 0.16)} 100%)`,
          borderColor: alpha(color, 0.6),
          boxShadow: `0 20px 50px ${alpha(color, 0.2)}`,
          "& .card-glow": { opacity: 0.7, transform: "scale(1.2)" },
          "& .icon-box": { transform: "scale(1.1) rotate(5deg)", background: alpha(color, 0.25) }
        },
      }}
    >
      <Box
        className="card-glow"
        sx={{
          position: "absolute",
          top: "-30%", right: "-30%",
          width: "60%", height: "60%",
          background: `radial-gradient(circle at center, ${alpha(color, 0.2)} 0%, transparent 70%)`,
          opacity: 0, transition: "all 0.8s ease",
          pointerEvents: "none", zIndex: 0
        }}
      />

      <Box sx={{ position: "relative", zIndex: 2 }}>
        <Box
          className="icon-box"
          sx={{
            width: featured ? 68 : 48,
            height: featured ? 68 : 48,
            borderRadius: "18px",
            background: `linear-gradient(135deg, ${alpha(color, 0.25)}, ${alpha(color, 0.12)})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: color, mb: 1.2,
            transition: "all 0.4s ease",
            border: `1.5px solid ${alpha(color, 0.35)}`,
            boxShadow: `0 4px 16px ${alpha(color, 0.2)}`,
          }}
        >
          <Icon size={featured ? 32 : 24} />
        </Box>
        <Typography
          sx={{
            fontWeight: 900,
            fontSize: { xs: "0.95rem", md: featured ? "1.4rem" : "1.1rem" },
            color: "#fff", lineHeight: 1.1, mb: 0.5, letterSpacing: "-0.02em"
          }}
        >
          {category.title}
        </Typography>
        <Typography
          sx={{
            color: "rgba(255,255,255,0.55)",
            fontSize: "0.75rem", lineHeight: 1.4,
            maxWidth: featured ? "85%" : "100%",
            fontWeight: 500,
          }}
        >
          {category.description}
        </Typography>
      </Box>

      {featured && (
        <Box sx={{ position: "relative", zIndex: 2, mt: 3 }}>
          <Box
            sx={{
              display: "inline-flex", alignItems: "center", gap: 1.2,
              px: 2.5, py: 1, borderRadius: "100px",
              background: alpha(color, 0.15), border: `1px solid ${alpha(color, 0.3)}`,
              color: color, fontSize: "0.80rem", fontWeight: 800, textTransform: "uppercase",
              letterSpacing: "0.05em"
            }}
          >
            <Sparkles size={16} /> 🔥 Featured Now
          </Box>
        </Box>
      )}
    </Box>
  );
};

const Home = () => {
  const router = useRouter();
  const theme = useTheme();
  const isMobileOrTablet = useMediaQuery(theme.breakpoints.down("md"));

  const [profileId, setProfileId] = useState<any>();
  const [currentName, setCurrentName] = useState<string>("");
  const [isNewMessage, setNewMessage] = useState<boolean>(false);
  const [showPopup, setShowPopup] = useState<boolean>(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");
  const [popupScrolled, setPopupScrolled] = useState(false);
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);
  const [pendingRedirect, setPendingRedirect] = useState<string | null>(null);

  useLocation(profileId);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const tokenDevice = localStorage.getItem("loginInfo");
      if (tokenDevice) {
        const decodeToken = jwtDecode<any>(tokenDevice);
        setCurrentName(decodeToken?.profileName ?? "");
        setProfileId(decodeToken?.profileId);
      }
      const alreadySeen = localStorage.getItem("welcomePopupSeen");
      if (!alreadySeen) {
        setShowPopup(true);
      }
    }
  }, []);

  const fetchData = async () => {
    if (!profileId) return;

    try {
      const response = await fetch(`/api/user/sweeping/user?id=${profileId}`);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const { user: advertiserData } = await response.json();

      if (advertiserData) {
        setProfileAvatar(advertiserData?.Avatar);
      }

      // Check for unread messages
      const msgResponse = await fetch(`/api/user/messaging?profileid=${profileId}`);
      if (msgResponse.ok) {
        const msgData = await msgResponse.json();
        const chats = msgData.data || [];
        const hasUnread = chats.some((chat: any) => {
          const count = parseInt(chat.NewMessages || "0");
          // Check if last message was not from the current user
          // Based on MobileChat.tsx logic
          const lastSenderId = chat.MemberIdFrom || chat.MemberIdfrom || chat.ProfileIdFrom || chat.ProfileIdfrom;
          return count > 0 && String(lastSenderId) !== String(profileId);
        });

        setNewMessage(hasUnread);
        if (hasUnread) {
          localStorage.setItem("isNewMessage", "true");
        }
      }
    } catch (error: any) {
      console.error("Error fetching data:", error.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, [profileId]);

  const handleClosePopup = (redirectUrl?: string) => {
    if (redirectUrl) setPendingRedirect(redirectUrl);
    setShowPopup(false);
    localStorage.setItem("welcomePopupSeen", "true");
  };

  const handleNavigate = (category: (typeof categories)[0]) => {
    if (category?.isComingSoon) {
      setDialogTitle("Coming Soon");
      setDialogMessage("This feature will be available very soon 🚀");
      setDialogOpen(true);
      setTimeout(() => setDialogOpen(false), 2000);
    } else {
      router.push(category?.url);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = localStorage.getItem("logged_in_profile");

    const trackUser = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const aff = urlParams.get("aff");
        const refer = urlParams.get("refer");

        const getOS = () => {
          const ua = window.navigator.userAgent;
          if (ua.includes("Win")) return "Windows";
          if (ua.includes("Mac")) return "MacOS";
          if (ua.includes("Android")) return "Android";
          if (/iPad|iPhone|iPod/.test(ua)) return "iOS";
          if (ua.includes("Linux")) return "Linux";
          return "Unknown";
        };

        const ipRes = await fetch("https://ipapi.co/json");
        const ipData = await ipRes.json();

        const payload = {
          affiliate: aff,
          referral: refer,
          OS: getOS(),
          page: "home",
          url: window.location.href,
          userid: id || null,
          ip: ipData?.ip || null,
          city: ipData?.city || null,
          region: ipData?.region || null,
          country_name: ipData?.country_name || null,
        };

        if (id) setProfileId(id);

        await fetch("/api/user/tracking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.error("Tracking failed:", err);
      }
    };

    trackUser();
  }, []);


  const pushedStateRef = useRef(false);

  useEffect(() => {
    if (showPopup && !pushedStateRef.current) {
      window.history.pushState({ welcomePopup: true }, "");
      pushedStateRef.current = true;
    } else if (!showPopup && pushedStateRef.current) {
      if (window.history.state?.welcomePopup === true) {
        window.history.back();
      }
      pushedStateRef.current = false;
    }

    const handlePopState = () => {
      if (showPopup) {
        pushedStateRef.current = false;
        setShowPopup(false);
        localStorage.setItem("welcomePopupSeen", "true");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [showPopup]);

  useEffect(() => {
    if (!showPopup && pendingRedirect && !pushedStateRef.current) {
      const timer = setTimeout(() => {
        router.push(pendingRedirect);
        setPendingRedirect(null);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showPopup, pendingRedirect]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #120820 0%, #0d0518 40%, #0a0415 100%)",
        color: "white",
        position: "relative",
        overflowX: "hidden",
        display: "flex",
        flexDirection: "column",
        mb: { xs: 10, sm: 10, md: 0, }
      }}
    >
      {isMobileOrTablet ? <AppHeaderMobile /> : <AppHeaderDesktop />}
      <Box
        sx={{
          margin: { xs: "8px", sm: "12px", md: "20px", lg: "28px" },
          mt: {
            xs: 1, sm: 6, md: 16, lg: 16
          },
          flex: 1,
          background: "rgba(20, 8, 36, 0.6)",
          backdropFilter: "blur(16px)",
          borderRadius: { xs: "20px", md: "36px" },
          border: "1.5px solid rgba(255, 27, 107, 0.15)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Container maxWidth="lg" sx={{ pt: { xs: 2, md: 6 }, px: { xs: 2, md: 5 }, pb: { xs: 3, md: 8 }, flex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <Box sx={{ width: 4, height: 20, borderRadius: 10, background: "linear-gradient(#FF1B6B, #7000FF)", boxShadow: "0 0 10px rgba(255,27,107,0.5)" }} />
              <Typography sx={{ fontWeight: 900, fontSize: { xs: "1.1rem", md: "1.5rem" }, color: "#fff", letterSpacing: "-0.02em" }}>
                Explore
              </Typography>
            </Box>

            <Grid container spacing={{ xs: 2, md: 2 }}>
              <Grid item xs={6} md={6}>
                {categories[0] && (
                  <ExploreCard
                    category={categories[0]}
                    onClick={() => handleNavigate(categories[0])}
                  />
                )}
              </Grid>

              <Grid item xs={6} md={6}>
                {categories[1] && (
                  <ExploreCard
                    category={categories[1]}
                    onClick={() => handleNavigate(categories[1])}
                  />
                )}
              </Grid>

              <Grid item xs={6} md={6}>
                {categories[2] && (
                  <ExploreCard
                    category={categories[2]}
                    onClick={() => handleNavigate(categories[2])}
                  />
                )}
              </Grid>

              <Grid item xs={6} md={6}>
                {categories[3] && (
                  <ExploreCard
                    category={categories[3]}
                    onClick={() => handleNavigate(categories[3])}
                  />
                )}
              </Grid>

              <Grid item xs={6} md={6}>
                {categories[4] && (
                  <ExploreCard
                    category={categories[4]}
                    onClick={() => handleNavigate(categories[4])}
                  />
                )}
              </Grid>

              <Grid item xs={6} md={6}>
                {categories[5] && (
                  <ExploreCard
                    category={categories[5]}
                    onClick={() => handleNavigate(categories[5])}
                  />
                )}
              </Grid>
            </Grid>
          </motion.div>
        </Container>
      </Box>

      {isMobileOrTablet ? <AppFooterMobile /> : <AppFooterDesktop />}

      <CustomDialog
        open={dialogOpen}
        title={dialogTitle}
        description={dialogMessage}
        confirmText="OK"
        cancelText="Close"
        onClose={() => setDialogOpen(false)}
        onConfirm={() => setDialogOpen(false)}
      />

      <AnimatePresence>
        {showPopup && (
          <Dialog
            open={showPopup}
            onClose={() => { }}
            disableEscapeKeyDown
            BackdropProps={{
              sx: { backdropFilter: "blur(8px)" }
            }}
            PaperProps={{
              sx: {
                width: "100%",
                borderRadius: "20px",
                margin: 2,
                p: 3,
                background: "rgba(20, 10, 35, 0.85)",
                backdropFilter: "blur(25px)",
                border: "2px solid rgba(255,255,255,0.08)",
                color: "#fff",
                overflow: "hidden",
                maxHeight: "60vh",
                overflowY: "auto",
                "&::-webkit-scrollbar": {
                  display: "none",
                },
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              },
            }}
          >
            <DialogContent
              onScroll={(e) => setPopupScrolled(e.currentTarget.scrollTop > 0)}
              sx={{
                p: 0,
                overflowY: "auto",
                position: "relative",
                "&::-webkit-scrollbar": {
                  display: "none",
                },
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              <Box
                component={motion.button}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleClosePopup()}
                sx={{
                  position: "absolute",
                  top: 2,
                  right: 2,
                  zIndex: 20,
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#fff",
                  "&:hover": {
                    background: "rgba(255,45,85,0.2)",
                    borderColor: "rgba(255,45,85,0.5)",
                    color: "#FF2D55",
                  },
                }}
              >
                <X size={18} />
              </Box>
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                <Box sx={{ position: "relative", mt: 1 }}>
                  <Box sx={{ textAlign: "center", mb: 2 }}>
                    <motion.div
                      initial={{ scale: 0.5, rotate: -10, opacity: 0 }}
                      animate={{ scale: 1, rotate: 0, opacity: 1 }}
                      transition={{ delay: 0.2, type: "spring" }}
                    >
                      <Box
                        sx={{
                          width: 62, height: 62,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          margin: "0 auto 14px", fontSize: "2rem", fontWeight: 900,
                          color: "#fff",
                          overflow: "hidden",
                          position: "relative",
                        }}
                      >
                        <Box
                          sx={{
                            position: "absolute",
                            inset: -10,
                            borderRadius: "50%",
                            background:
                              "radial-gradient(circle, rgba(255,27,107,0.2) 0%, transparent 70%)",
                            animation: "pulse 2s ease-in-out infinite",
                            "@keyframes pulse": {
                              "0%, 100%": { transform: "scale(1)", opacity: 0.5 },
                              "50%": { transform: "scale(1.15)", opacity: 1 },
                            },
                          }}
                        />
                        {profileAvatar ? (
                          <Box
                            component="img"
                            src={profileAvatar}
                            alt={currentName}
                            sx={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              borderRadius: "16px",
                              border: "2px solid transparent",
                              backgroundImage:
                                "linear-gradient(rgba(20,10,35,1), rgba(20,10,35,1)), linear-gradient(135deg, #FF2D55, #7000FF)",
                              backgroundOrigin: "border-box",
                              backgroundClip: "padding-box, border-box",
                            }}
                          />
                        ) : (
                          currentName?.charAt(0)?.toUpperCase() || "S"
                        )}
                      </Box>
                    </motion.div>

                    <Typography
                      sx={{
                        fontWeight: 900,
                        fontSize: { xs: "1.2rem", md: "1.9rem" },
                        lineHeight: 1.15, mb: 0.8,
                        color: "#fff",
                        letterSpacing: "-0.02em"
                      }}
                    >
                      Welcome back, {currentName || "friend"}
                    </Typography>
                    <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.88rem", lineHeight: 1.5 }}>
                      Your connections are waiting — let's find your perfect match today.
                    </Typography>
                  </Box>

                  <Grid container spacing={1.2} sx={{ mb: 2 }}>
                    <Grid item xs={12}>
                      <Box
                        component={motion.div}
                        whileHover={{ scale: 1.01, y: -1 }}
                        onClick={() => {
                          setNewMessage(false);
                          localStorage.setItem("isNewMessage", "false");
                          handleClosePopup("/messaging");
                        }}
                        sx={{
                          background: "rgba(164,69,234,0.08)",
                          border: "1px solid rgba(164,69,234,0.2)",
                          borderRadius: "14px", p: "14px 18px", cursor: "pointer",
                          display: "flex", alignItems: "center", gap: 2,
                          transition: "all 0.2s ease",
                          "&:hover": { borderColor: "rgba(164,69,234,0.5)", background: "rgba(164,69,234,0.14)" }
                        }}
                      >
                        <Box sx={{
                          width: 42, height: 42, borderRadius: "12px",
                          background: "rgba(164,69,234,0.2)", color: "#C07CFF",
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>
                          <MessageSquare size={20} />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "0.95rem" }}>Messages</Typography>
                          <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.78rem" }}>Check your latest chats</Typography>
                        </Box>
                        {isNewMessage && <PulseDot color="#C07CFF" />}
                        <ChevronRight size={16} style={{ color: "rgba(255,255,255,0.25)", flexShrink: 0 }} />
                      </Box>
                    </Grid>

                    <Grid item xs={6}>
                      <Box
                        component={motion.div}
                        whileHover={{ scale: 1.02, y: -1 }}
                        onClick={() => { handleClosePopup("/matches"); }}
                        sx={{
                          height: "100%", minHeight: 90,
                          background: "rgba(255,45,85,0.07)",
                          border: "1px solid rgba(255,45,85,0.18)",
                          borderRadius: "14px", p: "14px", cursor: "pointer",
                          display: "flex", flexDirection: "column", justifyContent: "space-between",
                          transition: "all 0.2s ease",
                          "&:hover": { borderColor: "rgba(255,45,85,0.45)", background: "rgba(255,45,85,0.13)" }
                        }}
                      >
                        <Heart size={22} style={{ color: "#FF2D55" }} />
                        <Box>
                          <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "0.9rem" }}>Matches</Typography>
                          <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.72rem" }}>See who liked you</Typography>
                        </Box>
                      </Box>
                    </Grid>

                    <Grid item xs={6}>
                      <Box
                        component={motion.div}
                        whileHover={{ scale: 1.02, y: -1 }}
                        onClick={() => { handleClosePopup("/members"); }}
                        sx={{
                          height: "100%", minHeight: 90,
                          background: "rgba(255,215,0,0.06)",
                          border: "1px solid rgba(255,215,0,0.16)",
                          borderRadius: "14px", p: "14px", cursor: "pointer",
                          display: "flex", flexDirection: "column", justifyContent: "space-between",
                          transition: "all 0.2s ease",
                          "&:hover": { borderColor: "rgba(255,215,0,0.4)", background: "rgba(255,215,0,0.12)" }
                        }}
                      >
                        <Zap size={22} style={{ color: "#FFD700" }} />
                        <Box>
                          <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "0.9rem" }}>Swipe</Typography>
                          <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.72rem" }}>Discover members</Typography>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: 1.4, textTransform: "uppercase", mb: 1.2 }}>
                      Platform Features
                    </Typography>

                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 2.5 }}>
                      {[
                        {
                          icon: <ShieldCheck size={16} />,
                          color: "#32DC64",
                          bg: "rgba(50,220,100,0.1)",
                          border: "rgba(50,220,100,0.2)",
                          title: "100% Discreet & Private",
                          desc: "Your identity is always protected. Share only what you want.",
                        },
                        {
                          icon: <Users size={16} />,
                          color: "#00D2FF",
                          bg: "rgba(0,210,255,0.08)",
                          border: "rgba(0,210,255,0.18)",
                          title: "Couples, Singles & More",
                          desc: "Browse Males, Females, and Couples — filter to your preference.",
                        },
                        {
                          icon: <MapPin size={16} />,
                          color: "#FF2D55",
                          bg: "rgba(255,45,85,0.08)",
                          border: "rgba(255,45,85,0.18)",
                          title: "Local Events & Meetups",
                          desc: "Find swing parties, social events, and meetups near you.",
                        },
                        {
                          icon: <Star size={16} />,
                          color: "#FFD700",
                          bg: "rgba(255,215,0,0.07)",
                          border: "rgba(255,215,0,0.18)",
                          title: "Verified Premium Profiles",
                          desc: "Interact with real, verified members in a trusted community.",
                        },
                      ].map((f, i) => (
                        <Box
                          key={i}
                          sx={{
                            display: "flex", alignItems: "center", gap: 1.5,
                            p: "10px 14px",
                            borderRadius: "12px",
                            background: f.bg,
                            border: `1px solid ${f.border}`,
                          }}
                        >
                          <Box sx={{
                            width: 32, height: 32, borderRadius: "9px",
                            background: `${f.color}18`,
                            border: `1px solid ${f.color}40`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: f.color, flexShrink: 0,
                          }}>
                            {f.icon}
                          </Box>
                          <Box>
                            <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.82rem", lineHeight: 1.2 }}>
                              {f.title}
                            </Typography>
                            <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.74rem", lineHeight: 1.4 }}>
                              {f.desc}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </motion.div>

                  <Box
                    component={motion.button}
                    whileHover={{ scale: 1.02, boxShadow: "0 12px 28px rgba(255,45,85,0.25)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleClosePopup()}
                    sx={{
                      width: "100%", py: "15px", borderRadius: "12px",
                      background: "linear-gradient(90deg, #FF2D55, #7000FF)",
                      border: "none", color: "#fff", fontWeight: 900,
                      fontSize: "1rem", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 1.2,
                    }}
                  >
                    Let&apos;s Go! <Sparkles size={18} />
                  </Box>



                </Box>
              </motion.div>
              {!popupScrolled && (
                <Box
                  sx={{
                    position: "sticky",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "80px",
                    pointerEvents: "none",
                    background:
                      "linear-gradient(to top, rgba(20,10,35,0.98) 0%, transparent 100%)",
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "center",
                    pb: 1,
                    zIndex: 10,
                  }}
                >
                  <Box
                    component={motion.div}
                    animate={{ y: [0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 0.3,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "0.65rem",
                        color: "rgba(255,255,255,0.4)",
                        fontWeight: 600,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                      }}
                    >
                      Scroll for more
                    </Typography>
                    <ArrowRight
                      size={14}
                      style={{
                        color: "rgba(255,255,255,0.35)",
                        transform: "rotate(90deg)",
                      }}
                    />
                  </Box>
                </Box>
              )}
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      {profileId && <ProfileImgCheckerModel profileId={profileId} />}
    </Box >
  );
};

export default Home;