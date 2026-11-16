"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  AppBar,
  Toolbar,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Typography,
  useTheme,
  useMediaQuery,
  Badge,
} from "@mui/material";
import { useSocketContext } from "@/context/SocketProvider";
import { useRouter, usePathname } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import {
  Home,
  Users,
  MessageCircle,
  Heart,
  Menu,
  X,
  LogOut,
  Bell,
  Calendar,
  ArrowRight,
} from "lucide-react";

const AppHeaderMobile = () => {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [profileId, setProfileId] = useState<string | null>(null);
  const pushedStateRef = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen && !pushedStateRef.current) {
      window.history.pushState({ menuOpen: true }, "");
      pushedStateRef.current = true;
    } else if (!mobileMenuOpen && pushedStateRef.current) {
      if (window.history.state?.menuOpen === true) {
        window.history.back();
      }
      pushedStateRef.current = false;
    }

    const handlePopState = () => {
      if (mobileMenuOpen) {
        pushedStateRef.current = false;
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [mobileMenuOpen]);

  useEffect(() => {
    const token = localStorage.getItem("loginInfo");
    const pid = localStorage.getItem("logged_in_profile");

    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      const decoded: any = jwtDecode(token);
      setProfileId(decoded.profileId || pid);
    } catch {
      localStorage.clear();
      router.replace("/login");
    }
  }, []);

  useEffect(() => {
    if (!profileId) return;

    fetch(`/api/user/sweeping/user?id=${profileId}`)
      .then((res) => res.json())
      .then(({ user }) => {
        setAvatar(user?.Avatar || null);
        setUserName(user?.Username || "");
      })
      .catch(console.error);
  }, [profileId]);

  const handleLogout = () => {
    localStorage.clear();
    router.replace("/login");
  };

  const { unreadCount } = useSocketContext();

  if (!isMobile) return null;

  const navItems = [
    { icon: Home, label: "Home", path: "/home" },
    { icon: Users, label: "Members", path: "/members" },
    {
      icon: "/661764-removebg-preview.png",
      label: "Pineapple",
      path: "/pineapple",
    },
    {
      icon: MessageCircle,
      label: "Messaging",
      path: "/messaging",
    },
    { icon: Heart, label: "Matches", path: "/matches" },
    { icon: Bell, label: "Notifications", path: "/notifications" },
    { icon: Calendar, label: "Events", path: "/events" },
    {
      icon: "/images/dollar_img.png",
      label: "Earn $$ for Referrals!",
      path: "/earn-money-referrals",
    },
  ];

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          bgcolor: isScrolled ? "rgba(15, 7, 26, 0.92)" : "transparent",
          background: isScrolled
            ? "linear-gradient(180deg, rgba(20, 8, 32, 0.96) 0%, rgba(12, 5, 20, 0.92) 100%)"
            : "transparent",
          boxShadow: isScrolled
            ? "0 4px 20px rgba(0, 0, 0, 0.5), 0 1px 0 rgba(255, 27, 107, 0.2)"
            : "none",
          borderBottom: isScrolled
            ? "1px solid rgba(255, 255, 255, 0.08)"
            : "1px solid transparent",
          zIndex: 1200,
          height: 78,
          backdropFilter: isScrolled ? "blur(12px)" : "none",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <Toolbar
          sx={{
            height: "100%",
            px: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Hamburger Menu */}
          <IconButton
            onClick={() => setMobileMenuOpen(true)}
            sx={{
              width: 46,
              height: 46,
              bgcolor: "rgba(255, 255, 255, 0.05)",
              borderRadius: "50%",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Menu size={24} color="#fff" />
          </IconButton>

          {/* Centered Logo */}
          <Box
            component="img"
            src="/logo.png"
            alt="swing social"
            sx={{
              height: 34,
              width: "auto",
              cursor: "pointer",
            }}
            onClick={() => router.push("/home")}
          />

          {/* Profile Avatar */}
          <IconButton
            onClick={() => router.push("/profile")}
            sx={{
              width: 46,
              height: 46,
              p: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Avatar
              src={avatar || undefined}
              sx={{
                width: 46,
                height: 46,
                border: "2.5px solid #FF1B6B",
                borderRadius: "50%",
                boxShadow: "0 0 0 3px rgba(255,27,107,0.25)",
              }}
            >
              {!avatar && userName?.charAt(0)?.toUpperCase()}
            </Avatar>
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Spacer */}
      <Box sx={{ height: 78 }} />

      {/* Side Drawer */}
      <Drawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        PaperProps={{
          sx: {
            width: 300,
            background: "linear-gradient(160deg, #14071f 0%, #0a0412 100%)",
            borderRight: "1px solid rgba(255,255,255,0.08)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        <Box
          sx={{
            px: 1.2,
            py: 3,
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            background: "linear-gradient(to bottom, rgba(255,27,107,0.05), transparent)",
            flexShrink: 0,
            zIndex: 1,
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Box
              component="img"
              src="/logo.png"
              alt="logo"
              sx={{ width: "180px", height: "auto" }}
            />

            <IconButton
              onClick={() => setMobileMenuOpen(false)}
              sx={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                "&:hover": {
                  background: "rgba(255,27,107,0.15)",
                  borderColor: "rgba(255,27,107,0.3)",
                },
              }}
            >
              <X color="#FF6FA5" size={18} />
            </IconButton>
          </Box>

          <Box
            sx={{
              display: "flex",
              gap: 2,
              cursor: "pointer",
              p: 1.2,
              borderRadius: 2,
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.05)",
              transition: "all 0.3s ease",
              "&:hover": {
                background: "rgba(255,27,107,0.08)",
                borderColor: "rgba(255,27,107,0.2)",
                transform: "translateX(4px)",
              },
            }}
            onClick={() => {
              router.push("/profile");
              setMobileMenuOpen(false);
            }}
          >
            <Avatar
              src={avatar || undefined}
              sx={{
                width: 44,
                height: 44,
                border: "2px solid #FF1B6B",
                borderRadius: "10px",
              }}
            >
              {!avatar && userName?.charAt(0)?.toUpperCase()}
            </Avatar>

            <Box sx={{ flex: 1 }}>
              <Typography color="white" fontWeight={700} fontSize="1rem">
                {userName}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "#FF6FA5",
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  fontWeight: 500,
                }}
              >
                View Profile
                <ArrowRight size={12} />
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            flex: 1,
            overflow: "auto",
            position: "relative",
            "&::-webkit-scrollbar": { width: 4 },
            "&::-webkit-scrollbar-track": { background: "rgba(255,255,255,0.02)" },
            "&::-webkit-scrollbar-thumb": {
              background: "rgba(255,27,107,0.3)",
              borderRadius: 2,
            },
          }}
        >
          <List sx={{ p: 1.2 }}>
            {navItems.map((item) => {
              const isActive = pathname === item.path;

              return (
                <ListItem key={item.label} disablePadding sx={{ mb: 1 }}>
                  <ListItemButton
                    onClick={() => {
                      pushedStateRef.current = false;
                      setMobileMenuOpen(false);
                      router.push(item.path);
                    }}
                    sx={{
                      borderRadius: 2,
                      px: 2,
                      py: 1.5,
                      background: isActive
                        ? "linear-gradient(135deg, rgba(255,27,107,0.2), rgba(255,111,165,0.1))"
                        : "transparent",
                      border: isActive
                        ? "1px solid rgba(255,27,107,0.3)"
                        : "1px solid transparent",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        background: "linear-gradient(135deg, rgba(255,27,107,0.15), rgba(255,111,165,0.05))",
                        borderColor: "rgba(255,27,107,0.2)",
                        transform: "translateX(4px)",
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 0,
                        background: isActive
                          ? "rgba(255,255,255,0.1)"
                          : "rgba(255,27,107,0.08)",
                        borderRadius: 2,
                        p: 1,
                        mr: 2,
                      }}
                    >
                      {typeof item.icon === "string" ? (
                        <img
                          src={item.icon}
                          alt={item.label}
                          width={20}
                          height={20}
                          style={{
                            filter: isActive ? "brightness(1.5)" : "brightness(1)",
                          }}
                        />
                      ) : (
                        <item.icon
                          size={20}
                          color={isActive ? "#FFD1E1" : "#FF6FA5"}
                        />
                      )}
                    </ListItemIcon>

                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        color: isActive ? "#FFD1E1" : "#FF9EC0",
                        fontWeight: isActive ? 700 : 600,
                        fontSize: "0.95rem",
                      }}
                    />

                    {item.label === "Messaging" && unreadCount > 0 && (
                      <Badge
                        badgeContent={unreadCount}
                        color="error"
                        sx={{
                          ml: "auto",
                          "& .MuiBadge-badge": {
                            bgcolor: "#FF1B6B",
                            color: "white",
                          },
                        }}
                      />
                    )}
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Box>

        <Box
          sx={{
            p: 2.5,
            borderTop: "1px solid rgba(255,255,255,0.05)",
            background: "linear-gradient(to top, rgba(10,10,20,0.98), rgba(20,10,30,0.95))",
            position: "sticky",
            bottom: 0,
            zIndex: 1,
          }}
        >
          <ListItem
            onClick={handleLogout}
            sx={{
              borderRadius: 2,
              cursor: "pointer",
              background: "linear-gradient(135deg, rgba(244,67,54,0.1), rgba(244,67,54,0.05))",
              border: "1px solid rgba(244,67,54,0.1)",
              "&:hover": {
                background: "linear-gradient(135deg, rgba(244,67,54,0.15), rgba(244,67,54,0.08))",
                transform: "translateX(4px)",
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 0, mr: 2 }}>
              <LogOut size={18} color="#F44336" />
            </ListItemIcon>
            <ListItemText
              primary="Logout"
              primaryTypographyProps={{
                sx: { color: "#F44336", fontWeight: 700 },
              }}
            />
          </ListItem>
        </Box>
      </Drawer>
    </>
  );
};

export default AppHeaderMobile;