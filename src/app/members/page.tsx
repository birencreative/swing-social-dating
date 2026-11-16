"use client";
import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Modal,
  Button,
  Checkbox,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Container,
  CircularProgress,
  IconButton,
  Chip,
  Stack,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import { Flag, Info } from "@mui/icons-material";
import TinderCard from "react-tinder-card";
import { useRouter } from "next/navigation";
import InstructionModal from "@/components/InstructionModal";
import UserProfileModal from "@/components/UserProfileModal";
import { toast } from "react-toastify";
import MobileSweaping from "@/components/MobileSweaping";
import { useMediaQuery } from "@mui/material";
import ProfileCard from "@/components/ProfileCard";
import { jwtDecode } from "jwt-decode";
import ProfileImgCheckerModel from "@/components/ProfileImgCheckerModel";
import AppHeaderDesktop from "@/layout/AppHeaderDesktop";
import Loader from "@/commonPage/Loader";
import { useLocation } from "@/hooks/useLocation";
import BoltIcon from "@mui/icons-material/Bolt";
import FavoriteIcon from "@mui/icons-material/Favorite";
import { motion } from "framer-motion";
import { RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { getProfilePhotos, getOptimizedImageUrl } from "@/utils/profileUtils";

interface Profile {
  Id: string;
  Username: string;
  Avatar?: string;
  Location?: string;
  Tagline?: string;
  DateOfBirth: string;
  Gender: string;
  PartnerDateOfBirth: string;
  PartnerGender: string;
  About: string;
  SwingStyleTags: string[];
}

interface CardDimensions {
  width: number;
  height: number;
  imageHeight: number;
}

interface ButtonSizes {
  size: number;
  iconSize: number;
}

// Modern Card Component
interface CardModernProps {
  profile: Profile;
}

interface ActionButtonsProps {
  buttonSizes: ButtonSizes;
  handleButtonSwipe: (direction: "left" | "right" | "down") => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  buttonSizes,
  handleButtonSwipe,
}) => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "center",
      gap: 4,
      mt: 2,
      mb: 1,
      width: "100%",
    }}
  >
    {[
      { dir: "left" as const, src: "/swiping-card/no.svg", tooltip: "Nope" },
      { dir: "right" as const, src: "/swiping-card/like.svg", tooltip: "Like" },
    ].map(({ dir, src, tooltip }) => (
      <Tooltip key={dir} title={tooltip}>
        <IconButton
          onClick={() => handleButtonSwipe(dir)}
          sx={{
            width: `${buttonSizes.size}px`,
            height: `${buttonSizes.size}px`,
            bgcolor: "rgba(255,255,255,0.05)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#ff4d6d",
            transition: "all 0.3s ease",
            "&:hover": {
              transform: "translateY(-4px) scale(1.1)",
              background: "linear-gradient(135deg, #ff4d6d, #ff758c)",
              color: "#fff",
              boxShadow: "0 8px 20px rgba(255,77,109,0.4)",
            },
          }}
        >
          <Box
            component="img"
            src={src}
            sx={{
              width: `${buttonSizes.iconSize}px`,
              height: `${buttonSizes.iconSize}px`,
            }}
          />
        </IconButton>
      </Tooltip>
    ))}
  </Box>

);

