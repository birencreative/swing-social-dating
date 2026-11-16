"use client";

import React from "react";
import { Box, Badge, useMediaQuery, useTheme } from "@mui/material";
import { usePathname, useRouter } from "next/navigation";
import { useSocketContext } from "@/context/SocketProvider";

const AppFooterMobile = () => {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const { unreadCount } = useSocketContext();

  if (!isMobile) return null;

  const navItems = [
    { label: "Home", path: "/home", icon: "/icons/home.png" },
    { label: "Members", path: "/members", icon: "/icons/members.png" },
    { label: "Pineapple", path: "/pineapple", icon: "/icons/pineapple.png" },
    { label: "Messaging", path: "/messaging", icon: "/icons/messaging.png" },
    { label: "Matches", path: "/matches", icon: "/icons/matches.png" },
  ];

  return (
    <Box
      sx={{
        position: "fixed",
        left: 6,
        right: 6,
        bottom: "env(safe-area-inset-bottom)",
        zIndex: 1200,
        pb: "12px", // original bottom breathing room
      }}
    >
      <Box
        sx={{
          height: 76,
          borderRadius: "28px",
          backgroundColor: "#160b24",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4)",
          backdropFilter: "blur(24px)",
        }}
      >
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          const isMessaging = item.path === "/messaging";

          return (
            <Box
              key={item.label}
              onClick={() => router.push(item.path)}
              sx={{
                width: 64,
                height: 64,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                borderRadius: "16px",
                transition: "transform 0.15s ease",
                "&:active": {
                  transform: "scale(0.88)",
                },
              }}
            >
              <Badge
                color="error"
                overlap="circular"
                badgeContent={
                  isMessaging && unreadCount > 0 ? unreadCount : null
                }
                sx={{
                  "& .MuiBadge-badge": {
                    fontSize: 10,
                    height: 18,
                    minWidth: 18,
                    top: 4,
                    right: 4,
                  },
                }}
              >
                <Box
                  sx={{
                    width: 58,
                    height: 58,
                    borderRadius: "26px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isActive
                      ? "rgba(194, 24, 91, 0.22)"
                      : "transparent",
                    border: isActive
                      ? "1px solid rgba(194, 24, 91, 0.5)"
                      : "none",
                    boxShadow: isActive
                      ? "0 4px 12px rgba(194,24,91,0.35)"
                      : "none",
                    transition: "all 0.2s ease",
                  }}
                >
                  <img
                    src={item.icon}
                    alt={item.label}
                    width={50}
                    height={50}
                    style={{
                      objectFit: "contain",
                      filter: isActive
                        ? "none"
                        : "grayscale(40%) brightness(0.9)",
                    }}
                  />
                </Box>
              </Badge>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default AppFooterMobile;