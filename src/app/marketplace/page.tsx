"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Container,
  useMediaQuery,
} from "@mui/material";
import {
  Storefront,
  ArrowBack,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import AppFooterMobile from "@/layout/AppFooterMobile";
import AppFooterDesktop from "@/layout/AppFooterDesktop";
import AppHeaderMobile from "@/layout/AppHeaderMobile";
import AppHeaderDesktop from "@/layout/AppHeaderDesktop";

const MarketplaceComingSoon: React.FC = () => {
  const router = useRouter();
  const isMobile = useMediaQuery("(max-width:900px)");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    // Keep analytics tracking intact
    const id = localStorage.getItem("logged_in_profile");
    const urlParams = new URLSearchParams(window.location.search);
    const aff = urlParams.get("aff");
    const refer = urlParams.get("refer");

    const getOS = () => {
      const userAgent = window.navigator.userAgent;
      if (userAgent.indexOf("Win") !== -1) return "Windows";
      if (userAgent.indexOf("Mac") !== -1) return "MacOS";
      if (userAgent.indexOf("Android") !== -1) return "Android";
      if (/iPad|iPhone|iPod/.test(userAgent)) return "iOS";
      if (userAgent.indexOf("Linux") !== -1) return "Linux";
      return "Unknown";
    };

    fetch("https://ipapi.co/json")
      .then((res) => res.json())
      .then((ipData) => {
        const payload = {
          affiliate: aff,
          referral: refer,
          OS: getOS(),
          page: "Marketplace Coming Soon",
          url: window.location.href,
          userid: id || null,
          ip: ipData?.ip,
          city: ipData?.city,
          region: ipData?.region,
          country_name: ipData?.country_name,
        };

        fetch("/api/user/tracking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).catch((err) => console.error("Failed to save tracking:", err));
      })
      .catch((err) => console.error("Failed to fetch IP:", err));
  }, []);

  if (!isClient) return null;

  return (
    <>
      {isMobile ? <AppHeaderMobile /> : <AppHeaderDesktop />}

      <Box
        sx={{
          minHeight: "calc(100vh - 160px)",
          background: "linear-gradient(160deg, #14071f 0%, #0a0412 100%)",
          color: "#ffffff",
          py: { xs: 8, md: 12 },
          px: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Container maxWidth="md" sx={{ textAlign: "center" }}>
          {/* Main Icon */}
          <Box
            sx={{
              display: "inline-flex",
              p: 2.5,
              borderRadius: "50%",
              background: "rgba(255, 45, 85, 0.12)",
              border: "1px solid rgba(255, 45, 85, 0.3)",
              mb: 3,
            }}
          >
            <Storefront sx={{ fontSize: { xs: 52, md: 64 }, color: "#FF2D55" }} />
          </Box>

          {/* Title */}
          <Typography
            variant="h2"
            component="h1"
            sx={{
              fontSize: { xs: "2.2rem", sm: "3.2rem", md: "3.8rem" },
              fontWeight: 700,
              color: "#ffffff",
              lineHeight: 1.2,
              mb: 2,
            }}
          >
            Marketplace is <span style={{ color: "#FF2D55" }}>Coming Soon</span>
          </Typography>

          {/* Subtitle */}
          <Typography
            variant="body1"
            sx={{
              fontSize: { xs: "1rem", sm: "1.15rem" },
              color: "#e0e0e0",
              maxWidth: "600px",
              mx: "auto",
              mb: 4.5,
              lineHeight: 1.6,
            }}
          >
            We are building a premium, secure lifestyle marketplace designed for the Swing Social community. Stay tuned for exciting updates!
          </Typography>

          {/* Back Button */}
          <Box>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => router.push("/home")}
              sx={{
                color: "#ffffff",
                background: "linear-gradient(45deg, #FF2D55, #7000FF)",
                borderRadius: "30px",
                px: 4,
                py: 1.2,
                textTransform: "none",
                fontWeight: 600,
                fontSize: "1rem",
                boxShadow: "none",
                "&:hover": {
                  background: "linear-gradient(45deg, #CC1439, #5200CC)",
                  boxShadow: "none",
                },
              }}
            >
              Back to Home
            </Button>
          </Box>
        </Container>
      </Box>

      <Box sx={{ height: { xs: "72px", sm: "80px" } }} />
      {isMobile ? <AppFooterMobile /> : <AppFooterDesktop />}
    </>
  );
};

export default MarketplaceComingSoon;
