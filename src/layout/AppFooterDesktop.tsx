"use client";

import { useState } from "react";
import { Box, Container, IconButton, Typography, Stack, TextField, Button } from "@mui/material";
import { useRouter } from "next/navigation";
import {
  FacebookOutlined as FacebookIcon,
  Instagram as InstagramIcon,
  MailOutline as MailIcon,
  LocationOnOutlined as LocationIcon,
  Send as SendIcon,
} from "@mui/icons-material";

const AppFooterDesktop = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail("");
    setTimeout(() => {
      setSubscribed(false);
    }, 4000);
  };

  return (
    <Box
      component="footer"
      sx={{
        background: "linear-gradient(180deg, rgba(20, 10, 35, 0.45) 0%, rgba(10, 4, 18, 0.98) 100%)",
        color: "white",
        borderTop: "1px solid rgba(255, 255, 255, 0.06)",
        backdropFilter: "blur(20px)",
        py: { xs: 6, md: 8 },
        mt: "auto",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative subtle ambient lights */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: "10%",
          width: "150px",
          height: "150px",
          background: "radial-gradient(circle, rgba(255, 45, 85, 0.08) 0%, rgba(255, 45, 85, 0) 70%)",
          filter: "blur(40px)",
          pointerEvents: "none",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: 0,
          right: "10%",
          width: "200px",
          height: "200px",
          background: "radial-gradient(circle, rgba(112, 0, 255, 0.08) 0%, rgba(112, 0, 255, 0) 70%)",
          filter: "blur(50px)",
          pointerEvents: "none",
        }}
      />

      <Container maxWidth="lg">
        {/* Main Grid Content */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "1.5fr 1fr 1fr 1.5fr",
              lg: "2fr 1fr 1.2fr 1.8fr"
            },
            gap: { xs: 4, md: 6 },
            mb: 6,
          }}
        >
          {/* Brand Info */}
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                fontSize: "1.5rem",
                mb: 2,
                background: "linear-gradient(45deg, #FF2D55 0%, #7000FF 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                display: "inline-block",
                textShadow: "0 0 20px rgba(255, 45, 85, 0.15)",
                transition: "all 0.3s ease",
                cursor: "pointer",
                "&:hover": {
                  transform: "scale(1.02)",
                  textShadow: "0 0 25px rgba(255, 45, 85, 0.3)",
                }
              }}
              onClick={() => router.push("/home")}
            >
              SwingSocial
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "rgba(255, 255, 255, 0.6)",
                lineHeight: 1.6,
                mb: 3,
                maxWidth: "280px"
              }}
            >
              Connect, Learn, and Explore with Like-minded People in our vibrant community.
            </Typography>
            <Stack direction="row" spacing={1.5}>
              {[
                { icon: <FacebookIcon />, url: "https://facebook.com/swingsocial" },
                { icon: <InstagramIcon />, url: "https://instagram.com/swingsocial" }
              ].map((social, idx) => (
                <IconButton
                  key={idx}
                  href={social.url}
                  target="_blank"
                  sx={{
                    color: "rgba(255, 255, 255, 0.6)",
                    bgcolor: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "12px",
                    p: 1.25,
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    "&:hover": {
                      color: "#FF2D55",
                      bgcolor: "rgba(255, 45, 85, 0.05)",
                      borderColor: "rgba(255, 45, 85, 0.3)",
                      transform: "translateY(-4px)",
                      boxShadow: "0 4px 12px rgba(255, 45, 85, 0.15)",
                    },
                  }}
                >
                  {social.icon}
                </IconButton>
              ))}
            </Stack>
          </Box>

          {/* Quick Links */}
          <Box>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 700,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                color: "white",
                mb: 2.5,
                fontSize: "0.85rem",
                borderBottom: "2px solid rgba(255, 255, 255, 0.05)",
                pb: 1,
                display: "inline-block"
              }}
            >
              Quick Links
            </Typography>
            <Stack spacing={1.5}>
              {[
                { name: "Members", url: "/members", internal: true },
                { name: "Events", url: "/events", internal: true },
                { name: "Blog", url: "https://swingsocial.co/blog/", internal: false },
                { name: "Travel", url: "https://swingsocial.co/travel/", internal: false },
                { name: "Contact", url: "https://swingsocial.co/contact-us/", internal: false },
                { name: "Affiliate", url: "/earn-money-referrals", internal: true }
              ].map((item) => (
                <Typography
                  key={item.name}
                  variant="body2"
                  onClick={() =>
                    item.internal
                      ? router.push(item.url)
                      : window.open(item.url, "_blank")
                  }
                  sx={{
                    color: "rgba(255, 255, 255, 0.6)",
                    fontSize: "0.875rem",
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    "&:hover": {
                      color: "#FF2D55",
                      transform: "translateX(6px)",
                    },
                  }}
                >
                  {item.name}
                </Typography>
              ))}
            </Stack>
          </Box>

          {/* Contact Info */}
          <Box>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 700,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                color: "white",
                mb: 2.5,
                fontSize: "0.85rem",
                borderBottom: "2px solid rgba(255, 255, 255, 0.05)",
                pb: 1,
                display: "inline-block"
              }}
            >
              Contact Us
            </Typography>
            <Stack spacing={2}>
              <Box
                component="a"
                href="mailto:info@swingsocial.co"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  color: "rgba(255, 255, 255, 0.6)",
                  textDecoration: "none",
                  fontSize: "0.875rem",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    color: "#FF2D55",
                  },
                }}
              >
                <MailIcon sx={{ fontSize: "1.1rem", color: "#FF2D55" }} />
                info@swingsocial.co
              </Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 1.5,
                  color: "rgba(255, 255, 255, 0.6)",
                  fontSize: "0.875rem",
                }}
              >
                <LocationIcon sx={{ fontSize: "1.1rem", color: "#FF2D55", mt: 0.2 }} />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "white" }}>
                    ARLINGTON, VA
                  </Typography>
                  <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.4)" }}>
                    United States
                  </Typography>
                </Box>
              </Box>
            </Stack>
          </Box>

          {/* Stay Connected (Newsletter) */}
          <Box>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 700,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                color: "white",
                mb: 2.5,
                fontSize: "0.85rem",
                borderBottom: "2px solid rgba(255, 255, 255, 0.05)",
                pb: 1,
                display: "inline-block"
              }}
            >
              Stay Connected
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "rgba(255, 255, 255, 0.6)",
                lineHeight: 1.5,
                mb: 2.5,
                fontSize: "0.875rem"
              }}
            >
              Subscribe to receive updates on lifestyle cruises, hotel takeovers, and events.
            </Typography>
            <form onSubmit={handleSubscribe}>
              <Stack direction="row" spacing={1}>
                <TextField
                  placeholder="Enter your email"
                  variant="outlined"
                  size="small"
                  value={email}
                  disabled={subscribed}
                  onChange={(e) => setEmail(e.target.value)}
                  sx={{
                    flexGrow: 1,
                    "& .MuiOutlinedInput-root": {
                      color: "white",
                      bgcolor: "rgba(255, 255, 255, 0.03)",
                      borderRadius: "10px",
                      fontSize: "0.85rem",
                      height: "40px",
                      "& fieldset": {
                        borderColor: "rgba(255, 255, 255, 0.08)",
                      },
                      "&:hover fieldset": {
                        borderColor: "rgba(255, 255, 255, 0.2)",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#FF2D55",
                      },
                    },
                  }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  disabled={subscribed}
                  sx={{
                    background: "linear-gradient(45deg, #FF2D55 0%, #7000FF 100%)",
                    color: "white",
                    minWidth: "40px",
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    p: 0,
                    "&:hover": {
                      opacity: 0.9,
                    },
                  }}
                >
                  <SendIcon sx={{ fontSize: "1rem" }} />
                </Button>
              </Stack>
            </form>
            {subscribed && (
              <Typography
                variant="caption"
                sx={{
                  color: "#4caf50",
                  display: "block",
                  mt: 1,
                  fontWeight: 600,
                }}
              >
                Successfully subscribed! Thank you.
              </Typography>
            )}
          </Box>
        </Box>

        {/* Bottom copyright and legal links */}
        <Box
          sx={{
            pt: 4,
            borderTop: "1px solid rgba(255, 255, 255, 0.06)",
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: "rgba(255, 255, 255, 0.45)" }}
          >
            © 2026 SwingSocial. All rights reserved.
          </Typography>

          <Stack
            direction="row"
            spacing={2.5}
            useFlexGap
            flexWrap="wrap"
            justifyContent="center"
          >
            {[
              { name: "Privacy Policy", url: "https://swingsocial.co/privacy/" },
              { name: "Terms of Use", url: "https://swingsocial.co/terms-of-use/" },
              { name: "Refund Policy", url: "https://swingsocial.co/refund/" },
              { name: "Opt-Out", url: "https://swingsocial.co/optout/" }
            ].map((link) => (
              <Typography
                key={link.name}
                variant="caption"
                component="a"
                href={link.url}
                target="_blank"
                sx={{
                  color: "rgba(255, 255, 255, 0.45)",
                  textDecoration: "none",
                  transition: "color 0.2s ease",
                  "&:hover": {
                    color: "#FF2D55",
                  },
                }}
              >
                {link.name}
              </Typography>
            ))}
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};

export default AppFooterDesktop;