export default function Home() {
  const [userProfiles, setUserProfiles] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [swipeDirection, setSwipeDirection] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [showDetail, setShowDetail] = useState<any>(false);
  const [selectedUserId, setSelectedUserId] = useState<any>(null);
  const [profileId, setProfileId] = useState<any>(null);
  const [showMatchPopup, setShowMatchPopup] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [matchesOpen, setMatchesOpen] = useState(false);
  const [showLimitPopup, setShowLimitPopup] = useState(false);
  const [showEndPopup, setShowEndPopup] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState<any>(null);
  const [swipeCount, setSwipeCount] = useState(0);
  const [selectedUserProfile, setSelectedUserProfile] = useState<any>(null);
  const [dailyLimit, setDailyLimit] = useState(30);
  const [membership, setMembership] = useState(0);
  const [reportOptions, setReportOptions] = useState({
    reportUser: false,
    blockUser: false,
    reportImage: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [id, setId] = useState("");
  const [memberalarm, setMemberAlarm] = useState("0");
  const [lastDeniedProfile, setLastDeniedProfile] = useState<any | null>(null);

  const handleUndo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => Math.max(0, prev - 1));
      setLastDeniedProfile(null);
    }
  }, [currentIndex]);

  const router = useRouter();
  const isMobile = useMediaQuery("(max-width: 900px)") ? true : false;
  const isSmallDesktop = useMediaQuery("(max-width: 1366px)");
  const isMediumDesktop = useMediaQuery("(max-width: 1600px)");
  const isLargeDesktop = useMediaQuery("(min-width: 1920px)");
  const refs = useRef<{ [key: string]: React.RefObject<any> }>({});
  const [idParam, setIdparam] = useState<any>(null);

  const getAge = (dob?: string) => {
    if (!dob) return null;
    return new Date().getFullYear() - new Date(dob).getFullYear();
  };

  useEffect(() => {
    if (userProfiles.length > 0) {
      setLoading(false);
    }
  }, [userProfiles]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("loginInfo");
      const count = localStorage.getItem("memberalarm");
      setMemberAlarm(count ?? "0");

      if (token) {
        const decodeToken = jwtDecode<any>(token);
        if (decodeToken.profileId) {
          setProfileId(decodeToken.profileId);
          fetchCurrentLoginProfileId(decodeToken.profileId);
          fetchAllUserProfiles(decodeToken.profileId);
        }
        setMembership(decodeToken.membership);
      } else {
        router.push("/login");
      }
    }
  }, []);

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    var param = queryParams.get("q");

    setIdparam(param);

    if (userProfiles?.length > 0) {
      if (param != null) {
        fetchCurrentProfileInfo(param);

        if (param && !refs.current[param]) {
          refs.current[param] = React.createRef();
        }
      } else {
        fetchCurrentProfileInfo(userProfiles[currentIndex]?.Id);
      }
    }
  }, [currentIndex, userProfiles]);

  // Preload upcoming swiping card images in background for instant card renders
  useEffect(() => {
    if (!userProfiles || userProfiles.length === 0) return;
    const nextProfiles = userProfiles.slice(currentIndex + 1, currentIndex + 4);
    nextProfiles.forEach((prof) => {
      const photos = getProfilePhotos(prof);
      const url = photos[0] || prof?.Avatar;
      if (url && typeof window !== "undefined") {
        const img = new window.Image();
        img.src = getOptimizedImageUrl(url);
      }
    });
  }, [currentIndex, userProfiles]);

  const fetchCurrentProfileInfo = async (currentProfileId: any) => {
    if (currentProfileId) {
      try {
        const response = await fetch(
          `/api/user/sweeping/user?id=${currentProfileId}`,
        );
        if (!response.ok) {
          console.error(
            "Failed to fetch advertiser data:",
            response.statusText,
          );
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const { user: advertiserData } = await response.json();
        if (!advertiserData) {
          console.error("Advertiser not found");
        } else {
          setSelectedUserProfile(advertiserData);
        }
      } catch (error: any) {
        console.error("Error fetching data:", error.message);
      } finally {
      }
    }
  };

  const fetchCurrentLoginProfileId = async (currentLoginProfileId: string) => {
    if (currentLoginProfileId) {
      try {
        const response = await fetch(
          `/api/user/sweeping/user?id=${currentLoginProfileId}`,
        );
        if (!response.ok) {
          console.error(
            "Failed to fetch advertiser data:",
            response.statusText,
          );
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const { user: advertiserData } = await response.json();
        if (!advertiserData) {
          console.error("Advertiser not found");
        } else {
          setSwipeCount(advertiserData?.SwipeCount);
          setDailyLimit(Math.max(parseInt(advertiserData?.SwipeMax) || 30, 30));
          if (
            parseInt(advertiserData?.SwipeCount) >=
            parseInt(advertiserData?.SwipeMax)
          ) {
          }
        }
      } catch (error: any) {
        console.error("Error fetching data:", error.message);
      } finally {
      }
    }
  };

  const fetchAllUserProfiles = async (userid: any) => {
    if (typeof window !== "undefined") {
      try {
        const cached = sessionStorage.getItem("cached_user_swipes_" + userid);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setUserProfiles(parsed);
            setLoading(false);
          }
        }
      } catch (e) {}
    }

    try {
      const response = await fetch("/api/user/sweeping/swipes?id=" + userid, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      const profiles = data?.swipes || [];

      setUserProfiles(profiles);
      if (typeof window !== "undefined" && profiles.length > 0) {
        try {
          sessionStorage.setItem("cached_user_swipes_" + userid, JSON.stringify(profiles));
        } catch (e) {}
      }
      if (data?.totalRows !== undefined && data.totalRows <= 0) {
        setShowEndPopup(true);
      } else if (profiles.length === 0) {
        setShowEndPopup(true);
      }
    } catch (error) {
      console.error("Error fetching user profiles:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (direction: string) => {
    const currentSwipedProfile = userProfiles[currentIndex];
    if (direction === "left") {
      setLastDeniedProfile(currentSwipedProfile);
    } else {
      setLastDeniedProfile(null);
    }

    if (currentIndex + 1 >= userProfiles.length) {
      setShowEndPopup(true);
    }

    if (idParam != null) {
      router.push("/members");
    }

    const processSwipe = async (status: "Denied" | "Liked" | "Maybe") => {
      await handleUpdateCategoryRelation(status);
      if (status === "Liked") await handleUpdateLikeMatch();
      setSwipeCount((prev) => prev + 1);
    };

    const endSwipe = () => {
      setTimeout(() => {
        setSwipeDirection(null);
        setCurrentIndex((prev) => prev + 1);
      }, 500);
    };

    setSwipeDirection(direction);

    if (swipeCount >= dailyLimit) {
      if (membership === 1) {
        switch (direction) {
          case "left":
            await processSwipe("Denied");
            break;
          case "right":
            await processSwipe("Liked");
            break;
          case "down":
            await processSwipe("Maybe");
            break;
        }
        endSwipe();
      } else {
        setShowLimitPopup(true);
        endSwipe();
      }
    } else {
      switch (direction) {
        case "left":
          await processSwipe("Denied");
          break;
        case "right":
          await processSwipe("Liked");
          break;
        case "down":
          await processSwipe("Maybe");
          break;
      }
      endSwipe();
    }
  };

  const handleButtonSwipe = async (direction: "left" | "right" | "down") => {
    const currentProfile =
      idParam && selectedUserProfile
        ? selectedUserProfile
        : userProfiles[currentIndex];

    if (!currentProfile) return;

    const cardRef = refs.current[currentProfile.Id]?.current;

    if (!cardRef) {
      console.error("Card ref not found");
      return;
    }

    try {
      await cardRef.swipe(direction);
    } catch (err) {
      console.error("Swipe failed:", err);
    }
  };

  const handleGrantAccess = async () => {
    try {
      const checkResponse = await fetch("/api/user/sweeping/grant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profileid: profileId,
          targetid: userProfiles[currentIndex]?.Id,
        }),
      });

      const checkData = await checkResponse.json();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleUpdateCategoryRelation = async (category: any) => {
    try {
      const checkResponse = await fetch("/api/user/sweeping/relation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pid: profileId,
          targetid: userProfiles[currentIndex]?.Id,
          newcategory: category,
        }),
      });

      const checkData = await checkResponse.json();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const sendNotification = async (message: string) => {
    if (!id) return;

    const response = await fetch("/api/user/notification/requestfriend", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: id,
        title: "❤️ New Match!",
        body: message,
        type: "new_match",
        url: `https://app.swingsocial.co/members/${profileId}`,
      }),
    });

    return await response.json();
  };

  const handleUpdateLikeMatch = async () => {
    try {
      if (idParam != null) {
        const response = await fetch("/api/user/sweeping/match", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ profileid: profileId, targetid: idParam }),
        });

        const username = localStorage.getItem("profileUsername");
        const data = await response.json();

        if (data?.isMatch == 1) {
          setMatchedProfile(userProfiles[currentIndex]);
          setShowMatchPopup(true);
          setId(idParam);
          // sendNotification(`You have a new match with ${username}!`);
        }
      } else {
        const response = await fetch("/api/user/sweeping/match", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            profileid: profileId,
            targetid: userProfiles[currentIndex]?.Id,
          }),
        });

        const username = localStorage.getItem("profileUsername");
        const data = await response.json();

        if (data?.isMatch == 1) {
          setMatchedProfile(userProfiles[currentIndex]);
          setShowMatchPopup(true);
          setId(userProfiles[currentIndex]?.Id);
          // sendNotification(`You have a new match with ${username}!`);
        }
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleClose = () => {
    setShowDetail(false);
    setSelectedUserId(null);
    if (window.history.state?.modal === "userProfile") {
      window.history.back();
    }
  };

  const handleReportModalToggle = () => {
    setIsReportModalOpen((prev) => !prev);
  };

  const handleOpenPref = () => {
    router.push("/prefrences");
  };

  const handleCheckboxChange = (event: any) => {
    const { name, checked } = event.target;
    setReportOptions((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const reportImageApi = async ({
    reportedById,
    reportedByName,
    reportedUserId,
    reportedUserName,
    image,
  }: {
    reportedById: string;
    reportedByName: string;
    reportedUserId: string;
    reportedUserName: string;
    image: string;
  }) => {
    try {
      const response = await fetch("/api/user/reportedUser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportedById,
          reportedByName,
          reportedUserId,
          reportedUserName,
          image,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data?.message || "Failed to report image.");
        return false;
      }

      toast.success("Image reported successfully!");
      return true;
    } catch (err) {
      console.error("Error reporting image:", err);
      toast.error("Error reporting image.");
      return false;
    }
  };

  const handleReportSubmit = useCallback(async () => {
    setIsSubmitting(true);
    const token = localStorage.getItem("loginInfo");
    const decodeToken = token ? jwtDecode<any>(token) : {};
    const reportedByName = decodeToken?.profileName || "Me";

    try {
      if (reportOptions.reportImage) {
        await reportImageApi({
          reportedById: profileId,
          reportedByName,
          reportedUserId: userProfiles[currentIndex]?.Id,
          reportedUserName: userProfiles[currentIndex]?.Username,
          image: userProfiles[currentIndex]?.Avatar,
        });
      }

      if (reportOptions.reportUser || reportOptions.blockUser) {
        const res = await fetch("/api/user/sweeping/report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            profileid: profileId,
            targetid: userProfiles[currentIndex]?.Id,
          }),
        });

        if (!res.ok) {
          toast.error("Failed to report user.");
          return null;
        }

        await res.json();
        toast.success("User reported successfully");
      }

      if (
        reportOptions.reportImage ||
        reportOptions.reportUser ||
        reportOptions.blockUser
      ) {
        setIsReportModalOpen(false);
        setReportOptions({
          reportUser: false,
          blockUser: false,
          reportImage: false,
        });
      }
    } catch (err) {
      toast.error("An error occurred while reporting.");
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [profileId, reportOptions]);

  const handleChatAction = () => {
    router.push(`/messaging/${id}`);
  };

  useLocation(profileId);

  const getCardDimensions = () => {
    if (isSmallDesktop) {
      return { width: 330, height: 430, imageHeight: 250 };
    } else if (isMediumDesktop) {
      return { width: 350, height: 460, imageHeight: 270 };
    } else if (isLargeDesktop) {
      return { width: 400, height: 500, imageHeight: 300 };
    }
    return { width: 360, height: 470, imageHeight: 280 };
  };

  const cardDimensions = getCardDimensions();

  const CardModern: React.FC<CardModernProps> = ({ profile }) => {
    const photos = useMemo(() => getProfilePhotos(profile), [profile]);
    const [cardImgIndex, setCardImgIndex] = useState(0);

    useEffect(() => {
      setCardImgIndex(0);
    }, [profile?.Id]);

    const currentImgUrl = useMemo(() => {
      const raw = photos[cardImgIndex] || profile?.Avatar || "/noavatar.png";
      return getOptimizedImageUrl(raw);
    }, [photos, cardImgIndex, profile?.Avatar]);

    return (
      <Card
        sx={{
          width: `${cardDimensions.width}px`,
          height: `${cardDimensions.height}px`,
          maxHeight: "calc(100vh - 250px)",
          borderRadius: "20px",
          overflow: "hidden",
          position: "relative",
          background: "linear-gradient(180deg, #180b28 0%, #0d0517 100%)",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Image Container */}
        <Box
          sx={{
            width: "100%",
            height: `${cardDimensions.imageHeight}px`,
            flexShrink: 0,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Top photo progress indicators */}
          {photos.length > 1 && (
            <Box
              sx={{
                position: "absolute",
                top: 8,
                left: 12,
                right: 12,
                display: "flex",
                gap: 0.8,
                zIndex: 15,
              }}
            >
              {photos.map((_, idx) => (
                <Box
                  key={idx}
                  sx={{
                    flex: 1,
                    height: 3,
                    borderRadius: 2,
                    backgroundColor: idx === cardImgIndex ? "#FF2D55" : "rgba(255,255,255,0.4)",
                    boxShadow: idx === cardImgIndex ? "0 0 6px rgba(255,45,85,0.8)" : "none",
                    transition: "all 0.3s ease",
                  }}
                />
              ))}
            </Box>
          )}

          <Avatar
            src={currentImgUrl}
            alt={profile.Username}
            variant="square"
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              border: "2px solid rgba(255,255,255,0.35)",
              borderRadius: "20px 20px 0 0",
              filter: "brightness(1.05) contrast(1.1)",
              transition: "all 0.3s ease",
            }}
          />

          {/* Previous photo button */}
          {photos.length > 1 && cardImgIndex > 0 && (
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                setCardImgIndex((prev) => prev - 1);
              }}
              sx={{
                position: "absolute",
                left: 8,
                top: "50%",
                transform: "translateY(-50%)",
                bgcolor: "rgba(20, 10, 35, 0.7)",
                color: "#fff",
                zIndex: 14,
                width: 34,
                height: 34,
                backdropFilter: "blur(6px)",
                border: "1px solid rgba(255,255,255,0.2)",
                "&:hover": { bgcolor: "rgba(20, 10, 35, 0.95)", transform: "translateY(-50%) scale(1.1)" },
              }}
            >
              <ChevronLeft size={20} />
            </IconButton>
          )}

          {/* Next photo button */}
          {photos.length > 1 && cardImgIndex < photos.length - 1 && (
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                setCardImgIndex((prev) => prev + 1);
              }}
              sx={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                bgcolor: "rgba(20, 10, 35, 0.7)",
                color: "#fff",
                zIndex: 14,
                width: 34,
                height: 34,
                backdropFilter: "blur(6px)",
                border: "1px solid rgba(255,255,255,0.2)",
                "&:hover": { bgcolor: "rgba(20, 10, 35, 0.95)", transform: "translateY(-50%) scale(1.1)" },
              }}
            >
              <ChevronRight size={20} />
            </IconButton>
          )}

        {/* Swipe Indicators */}
        {swipeDirection && (
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 10,
              pointerEvents: "none",
              filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.7))",
            }}
          >
            {swipeDirection === "left" && (
              <Box
                component="img"
                src="/delete.png"
                sx={{ width: 100, height: 100 }}
              />
            )}
            {swipeDirection === "right" && (
              <Box
                component="img"
                src="/like.png"
                sx={{ width: 100, height: 100 }}
              />
            )}
            {swipeDirection === "down" && (
              <Box
                component="img"
                src="/maybe.png"
                sx={{ width: 100, height: 100 }}
              />
            )}
          </Box>
        )}

        <IconButton
          onClick={handleOpenPref}
          sx={{
            position: "absolute",
            top: 14,
            left: 14,
            width: 36,
            height: 36,
            bgcolor: "rgba(114, 114, 148, 0.5)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            borderRadius: "50%",
            zIndex: 10,
            "&:hover": {
              bgcolor: "rgba(114, 114, 148, 0.65)",
            },
          }}
        >
          <img
            src="/swiping-card/preferences.svg"
            alt="preferences"
            style={{
              width: 16,
              height: 16,
              objectFit: "contain",
            }}
          />
        </IconButton>

        <IconButton
          onClick={() => {
            setShowDetail(true);
            setSelectedUserId(profile.Id);
            window.history.pushState({ modal: "userProfile" }, "");
          }}
          sx={{
            position: "absolute",
            top: 14,
            right: 14,
            width: 36,
            height: 36,
            bgcolor: "rgba(114, 114, 148, 0.5)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            zIndex: 10,
            justifyContent: "center",
            padding: 0,
            "&:hover": {
              bgcolor: "rgba(114, 114, 148, 0.65)",
            },
          }}
        >
          <Box
            component="img"
            src="/swiping-card/info.svg"
            alt="info button"
            sx={{
              width: 18,
              height: 18,
              display: "block",
            }}
          />
        </IconButton>

        <IconButton
          onClick={handleReportModalToggle}
          sx={{
            position: "absolute",
            bottom: 14,
            right: 14,
            width: 36,
            height: 36,
            bgcolor: "rgba(114, 114, 148, 0.5)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            borderRadius: "50%",
            display: "flex",
            zIndex: 10,
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            "&:hover": {
              bgcolor: "rgba(114, 114, 148, 0.65)",
            },
          }}
        >
          <Box
            component="img"
            src="/swiping-card/flag.svg"
            alt="info button"
            sx={{
              width: 16,
              height: 16,
              display: "block",
            }}
          />
        </IconButton>
      </Box>

      {/* Profile Info */}
      <Box
        sx={{
          px: 2.5,
          pt: 1.5,
          pb: 2.5,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box
          onClick={() => {
            setShowDetail(true);
            setSelectedUserId(profile?.Id);
            window.history.pushState({}, "");
          }}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            mb: "8px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            justifyContent: "center",
            zIndex: 10,
          }}
        >
          <Typography
            sx={{
              fontSize: { xs: "1.15rem", md: "1.25rem" },
              fontWeight: 800,
              color: "#FF2D55",
              lineHeight: 1.2,
              maxWidth: "100%",
              textAlign: "center",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flexShrink: 1,
              minWidth: 0,
              letterSpacing: "0",
            }}
          >
            {profile.Username},
          </Typography>

          {profile?.DateOfBirth && profile?.Gender && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                flexShrink: 0,
              }}
            >
              <Typography
                sx={{
                  fontSize: { xs: "1.05rem", md: "1.15rem" },
                  fontWeight: 700,
                  color: "#FFFFFF",
                  lineHeight: 1.2,
                  letterSpacing: "0",
                }}
              >
                {getAge(profile.DateOfBirth)}
              </Typography>

              <Box
                component="img"
                src={
                  profile.Gender === "Male"
                    ? "/swiping-card/male.svg"
                    : "/swiping-card/female.svg"
                }
                alt={profile.Gender}
                sx={{ width: 14, height: 14 }}
              />
            </Box>
          )}

          {profile?.PartnerDateOfBirth && profile?.PartnerGender && (
            <Box
              component="img"
              src="/swiping-card/separator.svg"
              alt="|"
              sx={{
                width: 2,
                height: 22,
                objectFit: "cover",
                objectPosition: "center",
                display: "block",
                flexShrink: 0,
                mx: "3px",
              }}
            />
          )}

          {profile?.PartnerDateOfBirth && profile?.PartnerGender && (
            <>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  flexShrink: 0,
                }}
              >
                <Typography
                  sx={{
                    fontSize: { xs: "1.05rem", md: "1.15rem" },
                    fontWeight: 700,
                    color: "#FFFFFF",
                    lineHeight: 1.2,
                    letterSpacing: "0",
                  }}
                >
                  {getAge(profile.PartnerDateOfBirth)}
                </Typography>

                <Box
                  component="img"
                  src={
                    profile.PartnerGender === "Male"
                      ? "/swiping-card/male.svg"
                      : "/swiping-card/female.svg"
                  }
                  alt={profile.PartnerGender}
                  sx={{ width: 14, height: 14 }}
                />
              </Box>
            </>
          )}
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            justifyContent: "center",
            width: "100%",
            mb: "8px",
          }}
        >
          <Box
            component="img"
            src="/swiping-card/location.svg"
            alt="Location"
            sx={{ width: 14, height: 14 }}
          />
          <Typography
            sx={{
              fontSize: { xs: "0.82rem", md: "0.88rem" },
              color: "rgba(255,255,255,0.8)",
              fontWeight: 500,
              lineHeight: "16px",
            }}
          >
            {profile.Location?.replace(", USA", "")}
          </Typography>
        </Box>

        {profile.About && (
          <Typography
            sx={{
              fontSize: { xs: "0.78rem", md: "0.84rem" },
              my: "4px",
              lineHeight: "16px",
              color: "rgba(255,255,255,0.75)",
              fontWeight: 400,
              letterSpacing: 0,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textAlign: "center",
              textOverflow: "ellipsis",
            }}
            dangerouslySetInnerHTML={{
              __html: profile?.About ? profile?.About : ".",
            }}
          />
        )}

        <Box
          sx={{
            display: "flex",
            flexWrap: "nowrap",
            justifyContent: "center",
            gap: 1,
            width: "100%",
            overflow: "hidden",
            mt: "4px",
          }}
        >
          {profile?.SwingStyleTags?.slice(0, 4).map(
            (tag: string, index: number) => {
              return (
                <Chip
                  key={`${tag}-${index}`}
                  label={tag}
                  sx={{
                    bgcolor: "rgba(255,45,85,0.12)",
                    color: "#FF4D6D",
                    border: "1px solid rgba(255,45,85,0.25)",
                    fontSize: "0.72rem",
                    height: "22px",
                    borderRadius: "8px",
                    fontWeight: 500,
                    textTransform: "capitalize",
                    flexShrink: 1,
                    minWidth: 0,
                    maxWidth: "30%",

                    "& .MuiChip-label": {
                      px: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    },
                  }}
                />
              );
            },
          )}
        </Box>
      </Box>
    </Card>
  );
};

  const getButtonSize = () => {
    if (isSmallDesktop) {
      return { size: 48, iconSize: 24 };
    } else if (isLargeDesktop) {
      return { size: 64, iconSize: 32 };
    }
    return { size: 56, iconSize: 28 };
  };

  const buttonSizes = getButtonSize();

  if (isMobile) {
    return <MobileSweaping />;
  }

  if (loading) {
    return (
      <Box
        sx={{
          height: "100dvh",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#121212",
        }}
      >
        <AppHeaderDesktop />

        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Loader />
        </Box>
      </Box>
    );
  }

  return (
    <>
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(160deg, #14071f 0%, #0a0412 100%)",
        }}
      >
        <AppHeaderDesktop />
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: { xs: "column", lg: "row" },
            justifyContent: "center",
            alignItems: { xs: "center", lg: "center" },
            gap: { xs: 4, xl: 8 },
            width: "100%",
            maxWidth: "1600px",
            mx: "auto",
            px: 4,
            pt: { xs: "72px", lg: "76px" },
            pb: { xs: 3, lg: 4 },
          }}
        >
          {/* Profile Details Section */}
          <Box sx={{ flexShrink: 0 }}>
            <ProfileCard profile={selectedUserProfile} />
          </Box>

          {/* Swipe Card Section */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            {/* Undo Pill Container */}
            <Box
              sx={{
                height: 44,
                mb: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {lastDeniedProfile && (
                <Button
                  onClick={handleUndo}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    px: 2,
                    py: 0.6,
                    borderRadius: "999px",
                    backgroundColor: "rgba(20, 10, 35, 0.9)",
                    border: "1px solid rgba(255, 82, 82, 0.5)",
                    boxShadow: "0 4px 20px rgba(255, 82, 82, 0.35)",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: "pointer",
                    backdropFilter: "blur(10px)",
                    textTransform: "none",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      backgroundColor: "rgba(30, 15, 50, 0.95)",
                      transform: "scale(1.04)",
                    },
                  }}
                >
                  <RotateCcw size={15} color="#ffffff" />
                  <Avatar
                    src={lastDeniedProfile?.Avatar || "/noavatar.png"}
                    sx={{
                      width: 24,
                      height: 24,
                      border: "1.5px solid rgba(255, 82, 82, 0.7)",
                    }}
                  />
                  <Typography
                    sx={{
                      color: "#ffffff",
                      fontSize: "13px",
                      fontWeight: 700,
                      maxWidth: "130px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {lastDeniedProfile?.Username || "Previous"}
                  </Typography>
                </Button>
              )}
            </Box>

            <Box
              sx={{
                position: "relative",
                width: `${cardDimensions.width}px`,
                height: "auto",
              }}
            >
              {idParam && !isMobile
                ? selectedUserProfile && (
                  <TinderCard
                    key={selectedUserProfile.Id}
                    ref={
                      refs.current[
                      selectedUserProfile.Id
                      ] as React.RefObject<any>
                    }
                    onSwipe={(dir: any) => handleSwipe(dir)}
                    preventSwipe={["up"]}
                    flickOnSwipe
                  >
                    <CardModern profile={selectedUserProfile} />
                  </TinderCard>
                )
                : userProfiles
                  .slice(currentIndex, currentIndex + 1)
                  .map((profile: Profile) => {
                    const setRef = (id: string) => {
                      if (!refs.current[id]) {
                        refs.current[id] = React.createRef<any>();
                      }
                      return refs.current[id];
                    };
                    return (
                      <TinderCard
                        key={profile.Id}
                        ref={setRef(profile.Id)}
                        onSwipe={(dir: any) => handleSwipe(dir)}
                        preventSwipe={["up"]}
                        flickOnSwipe={true}
                      >
                        <CardModern profile={profile} />
                      </TinderCard>
                    );
                  })}
            </Box>
            <ActionButtons
              buttonSizes={buttonSizes}
              handleButtonSwipe={handleButtonSwipe}
            />
          </Box>
        </Box>
      </Box>

      {/* All Modals and Dialogs remain the same */}
      <Modal open={isReportModalOpen} onClose={handleReportModalToggle}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: 280, sm: 320, lg: 360 },
            bgcolor: "#1e1e1e",
            color: "white",
            boxShadow: 24,
            p: { xs: 3, lg: 4 },
            borderRadius: 2,
          }}
        >
          <Typography
            variant="h6"
            gutterBottom
            sx={{
              fontSize: { xs: "1.1rem", lg: "1.25rem" },
            }}
          >
            Report or Block User
          </Typography>
          <FormControlLabel
            sx={{
              color: "white",
              "& .MuiCheckbox-root": {
                color: "#9c27b0",
              },
              "& .MuiCheckbox-root.Mui-checked": {
                color: "#9c27b0",
              },
            }}
            control={
              <Checkbox
                checked={reportOptions.reportImage}
                onChange={handleCheckboxChange}
                name="reportImage"
              />
            }
            label="Inappropriate Image"
          />
          <FormControlLabel
            sx={{
              color: "white",
              "& .MuiCheckbox-root": {
                color: "#9c27b0",
              },
              "& .MuiCheckbox-root.Mui-checked": {
                color: "#9c27b0",
              },
            }}
            control={
              <Checkbox
                checked={reportOptions.reportUser}
                onChange={handleCheckboxChange}
                name="reportUser"
              />
            }
            label="Report User"
          />
          <FormControlLabel
            sx={{
              color: "white",
              "& .MuiCheckbox-root": {
                color: "#9c27b0",
              },
              "& .MuiCheckbox-root.Mui-checked": {
                color: "#9c27b0",
              },
            }}
            control={
              <Checkbox
                checked={reportOptions.blockUser}
                onChange={handleCheckboxChange}
                name="blockUser"
              />
            }
            label="Block User"
          />
          <Box mt={2} display="flex" justifyContent="flex-end">
            <Button
              onClick={handleReportSubmit}
              variant="contained"
              color="secondary"
            >
              {isSubmitting ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Submit"
              )}
            </Button>
          </Box>
        </Box>
      </Modal>

      {memberalarm === "0" && <InstructionModal />}

      <Dialog
        open={showLimitPopup}
        onClose={(event, reason) => {
          if (reason === "backdropClick" || reason === "escapeKeyDown") return;
          setShowLimitPopup(false);
        }}
        BackdropProps={{
          sx: {
            backdropFilter: "blur(12px)",
            backgroundColor: "rgba(0,0,0,0.7)"
          }
        }}
        PaperProps={{
          component: motion.div,
          initial: { opacity: 0, scale: 0.9, y: 20 },
          animate: { opacity: 1, scale: 1, y: 0 },
          sx: {
            width: "100%",
            maxWidth: 400,
            borderRadius: "28px",
            margin: 2,
            p: 4,
            background: "rgba(25, 15, 40, 0.9)",
            backdropFilter: "blur(30px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 25px 70px rgba(0,0,0,0.8), 0 0 100px rgba(255, 45, 85, 0.15)",
            color: "#fff",
            overflow: "visible",
            position: "relative",
            "&::before": {
              content: '""',
              position: "absolute",
              top: "-2px",
              left: "10%",
              right: "10%",
              height: "2px",
              background: "linear-gradient(90deg, transparent, #FF2D55, #7000FF, transparent)",
              zIndex: 1
            }
          },
        }}
      >
        <DialogContent sx={{ p: 0, overflow: "visible" }}>
          <Stack spacing={4} alignItems="center" textAlign="center">
            {/* Icon/Visual Header */}
            <Box sx={{ position: "relative" }}>
              <Box
                component={motion.div}
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.5, 0.8, 0.5]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                sx={{
                  position: "absolute",
                  inset: -20,
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(255, 45, 85, 0.3) 0%, transparent 70%)",
                }}
              />
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: "24px",
                  background: "linear-gradient(135deg, #FF2D55 0%, #7000FF 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 15px 35px rgba(255, 45, 85, 0.4)",
                  transform: "rotate(-5deg)",
                }}
              >
                <BoltIcon sx={{ color: "#fff", fontSize: 40 }} />
              </Box>
            </Box>

            {/* Content */}
            <Box>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  fontSize: "1.5rem",
                  mb: 1,
                  background: "linear-gradient(to bottom, #fff, #ccc)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent"
                }}
              >
                Daily Limit Reached
              </Typography>
              <Typography
                sx={{
                  fontSize: "0.95rem",
                  color: "rgba(255,255,255,0.6)",
                  lineHeight: 1.6,
                }}
              >
                You've reached your daily quota of{" "}
                <Box component="span" sx={{ color: "#FF2D55", fontWeight: 700 }}>
                  {dailyLimit} swipes
                </Box>.
              </Typography>
            </Box>

            <Box
              sx={{
                width: "100%",
                p: 2,
                background: "rgba(255, 255, 255, 0.03)",
                borderRadius: "16px",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                display: "flex",
                flexDirection: "column",
                gap: 1
              }}
            >
              <Typography sx={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.6)", textAlign: 'center' }}>
                You have reached your 30 swipe limit for today.
              </Typography>
              <Typography sx={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", textAlign: 'center' }}>
                Come back tomorrow or upgrade for unlimited access!
              </Typography>
            </Box>

            {/* Action Buttons */}
            <Stack direction="column" spacing={2} sx={{ width: "100%" }}>
              <Button
                fullWidth
                onClick={() => router.push("/membership")}
                sx={{
                  borderRadius: "16px",
                  fontWeight: 800,
                  py: 1.8,
                  fontSize: "1rem",
                  textTransform: "none",
                  background: "linear-gradient(90deg, #FF2D55, #7000FF)",
                  color: "#fff",
                  boxShadow: "0 10px 25px rgba(255, 45, 85, 0.3)",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: "0 15px 35px rgba(255, 45, 85, 0.5)",
                    opacity: 0.9
                  }
                }}
              >
                Upgrade to Premium ✨
              </Button>
              <Button
                fullWidth
                onClick={() => setShowLimitPopup(false)}
                sx={{
                  borderRadius: "16px",
                  fontWeight: 600,
                  py: 1.2,
                  fontSize: "0.9rem",
                  textTransform: "none",
                  color: "rgba(255,255,255,0.5)",
                  "&:hover": {
                    color: "#fff",
                    background: "rgba(255,255,255,0.05)"
                  }
                }}
              >
                Maybe Later
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showMatchPopup}
        onClose={() => setShowMatchPopup(false)}
        BackdropProps={{ sx: { backdropFilter: "blur(6px)" } }}
        PaperProps={{
          sx: {
            width: "100%",
            maxWidth: 380,
            borderRadius: 4,
            margin: 2,
            p: 3,
            background: "rgba(20, 10, 35, 0.95)",
            backdropFilter: "blur(25px)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
            color: "#fff",
            overflow: "hidden",
            // Top shimmer
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "1px",
              background:
                "linear-gradient(90deg, transparent, rgba(255,107,157,0.6), transparent)",
            },
          },
        }}
      >
        <DialogContent sx={{ p: 0 }}>
          {matchedProfile && (
            <Stack spacing={2.5} alignItems="center" textAlign="center">
              {/* Matched avatars with heart */}
              <Box sx={{ position: "relative", mt: 0.5 }}>
                {/* Glow ring */}
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
                <Avatar
                  src={matchedProfile.Avatar}
                  alt={matchedProfile.Username}
                  sx={{
                    width: 90,
                    height: 90,
                    border: "3px solid transparent",
                    backgroundImage:
                      "linear-gradient(rgba(20,10,35,1), rgba(20,10,35,1)), linear-gradient(135deg, #FF2D55, #7000FF)",
                    backgroundOrigin: "border-box",
                    backgroundClip: "padding-box, border-box",
                  }}
                />
                {/* Heart badge */}
                <Box
                  sx={{
                    position: "absolute",
                    bottom: -4,
                    right: -4,
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #FF2D55, #7000FF)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px solid rgba(20,10,35,1)",
                    fontSize: 14,
                  }}
                >
                  ❤️
                </Box>
              </Box>

              {/* Title */}
              <Box>
                <Typography
                  sx={{
                    fontWeight: 800,
                    fontSize: "1.3rem",
                    background:
                      "linear-gradient(135deg, #FFB6C1, #FF6B9D, #FF2D55)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    letterSpacing: 0.3,
                    mb: 0.3,
                  }}
                >
                  It's a Match! 🎉
                </Typography>
                <Typography
                  sx={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.45)" }}
                >
                  You and{" "}
                  <strong style={{ color: "rgba(255,255,255,0.8)" }}>
                    {matchedProfile.Username}
                  </strong>{" "}
                  liked each other
                </Typography>
              </Box>

              {/* Divider */}
              <Box
                sx={{
                  width: "100%",
                  height: "1px",
                  background:
                    "linear-gradient(90deg, transparent, rgba(255,107,157,0.3), transparent)",
                }}
              />

              {/* Match info box */}
              <Box
                sx={{
                  width: "100%",
                  p: 1.8,
                  borderRadius: "12px",
                  background: "rgba(255,45,85,0.07)",
                  border: "1px solid rgba(255,45,85,0.2)",
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  textAlign: "left",
                }}
              >
                <FavoriteIcon
                  sx={{ color: "#FF2D55", fontSize: 20, flexShrink: 0 }}
                />
                <Typography
                  sx={{
                    fontSize: "0.8rem",
                    color: "rgba(255,255,255,0.65)",
                    lineHeight: 1.5,
                  }}
                >
                  Start a conversation with{" "}
                  <strong style={{ color: "#fff" }}>
                    {matchedProfile.Username}
                  </strong>{" "}
                  or view their full profile.
                </Typography>
              </Box>

              {/* Action buttons */}
              <Stack direction="row" spacing={1.2} sx={{ width: "100%" }}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => setShowMatchPopup(false)}
                  sx={{
                    borderRadius: "12px",
                    fontWeight: 600,
                    py: 1.1,
                    fontSize: "0.8rem",
                    textTransform: "none",
                    borderColor: "rgba(255,255,255,0.15)",
                    color: "rgba(255,255,255,0.6)",
                    "&:hover": {
                      borderColor: "#FF2D55",
                      backgroundColor: "rgba(255,45,85,0.08)",
                      color: "#fff",
                    },
                  }}
                >
                  Keep Swiping
                </Button>

                <Button
                  fullWidth
                  onClick={() => {
                    setShowDetail(true);
                    setSelectedUserId(matchedProfile?.Id);
                    window.history.pushState({}, "");
                  }}
                  sx={{
                    borderRadius: "12px",
                    fontWeight: 700,
                    py: 1.1,
                    fontSize: "0.8rem",
                    textTransform: "none",
                    background: "rgba(255,255,255,0.08)",
                    color: "#fff",
                    border: "1px solid rgba(255,255,255,0.12)",
                    "&:hover": {
                      background: "rgba(255,255,255,0.13)",
                    },
                  }}
                >
                  View Profile
                </Button>

                <Button
                  fullWidth
                  onClick={() => router.push(`/messaging/${id}`)}
                  sx={{
                    borderRadius: "12px",
                    fontWeight: 700,
                    py: 1.1,
                    fontSize: "0.8rem",
                    textTransform: "none",
                    background: "linear-gradient(90deg, #FF2D55, #7000FF)",
                    color: "#fff",
                    boxShadow: "0 4px 16px rgba(255,45,85,0.3)",
                    "&:hover": {
                      opacity: 0.9,
                      boxShadow: "0 6px 20px rgba(255,45,85,0.45)",
                    },
                  }}
                >
                  Chat
                </Button>
              </Stack>
            </Stack>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={showEndPopup}
        onClose={(event, reason) => {
          if (reason === "backdropClick") return;
          setShowEndPopup(false);
        }}
        disableEscapeKeyDown
        BackdropProps={{ sx: { backdropFilter: "blur(6px)" } }}
        PaperProps={{
          sx: {
            background: "rgba(20, 10, 35, 0.95)",
            backdropFilter: "blur(25px)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "none",
            overflow: "visible",
            borderRadius: "20px",
          },
        }}
      >
        <Box
          sx={{
            width: { xs: 300, sm: 360 },
            p: 3,

            textAlign: "center",
            color: "#fff",
          }}
        >
          <Stack spacing={2} alignItems="center">
            {/* Icon */}
            <Box
              sx={{
                width: 70,
                height: 70,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #FF2D55, #7000FF)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FavoriteIcon sx={{ color: "#fff", fontSize: 30 }} />
            </Box>

            {/* Title */}
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: "1.2rem",
              }}
            >
              No more profiles right now
            </Typography>

            {/* Description */}
            <Typography
              sx={{
                fontSize: "0.9rem",
                color: "rgba(255,255,255,0.75)",
                lineHeight: 1.6,
              }}
            >
              You’ve seen everyone that matches your current preferences. Try
              adjusting them to discover more people.
            </Typography>

            {/* Suggestion Card */}
            <Box
              sx={{
                width: "100%",
                p: 1.6,
                borderRadius: "14px",
                background:
                  "linear-gradient(135deg, rgba(112,0,255,0.14), rgba(255,45,85,0.08))",
                border: "1.5px solid rgba(155, 77, 255, 0.4)",
                textAlign: "left",
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  color: "#9B4DFF",
                  mb: 0.6,
                }}
              >
                Try adjusting:
              </Typography>

              <Typography
                sx={{
                  fontSize: "0.85rem",
                  color: "rgba(255,255,255,0.75)",
                  lineHeight: 1.6,
                }}
              >
                • Max distance or location <br />• Gender or partner preferences
              </Typography>
            </Box>

            {/* Button */}
            <Button
              fullWidth
              onClick={() => router.push("/prefrences")}
              sx={{
                borderRadius: 3,
                fontWeight: 700,
                py: 1.2,
                background: "linear-gradient(90deg, #FF2D55, #7000FF)",
                color: "#fff",
                transition: "0.3s",
                "&:hover": {
                  transform: "scale(1.03)",
                  boxShadow: "0 0 20px rgba(255,45,85,0.5)",
                },
              }}
            >
              Adjust Preferences
            </Button>

            {/* Footer */}
            <Typography
              sx={{
                fontSize: "0.75rem",
                color: "rgba(255,255,255,0.5)",
              }}
            >
              Check back later for new matches ✨
            </Typography>
          </Stack>
        </Box>
      </Dialog>

      <Dialog open={matchesOpen}>
        <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title">
          Matches
        </DialogTitle>
        <DialogContent>
          <Typography gutterBottom>This feature is in development</Typography>
        </DialogContent>
        <DialogActions>
          <Button
            autoFocus
            onClick={() => setMatchesOpen(false)}
            sx={{ color: "red" }}
          >
            Ok
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={messageOpen}>
        <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title">
          Messages
        </DialogTitle>
        <DialogContent>
          <Typography gutterBottom>This feature is in development</Typography>
        </DialogContent>
        <DialogActions>
          <Button
            autoFocus
            onClick={() => setMessageOpen(false)}
            sx={{ color: "red" }}
          >
            Ok
          </Button>
        </DialogActions>
      </Dialog>

      <UserProfileModal
        handleGrantAccess={handleGrantAccess}
        handleClose={handleClose}
        open={showDetail}
        userid={selectedUserId}
      />
      {profileId && <ProfileImgCheckerModel profileId={profileId} />}
    </>
  );
}
