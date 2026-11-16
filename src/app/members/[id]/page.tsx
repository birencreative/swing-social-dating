"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Card,
  Container,
  IconButton,
  Stack,
  Typography,
  ThemeProvider,
  createTheme,
} from "@mui/material";
import {
  ArrowLeft,
  Calendar,
  Camera,
  Eye,
  Fingerprint,
  Globe,
  Heart,
  Lock,
  MapPin,
  Palette,
  ShieldCheck,
  User,
} from "lucide-react";
import FlagIcon from "@mui/icons-material/Flag";
import BlockIcon from "@mui/icons-material/Block";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import { toast } from "react-toastify";

import AppFooterDesktop from "@/layout/AppFooterDesktop";
import AppHeaderDesktop from "@/layout/AppHeaderDesktop";
import Loader from "@/commonPage/Loader";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#0d0518",
      paper: "rgba(22, 12, 38, 0.75)",
    },
  },
  typography: {
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
  },
});

type Params = Promise<{ id: string }>;

export default function MemberProfilePage({ params }: { params: Params }) {
  const router = useRouter();
  const [id, setId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [advertiser, setAdvertiser] = useState<any>({});
  const [profileImages, setProfileImages] = useState<any[]>([]);
  const [privateImages, setPrivateImages] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [rsvp, setRsvp] = useState<any[]>([]);
  const [profileId, setProfileId] = useState<string | null>(null);

  useEffect(() => {
    const getIdFromParam = async () => {
      const resolvedParams = await params;
      if (resolvedParams?.id) {
        setId(resolvedParams.id);
      }
    };
    getIdFromParam();
  }, [params]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setProfileId(localStorage.getItem("logged_in_profile"));
    }
  }, []);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [userRes, imagesRes, privateRes, eventsRes, rsvpRes] = await Promise.all([
          fetch(`/api/user/sweeping/user?id=${id}`),
          fetch(`/api/user/sweeping/images/profile?id=${id}`),
          fetch(`/api/user/sweeping/images?id=${id}`),
          fetch(`/api/user/sweeping/events`),
          fetch(`/api/user/sweeping/rsvp?id=${id}`),
        ]);

        if (userRes.ok) {
          const userData = await userRes.json();
          setAdvertiser(userData?.user || {});
        }
        if (imagesRes.ok) {
          const imgData = await imagesRes.json();
          setProfileImages(imgData?.images || []);
        }
        if (privateRes.ok) {
          const privData = await privateRes.json();
          setPrivateImages(privData?.images || []);
        }
        if (eventsRes.ok) {
          const evData = await eventsRes.json();
          setEvents(evData?.events || []);
        }
        if (rsvpRes.ok) {
          const rsvpData = await rsvpRes.json();
          setRsvp(rsvpData?.rsvp || []);
        }
      } catch (err) {
        console.error("Error fetching profile details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleAddFriend = async () => {
    try {
      const res = await fetch("/api/user/profile/friend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: profileId, targetId: id }),
      });
      if (res.ok) {
        toast.success("Friend request sent 🎉");
      } else {
        toast.error("Could not send friend request.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong.");
    }
  };

  const handleBlockUser = async () => {
    try {
      const res = await fetch("/api/user/profile/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: profileId, targetId: id }),
      });
      if (res.ok) {
        toast.success("User has been blocked.");
        router.push("/members");
      } else {
        toast.error("Failed to block user.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong.");
    }
  };

  const cardStyle = {
    background: "rgba(22, 12, 38, 0.75)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "20px",
    overflow: "hidden",
    boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
  };

  const isVerified =
    advertiser?.selfie_verification_status === "true" ||
    advertiser?.selfie_verification_status === true ||
    advertiser?.is_verified === true;

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", background: "#0d0518", display: "flex", flexDirection: "column" }}>
        <AppHeaderDesktop />
        <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Loader />
        </Box>
        <AppFooterDesktop />
      </Box>
    );
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <Box
        sx={{
          minHeight: "100vh",
          width: "100%",
          backgroundColor: "#120820",
          background: "linear-gradient(135deg, #120820 0%, #0d0518 50%, #0a0415 100%)",
          position: "relative",
          overflow: "hidden",
          pb: { xs: 12, md: 8 },
        }}
      >
        {/* Top Right Glow Blob */}
        <Box
          sx={{
            position: "absolute",
            top: -130,
            right: -90,
            width: 270,
            height: 270,
            borderRadius: 270,
            backgroundColor: "rgba(194, 24, 91, 0.22)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        {/* Bottom Left Glow Blob */}
        <Box
          sx={{
            position: "absolute",
            bottom: -170,
            left: -110,
            width: 280,
            height: 280,
            borderRadius: 280,
            backgroundColor: "rgba(194, 24, 91, 0.15)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        <Box sx={{ position: "relative", zIndex: 1 }}>
          <AppHeaderDesktop />

          <Container maxWidth="md" sx={{ pt: { xs: 2, md: 14 }, pb: 6 }}>
            {/* 1. HERO BANNER CARD matching ProfileDetailsScreen */}
            <Card
              sx={{
                ...cardStyle,
                mb: 3,
                position: "relative",
                borderRadius: "24px",
              }}
            >
              <Box
                sx={{
                  position: "relative",
                  height: { xs: 280, sm: 320, md: 350 },
                  width: "100%",
                  background: "#000",
                  overflow: "hidden",
                }}
              >
                {/* Banner Image */}
                {advertiser?.ProfileBanner ? (
                  <Image
                    src={advertiser.ProfileBanner}
                    alt="Banner"
                    fill
                    priority
                    sizes="100vw"
                    style={{ objectFit: "cover", objectPosition: "center" }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: "100%",
                      height: "100%",
                      background: "linear-gradient(135deg, #1c0b34 0%, #120822 50%, #0d0518 100%)",
                    }}
                  />
                )}

                {/* Scrim Fade Overlay */}
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(to bottom, transparent 0%, rgba(13,5,24,0.65) 60%, #0d0518 100%)",
                  }}
                />

                {/* Floating Back Button */}
                <IconButton
                  onClick={() => router.back()}
                  sx={{
                    position: "absolute",
                    top: 16,
                    left: 16,
                    width: 42,
                    height: 42,
                    borderRadius: "50%",
                    background: "rgba(22, 12, 38, 0.75)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    color: "#FFF",
                    zIndex: 10,
                    "&:hover": { background: "rgba(22, 12, 38, 0.95)" },
                  }}
                >
                  <ArrowLeft size={20} />
                </IconButton>

                {/* Account Type Chip */}
                {advertiser?.AccountType && (
                  <Box
                    sx={{
                      position: "absolute",
                      bottom: 20,
                      right: 20,
                      px: 2,
                      py: 0.6,
                      borderRadius: "100px",
                      fontSize: "11px",
                      fontWeight: 800,
                      background: "rgba(255, 255, 255, 0.12)",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      backdropFilter: "blur(10px)",
                      color: "#FFF",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      zIndex: 3,
                    }}
                  >
                    {advertiser.AccountType}
                  </Box>
                )}

                {/* Overlayed Avatar & Info Details */}
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 16,
                    left: { xs: 16, sm: 24 },
                    right: { xs: 100, sm: 140 },
                    display: "flex",
                    alignItems: "flex-end",
                    gap: 2,
                    zIndex: 3,
                  }}
                >
                  {/* Avatar Circle with 3-Color Gradient Ring */}
                  <Box
                    sx={{
                      position: "relative",
                      width: { xs: 90, sm: 110 },
                      height: { xs: 90, sm: 110 },
                      borderRadius: "50%",
                      p: "3px",
                      background: "linear-gradient(135deg, #FF1B6B 0%, #7000FF 50%, #00D2FF 100%)",
                      flexShrink: 0,
                    }}
                  >
                    <Box
                      sx={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "50%",
                        overflow: "hidden",
                        position: "relative",
                        background: "#1a1a2e",
                      }}
                    >
                      <Image
                        src={advertiser?.Avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300"}
                        alt="Avatar"
                        fill
                        sizes="110px"
                        style={{ objectFit: "cover" }}
                      />
                    </Box>
                  </Box>

                  {/* Info Column */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    {isVerified && (
                      <Box
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 0.5,
                          px: 1,
                          py: 0.2,
                          borderRadius: "100px",
                          background: "rgba(0, 230, 118, 0.15)",
                          border: "1px solid rgba(0, 230, 118, 0.3)",
                          mb: 0.5,
                        }}
                      >
                        <ShieldCheck size={12} color="#00E676" />
                        <Typography sx={{ color: "#00E676", fontSize: "10px", fontWeight: 800 }}>VERIFIED</Typography>
                      </Box>
                    )}

                    <Typography
                      noWrap
                      sx={{
                        color: "#FFF",
                        fontWeight: 800,
                        fontSize: { xs: "1.25rem", sm: "1.5rem" },
                        lineHeight: 1.2,
                      }}
                    >
                      {advertiser?.Username || "User"}
                    </Typography>

                    <Typography sx={{ color: "#FFF", fontSize: "0.95rem", fontWeight: 700, mt: 0.3 }}>
                      {parseInt(advertiser?.Age) > 18
                        ? advertiser.Age
                        : advertiser?.DateOfBirth
                        ? new Date().getFullYear() - new Date(advertiser.DateOfBirth).getFullYear()
                        : ""}{" "}
                      <Box
                        component="span"
                        sx={{ color: advertiser?.Gender === "Female" ? "#FF2D95" : "#00D2FF" }}
                      >
                        {advertiser?.Gender === "Male" ? "M" : advertiser?.Gender === "Female" ? "F" : ""}
                      </Box>
                      {advertiser?.PartnerAge && (
                        <Box component="span" sx={{ color: "rgba(255,255,255,0.4)", ml: 1 }}>
                          | {advertiser.PartnerAge}{" "}
                          <Box
                            component="span"
                            sx={{ color: advertiser?.PartnerGender === "Female" ? "#FF2D95" : "#00D2FF" }}
                          >
                            {advertiser?.PartnerGender === "Male" ? "M" : advertiser?.PartnerGender === "Female" ? "F" : ""}
                          </Box>
                        </Box>
                      )}
                    </Typography>

                    {advertiser?.Location && (
                      <Stack direction="row" alignItems="center" spacing={0.5} mt={0.3}>
                        <MapPin size={13} color="rgba(255,255,255,0.6)" />
                        <Typography noWrap sx={{ color: "rgba(255,255,255,0.65)", fontSize: "0.82rem", fontWeight: 500 }}>
                          {advertiser.Location.replace(", USA", "")}
                        </Typography>
                      </Stack>
                    )}
                  </Box>
                </Box>
              </Box>
            </Card>

            {/* 2. ACTION BUTTONS ROW matching ProfileDetailsScreen */}
            <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
              <IconButton
                onClick={handleBlockUser}
                sx={{
                  width: 46,
                  height: 46,
                  borderRadius: "50%",
                  background: "rgba(22, 12, 38, 0.85)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#ff3366",
                  "&:hover": { background: "rgba(255, 51, 102, 0.15)" },
                }}
              >
                <FlagIcon sx={{ fontSize: 20 }} />
              </IconButton>

              <IconButton
                onClick={handleBlockUser}
                sx={{
                  width: 46,
                  height: 46,
                  borderRadius: "50%",
                  background: "rgba(22, 12, 38, 0.85)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#FF5252",
                  "&:hover": { background: "rgba(255, 82, 82, 0.15)" },
                }}
              >
                <BlockIcon sx={{ fontSize: 20 }} />
              </IconButton>

              <Button
                fullWidth
                onClick={() => router.push(`/messaging/${id}`)}
                startIcon={<ChatBubbleOutlineIcon />}
                sx={{
                  background: "linear-gradient(90deg, #FF1B6B 0%, #7000FF 100%)",
                  color: "#FFF",
                  fontWeight: 800,
                  fontSize: "0.95rem",
                  borderRadius: "100px",
                  py: 1.3,
                  px: 3,
                  textTransform: "none",
                  boxShadow: "0 4px 20px rgba(255, 27, 107, 0.3)",
                  whiteSpace: "nowrap",
                  "&:hover": { filter: "brightness(1.1)" },
                }}
              >
                Message {advertiser?.Username || "User"}
              </Button>

              <IconButton
                onClick={handleAddFriend}
                sx={{
                  width: 46,
                  height: 46,
                  borderRadius: "50%",
                  background: "rgba(22, 12, 38, 0.85)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#FF1B6B",
                  "&:hover": { background: "rgba(255, 27, 107, 0.15)" },
                }}
              >
                <PersonAddAlt1Icon sx={{ fontSize: 20 }} />
              </IconButton>
            </Stack>

            <Stack spacing={2.5}>
              {/* 3. TAGLINE CARD */}
              {advertiser?.Tagline && (
                <Card sx={{ ...cardStyle, p: { xs: 2, md: 2.5 } }}>
                  <Stack direction="row" alignItems="center" spacing={1.5} mb={1.5}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: "rgba(255, 27, 107, 0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <FormatQuoteIcon sx={{ color: "#FF1B6B", fontSize: 20 }} />
                    </Box>
                    <Typography sx={{ color: "rgba(255,255,255,0.6)", fontWeight: 700, fontSize: "0.78rem", letterSpacing: "1px" }}>
                      TAGLINE
                    </Typography>
                  </Stack>
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: "1.05rem",
                      color: "#FF6FA5",
                      fontStyle: "italic",
                      wordBreak: "break-word",
                      overflowWrap: "anywhere",
                    }}
                  >
                    "{advertiser.Tagline.replace(/<[^>]*>?/gm, "")}"
                  </Typography>
                </Card>
              )}

              {/* 4. ABOUT CARD */}
              {advertiser?.About && (
                <Card sx={{ ...cardStyle, p: { xs: 2, md: 2.5 } }}>
                  <Stack direction="row" alignItems="center" spacing={1.5} mb={1.5}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: "rgba(112, 0, 255, 0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <User size={18} color="#C084FC" />
                    </Box>
                    <Typography sx={{ color: "rgba(255,255,255,0.6)", fontWeight: 700, fontSize: "0.78rem", letterSpacing: "1px" }}>
                      ABOUT
                    </Typography>
                  </Stack>
                  <Typography
                    sx={{
                      color: "rgba(255,255,255,0.85)",
                      fontSize: "0.95rem",
                      lineHeight: 1.7,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {advertiser.About.replace(/<[^>]*>?/gm, "")}
                  </Typography>
                </Card>
              )}

              {/* 5. DETAILS CARD */}
              <Card sx={{ ...cardStyle, p: { xs: 2, md: 2.5 } }}>
                <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: "rgba(0, 210, 255, 0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Fingerprint size={18} color="#00D2FF" />
                  </Box>
                  <Typography sx={{ color: "#FFF", fontWeight: 800, fontSize: "1.1rem" }}>
                    Details
                  </Typography>
                </Stack>

                <Stack spacing={2}>
                  {[
                    { label: "Body type", value: advertiser?.BodyType, icon: <User size={16} color="rgba(255,255,255,0.5)" /> },
                    { label: "Hair color", value: advertiser?.HairColor, icon: <Palette size={16} color="rgba(255,255,255,0.5)" /> },
                    { label: "Eye color", value: advertiser?.EyeColor, icon: <Eye size={16} color="rgba(255,255,255,0.5)" /> },
                    { label: "Distance", value: advertiser?.miles ? `${advertiser.miles.toFixed(2)} mi` : advertiser?.Distance, icon: <MapPin size={16} color="rgba(255,255,255,0.5)" /> },
                    { label: "Orientation", value: advertiser?.SexualOrientation, icon: <Heart size={16} color="rgba(255,255,255,0.5)" /> },
                  ]
                    .filter((item) => !!item.value)
                    .map((item) => (
                      <Box
                        key={item.label}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          py: 0.8,
                          borderBottom: "1px solid rgba(255,255,255,0.06)",
                        }}
                      >
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          {item.icon}
                          <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.88rem", fontWeight: 500 }}>
                            {item.label}
                          </Typography>
                        </Stack>
                        <Typography sx={{ color: "#FFF", fontSize: "0.92rem", fontWeight: 800 }}>
                          {item.value}
                        </Typography>
                      </Box>
                    ))}
                </Stack>
              </Card>

              {/* 6. PHOTOS GALLERY */}
              {profileImages.length > 0 && (
                <Card sx={{ ...cardStyle, p: { xs: 2, md: 2.5 } }}>
                  <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: "rgba(255, 27, 107, 0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Camera size={18} color="#FF1B6B" />
                    </Box>
                    <Typography sx={{ color: "#FFF", fontWeight: 800, fontSize: "1.1rem" }}>
                      Public Photos
                    </Typography>
                  </Stack>

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)" },
                      gap: 1.5,
                    }}
                  >
                    {profileImages.map((img: any) => (
                      <Box
                        key={img.Id}
                        sx={{
                          aspectRatio: "3/4",
                          borderRadius: "16px",
                          overflow: "hidden",
                          position: "relative",
                          border: "2px solid rgba(255,255,255,0.08)",
                        }}
                      >
                        <Image src={img.Url} alt="Photo" fill sizes="200px" style={{ objectFit: "cover" }} />
                      </Box>
                    ))}
                  </Box>
                </Card>
              )}
            </Stack>
          </Container>

          <AppFooterDesktop />
        </Box>
      </Box>
    </ThemeProvider>
  );
}
