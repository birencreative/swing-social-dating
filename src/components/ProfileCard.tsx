import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Avatar,
  Card,
  Grid,
  Paper,
  Chip,
  Stack,
  ImageList,
  ImageListItem,
  IconButton,
} from "@mui/material";
import {
  LocationOn,
  Cake,
  CameraAlt,
  VolunteerActivism,
  Interests,
  Message,
  Favorite,
} from "@mui/icons-material";
import { Dialog, DialogContent } from "@mui/material";
import { X } from "lucide-react";

interface UserProfile {
  Id: string;
  Age: number;
  Username: string;
  Avatar: string;
  ProfileBanner: string;
  Tagline: string;
  About: string;
  Location: string;
  Gender: string;
  PartnerGender: string;
  AccountType: string;
  DateOfBirth: Date;
  PartnerDateOfBirth: Date;
  LookingFor: string[];
  SwingStyleTags: string[];
  KinkTags: string[];
  galleryImages: string[];
}

interface ProfileCardProps {
  profile: UserProfile | null;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ profile }) => {
  const router = useRouter();
  const [profileImages, setProfileImages] = useState<any[]>([]);
  const [openImageModal, setOpenImageModal] = useState<boolean>(false);
  const [modalImageSrc, setModalImageSrc] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfileImages = async () => {
      if (profile?.Id) {
        try {
          const response = await fetch(
            `/api/user/sweeping/images/profile?id=${profile.Id}`,
          );
          const data = await response.json();
          setProfileImages(data?.images || []);
        } catch (error) {
          console.error("Error fetching profile images:", error);
        }
      }
    };

    fetchProfileImages();
  }, [profile?.Id]);

  const handleOpenImage = (src: string | null | undefined) => {
    if (!src) return;
    setModalImageSrc(src);
    setOpenImageModal(true);
  };

  const handleCloseImageModal = () => {
    setOpenImageModal(false);
    setModalImageSrc(null);
  };

  if (!profile) return null;

  return (
    <>
      <Card
        sx={{
          maxHeight: "calc(100vh - 160px)",
          height: "100%",
          maxWidth: { xs: 500, lg: 550, xl: 650 },
          background: "linear-gradient(160deg, #14071f 0%, #0a0412 100%)",
          borderRadius: 3,
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          overflow: "auto",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {/* Header Section */}
        <Box sx={{ position: "relative", height: 320 }}>
          <img
            src={profile.ProfileBanner ?? "/bannderDefault.jpg"}
            alt="Profile Banner"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />

          {/* Gradient overlay */}
          <Box
            sx={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "100%",
              background:
                "linear-gradient(to top, rgba(30,30,30,1) 0%, rgba(30,30,30,0.8) 30%, rgba(30,30,30,0) 100%)",
            }}
          />

          {/* Avatar */}
          <Avatar
            src={profile.Avatar ?? "/noavatar.png"}
            sx={{
              width: 120,
              height: 120,
              border: "4px solid #d81160",
              position: "absolute",
              bottom: -60,
              left: "50%",
              transform: "translateX(-50%)",
              cursor: "pointer",
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleOpenImage(profile.Avatar ?? "/noavatar.png");
            }}
          />
        </Box>

        {/* Main Content */}
        <Box sx={{ px: 4, pb: 4, pt: 8 }}>
          {/* Username & Age */}
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Typography
              variant="h4"
              sx={{
                color: "white",
                fontWeight: 700,
                mb: 1,
                letterSpacing: "-0.02em",
              }}
            >
              {profile.Username}
            </Typography>

            <Typography
              variant="h6"
              sx={{
                color: "#d81160",
                fontWeight: 600,
                mb: 1,
              }}
            >
              {profile?.DateOfBirth
                ? `${new Date().getFullYear() - new Date(profile.DateOfBirth).getFullYear()} ${profile?.Gender === "Male" ? "M" : profile?.Gender === "Female" ? "F" : ""}`
                : ""}
              {profile?.PartnerDateOfBirth && (
                <>
                  {" • "}
                  {new Date().getFullYear() -
                    new Date(profile.PartnerDateOfBirth).getFullYear()}
                  {profile?.PartnerGender === "Male"
                    ? "M"
                    : profile?.PartnerGender === "Female"
                      ? "F"
                      : ""}
                </>
              )}
            </Typography>
          </Box>

          {/* Tagline */}
          {profile?.Tagline && (
            <Typography
              variant="h6"
              dangerouslySetInnerHTML={{ __html: profile?.Tagline }}
              sx={{
                color: "#ff80ab",
                mb: 4,
                fontWeight: 500,
                fontSize: "1.2rem",
                lineHeight: 1.4,
                textAlign: "center",
              }}
            />
          )}

          {/* Action Chips */}
          <Stack
            direction="row"
            spacing={2}
            sx={{ mb: 4, justifyContent: "center" }}
          >
            <Chip
              icon={<LocationOn sx={{ color: "white !important" }} />}
              label={profile?.Location?.replace(", USA", "") ?? "Location"}
              size="medium"
              sx={{
                bgcolor: "rgba(255,255,255,0.1)",
                color: "white",
                fontWeight: 500,
                borderRadius: 2,
              }}
            />
            <Chip
              icon={<Cake sx={{ color: "white !important" }} />}
              label={`Age: ${new Date().getFullYear() - new Date(profile.DateOfBirth).getFullYear()} years`}
              size="medium"
              sx={{
                bgcolor: "rgba(255,255,255,0.1)",
                color: "white",
                fontWeight: 500,
                borderRadius: 2,
              }}
            />
            <Chip
              label={`Chat with ${profile?.Username}`}
              size="medium"
              sx={{
                bgcolor: "#d81160",
                color: "white",
                fontWeight: 600,
                cursor: "pointer",
                borderRadius: 2,
                "&:hover": {
                  bgcolor: "#b00d4e",
                  transform: "translateY(-2px)",
                  boxShadow: "0 4px 12px rgba(216,17,96,0.4)",
                },
              }}
              onClick={() => router.push(`/messaging/${profile?.Id}`)}
            />
          </Stack>

          {/* About Section */}
          {profile?.About && (
            <Paper
              sx={{
                p: 3,
                mb: 4,
                bgcolor: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 2,
              }}
            >
              <Typography
                variant="body1"
                dangerouslySetInnerHTML={{ __html: profile?.About }}
                sx={{
                  color: "rgba(255,255,255,0.9)",
                  lineHeight: 1.7,
                }}
              />
            </Paper>
          )}

          {/* Key Info Cards */}
          <Grid container spacing={3}>
            {/* Photo Gallery */}
            <Grid item xs={12}>
              <Paper
                sx={{
                  p: 3,
                  bgcolor: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 2,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    color: "white",
                    mb: 3,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    fontWeight: 600,
                  }}
                >
                  <CameraAlt sx={{ color: "#d81160" }} />
                  Photo Gallery
                </Typography>

                {profileImages.length > 0 ? (
                  <ImageList cols={3} gap={8} rowHeight={140}>
                    {profileImages.slice(0, 6).map((image, index) => (
                      <ImageListItem
                        key={`${image?.Url}-${index}`}
                        sx={{
                          cursor: "pointer",
                          borderRadius: 1.5,
                          overflow: "hidden",
                          transition: "all 0.3s",
                          "&:hover": {
                            transform: "scale(1.03)",
                            boxShadow: "0 8px 24px rgba(216,17,96,0.3)",
                          },
                        }}
                        onClick={() => handleOpenImage(image.Url)}
                      >
                        <img
                          src={image.Url || "/noavatar.png"}
                          alt={`Gallery ${index + 1}`}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      </ImageListItem>
                    ))}
                  </ImageList>
                ) : (
                  <Typography
                    variant="body2"
                    sx={{
                      color: "rgba(255,255,255,0.5)",
                      fontStyle: "italic",
                      textAlign: "center",
                      py: 4,
                    }}
                  >
                    No Photos Provided
                  </Typography>
                )}
              </Paper>
            </Grid>

            {/* Looking For & Interests */}
            <Grid item xs={12}>
              <Stack spacing={3}>
                {/* Looking For Section */}
                <Paper
                  sx={{
                    p: 3,
                    bgcolor: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 2,
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      color: "white",
                      mb: 2.5,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      fontWeight: 600,
                    }}
                  >
                    <Favorite sx={{ color: "#d81160" }} />
                    Looking For
                  </Typography>

                  {profile.LookingFor?.length > 0 ? (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                      {profile.LookingFor.map((item, idx) => (
                        <Chip
                          key={`${item}-${idx}`}
                          label={item}
                          size="medium"
                          sx={{
                            bgcolor: "rgba(216,17,96,0.2)",
                            color: "#ff80ab",
                            border: "1px solid rgba(216,17,96,0.3)",
                            fontWeight: 500,
                          }}
                        />
                      ))}
                    </Box>
                  ) : (
                    <Typography
                      variant="body2"
                      sx={{
                        color: "rgba(255,255,255,0.5)",
                        fontStyle: "italic",
                      }}
                    >
                      No preferences specified
                    </Typography>
                  )}
                </Paper>

                {/* Swing Styles Section */}
                <Paper
                  sx={{
                    p: 3,
                    bgcolor: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 2,
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      color: "white",
                      mb: 2,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      fontWeight: 600,
                    }}
                  >
                    <Interests sx={{ color: "#d81160" }} />
                    Swing Styles
                  </Typography>

                  {profile.SwingStyleTags?.length > 0 ? (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                      {profile.SwingStyleTags.map((tag, idx) => (
                        <Chip
                          key={`${tag}-${idx}`}
                          label={tag}
                          size="medium"
                          sx={{
                            bgcolor: "rgba(216,17,96,0.2)",
                            color: "#ff80ab",
                            border: "1px solid rgba(216,17,96,0.3)",
                            fontWeight: 500,
                          }}
                        />
                      ))}
                    </Box>
                  ) : (
                    <Typography
                      variant="body2"
                      sx={{
                        color: "rgba(255,255,255,0.5)",
                        fontStyle: "italic",
                      }}
                    >
                      No styles specified
                    </Typography>
                  )}
                </Paper>
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </Card>

      <Dialog
        open={openImageModal}
        onClose={handleCloseImageModal}
        maxWidth="lg"
        fullWidth
        disableScrollLock={false}
        PaperProps={{
          sx: {
            backgroundColor: "rgba(0,0,0,0.95)",
            boxShadow: "none",
            borderRadius: 2,
            overflow: "hidden",
          },
        }}
      >
        <DialogContent
          sx={{
            p: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.95)",
            minHeight: "400px",
          }}
        >
          <IconButton
            onClick={handleCloseImageModal}
            sx={{
              position: "absolute",
              top: 16,
              right: 16,
              color: "white",
              backgroundColor: "rgba(0,0,0,0.6)",
              "&:hover": {
                backgroundColor: "rgba(255,255,255,0.2)",
              },
              zIndex: 2,
            }}
          >
            <X size={24} />
          </IconButton>
          {modalImageSrc && (
            <img
              src={modalImageSrc}
              alt="Full View"
              style={{
                width: "100%",
                height: "auto",
                maxHeight: "90vh",
                objectFit: "contain",
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProfileCard;
