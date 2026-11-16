"use client";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Card,
  Snackbar,
  Alert,
} from "@mui/material";
import { useSwipe } from "@/hooks/useSwipe";
import type { VerticalDragHandler } from "@/hooks/useSwipe";
import InstructionModal from "@/components/InstructionModal";
import UserProfileModal from "@/components/UserProfileModal";
import { jwtDecode } from "jwt-decode";
import PreferencesSheet from "./PreferencesSheet";
import Loader from "@/commonPage/Loader";
import AppHeaderMobile from "@/layout/AppHeaderMobile";
import AppFooterMobile from "@/layout/AppFooterMobile";
import { getPreloadImages, getProfilePhotos } from "@/utils/profileUtils";
import ReportModalSwipe from "./ReportModalSwipe";
import NoProfilesState from "./NoProfilesState";
import MatchPopup from "@/components/MatchPopup";
import DailyLimitPopup from "./DailyLimitPopup";
import SwipeProfileCard from "./SwipeProfileCard";
import { RotateCcw } from "lucide-react";
export interface DetailViewHandle {
  open: (id: string) => void;
}
const spring = "cubic-bezier(0.175, 0.885, 0.32, 1.275)";

export default function MobileSweaping() {
  const currentCardRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [userProfiles, setUserProfiles] = useState<any[]>([]);
  const [preloadedImages, setPreloadedImages] = useState<Set<string>>(
    new Set(),
  );
  const [loading, setLoading] = useState(true);
  const [showMatchPopup, setShowMatchPopup] = useState(false);
  const [showLimitPopup, setShowLimitPopup] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState<any>(null);
  const [lastDeniedProfile, setLastDeniedProfile] = useState<any | null>(null);
  const [swipeCount, setSwipeCount] = useState(0);
  const [dailyLimit, setDailyLimit] = useState(30);
  const [profileId, setProfileId] = useState<any>();
  const [showDetail, setShowDetail] = useState<any>(false);
  const [selectedUserId, setSelectedUserId] = useState<any>(null);
  const [membership, setMembership] = useState(0);
  const [id, setId] = useState("");
  const [memberalarm, setMemberAlarm] = useState("0");
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const imageContainerRef = useRef<HTMLDivElement | null>(null);
  const verticalDragFrameRef = useRef<VerticalDragHandler | null>(null);
  const [data, setData] = useState<any>(null);
  const prefsOpenRef = useRef(false);
  const showDetailRef = useRef(false);
  const reportOpenRef = useRef(false);

  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info" | "warning",
  });

  const openPrefs = () => {
    setPrefsOpen(true);
    window.history.pushState({ modal: "preferences" }, "");
  };

  const closePrefs = () => {
    setPrefsOpen(false);
  };

  useEffect(() => {
    prefsOpenRef.current = prefsOpen;
  }, [prefsOpen]);

  useEffect(() => {
    showDetailRef.current = showDetail;
  }, [showDetail]);

  useEffect(() => {
    reportOpenRef.current = isReportModalOpen;
  }, [isReportModalOpen]);

  useEffect(() => {
    const onPopState = (event: PopStateEvent) => {
      const state = event.state;

      if (reportOpenRef.current && state?.modal !== "report") {
        setIsReportModalOpen(false);
        return;
      }

      if (showDetailRef.current && state?.modal !== "userProfile") {
        setShowDetail(false);
        setSelectedUserId(null);
        return;
      }

      if (prefsOpenRef.current && state?.modal !== "preferences") {
        setPrefsOpen(false);
        return;
      }
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const visibleProfiles = useMemo(() => {
    return userProfiles.slice(currentIndex, currentIndex + 2);
  }, [userProfiles, currentIndex]);

  const preloadProfiles = useMemo(() => {
    return userProfiles;
  }, [userProfiles]);

  const currentProfile = useMemo(() => {
    return userProfiles[currentIndex];
  }, [userProfiles, currentIndex]);

  const isUserPremium = () => membership === 1;
  const hasReachedSwipeLimit = () => swipeCount >= dailyLimit;

  const sendNotification = useCallback(
    async (message: any, targetProfile: any) => {
      const response = await fetch("/api/user/notification/requestfriend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: targetProfile?.Id,
          title: "❤️ New Match!",
          body: message,
          type: "new_match",
          url: `https://app.swingsocial.co/members/${profileId}`,
        }),
      });

      return await response.json();
    },
    [profileId],
  );

  const handleUpdateLikeMatch = useCallback(
    async (targetProfile: any) => {
      try {
        const response = await fetch("/api/user/sweeping/match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            profileid: profileId,
            targetid: targetProfile?.Id,
          }),
        });
        const username = localStorage.getItem("profileUsername");
        const data = await response.json();
        if (data?.isMatch) {
          setMatchedProfile(targetProfile);
          setShowMatchPopup(true);
          setId(targetProfile?.Id);
          sendNotification(
            `You have a new match with ${username}!`,
            targetProfile,
          );
        }
        return data;
      } catch (error) {
        console.error("Error:", error);
        return null;
      }
    },
    [profileId, sendNotification],
  );

  useEffect(() => {
    if (!profileId) return;

    fetch(`/api/user/sweeping/user?id=${profileId}`)
      .then((res) => res.json())
      .then(({ user }) => {
        setData(user || null);
        if (user) {
          setSwipeCount(parseInt(user.SwipeCount) || 0);
          setDailyLimit(Math.max(parseInt(user.SwipeMax) || 30, 30));
        }
      })
      .catch(console.error);
  }, [profileId]);

  const getUserList = useCallback(async (profileId: string) => {
    if (typeof window !== "undefined") {
      try {
        const cached = sessionStorage.getItem("cached_user_swipes_" + profileId);
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
      const response = await fetch(
        "/api/user/sweeping/swipes?id=" + profileId,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      const data = await response.json();
      const profiles = data?.swipes || [];

      setUserProfiles(profiles);
      if (typeof window !== "undefined" && profiles.length > 0) {
        try {
          sessionStorage.setItem("cached_user_swipes_" + profileId, JSON.stringify(profiles));
        } catch (e) {}
      }
      preloadProfileImages(profiles.slice(0, 2));
    } catch (error) {
      console.error("Error fetching user profiles:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePrefsSaved = useCallback(() => {
    setLoading(true);
    if (profileId) {
      getUserList(profileId);
      setSnack({
        open: true,
        message: "Preferences updated successfully",
        severity: "success",
      });
    }
  }, [getUserList, profileId]);

  const handleSnackClose = useCallback(
    (event?: React.SyntheticEvent | Event, reason?: string) => {
      if (reason === "clickaway") return;
      setSnack((prev) => ({ ...prev, open: false }));
    },
    [],
  );

  const preloadProfileImages = useCallback(
    (profiles: any[]) => {
      if (!profiles?.length) return;

      const canAccessPrivate = membership === 1;

      profiles.forEach((profile) => {
        const urls = getPreloadImages(profile, canAccessPrivate);

        urls.forEach((url) => {
          if (!preloadedImages.has(url)) {
            const img = new Image();
            img.src = url;
            img.onload = () => {
              setPreloadedImages((prev) => new Set(prev).add(url));
            };
          }
        });
      });
    },
    [membership, preloadedImages],
  );

  useEffect(() => {
    const nextProfiles = userProfiles.slice(currentIndex, currentIndex + 3);
    preloadProfileImages(nextProfiles);
  }, [currentIndex, userProfiles, preloadProfileImages]);

  const handleUpdateCategoryRelation = useCallback(
    async (category: any, targetProfile: any) => {
      try {
        const response = await fetch("/api/user/sweeping/relation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pid: profileId,
            targetid: targetProfile?.Id,
            newcategory: category,
          }),
        });
        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Error:", error);
        return null;
      }
    },
    [profileId],
  );

  const handleGrantAccess = useCallback(async () => {
    try {
      const response = await fetch("/api/user/sweeping/grant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profileid: profileId,
          targetid: currentProfile?.Id,
        }),
      });

      return await response.json();
    } catch (error) {
      console.error("Error:", error);
      return null;
    }
  }, [profileId, currentProfile]);

  const fetchNextBatchAndAppend = useCallback(async () => {
    if (!profileId) return;

    if (isFetchingMore) return;
    setIsFetchingMore(true);

    const MAX_RETRIES = 4;
    const RETRY_DELAY_MS = 700;
    const PREFETCH_THRESHOLD = 4;
    let attempt = 0;
    let appended = false;

    while (attempt < MAX_RETRIES && !appended) {
      attempt += 1;
      try {
        const response = await fetch(
          `/api/user/sweeping/swipes?id=${profileId}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          },
        );
        const data = await response.json();
        const profiles = data?.swipes || [];

        // Filter out any IDs we already have locally (defensive)
        const existingIds = new Set(userProfiles.map((p) => p.Id));
        const newProfiles = profiles.filter((p: any) => !existingIds.has(p.Id));

        if (newProfiles.length > 0) {
          // append
          setUserProfiles((prev) => [...prev, ...newProfiles]);
          appended = true;
          break;
        } else {
          // If backend returned 0 or only already-known IDs, wait and retry once or twice
          // This helps in case the relationship write hasn't fully committed yet
          await new Promise((res) => setTimeout(res, RETRY_DELAY_MS));
        }
      } catch (err) {
        console.error("Error while trying to fetch next batch:", err);
        // wait a bit and retry
        await new Promise((res) => setTimeout(res, RETRY_DELAY_MS));
      }
    }

    setIsFetchingMore(false);
  }, [profileId, userProfiles, preloadProfileImages]);

  // Determine if the current profile has multiple images
  const currentProfilePhotos = useMemo(() => {
    return currentProfile ? getProfilePhotos(currentProfile) : [];
  }, [currentProfile]);
  const hasMultipleImages = currentProfilePhotos.length > 1;

  const handleVerticalSwipe = useCallback((direction: 'up' | 'down') => {
    if (!currentProfile) return;
    const totalPhotos = currentProfilePhotos.length;
    if (totalPhotos <= 1) return;

    setImageIndex((prev) => {
      if (direction === 'up') {
        return (prev + 1) % totalPhotos;
      } else {
        return (prev - 1 + totalPhotos) % totalPhotos;
      }
    });
  }, [currentProfile, currentProfilePhotos.length]);

  const {
    cardStyles,
    setCardStyles,
    isExiting,
    setIsExiting,
    pendingSwipeAction,
    setPendingSwipeAction,
    isProcessingSwipe,
    setIsProcessingSwipe,
    handleSwipeStart,
    handleSwipeMove,
    handleSwipeEnd,
    handleMaybe,
  } = useSwipe(
    currentProfile,
    isUserPremium,
    hasReachedSwipeLimit,
    setShowLimitPopup,
    handleVerticalSwipe,
    hasMultipleImages,
    verticalDragFrameRef,
  );

  const handleUndo = useCallback(() => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
    setLastDeniedProfile(null);
    setImageIndex(0);
  }, []);

  const processSwipe = useCallback(
    (direction: string, targetProfile: any) => {
      setImageIndex(0);
      setCurrentIndex((prevIndex) => {
        const nextIndex = prevIndex + 1;

        const PREFETCH_THRESHOLD = 20;
        const remaining = Math.max(0, userProfiles.length - nextIndex);

        if (profileId && !isFetchingMore && remaining <= PREFETCH_THRESHOLD) {
          fetchNextBatchAndAppend().catch((err) =>
            console.error("Prefetch failed:", err),
          );
        }

        if (profileId && nextIndex >= userProfiles.length && !isFetchingMore) {
          fetchNextBatchAndAppend().catch((err) =>
            console.error("fetchNextBatch error:", err),
          );
        }

        return nextIndex;
      });

      setCardStyles({
        active: {
          transform: "scale(1)",
          transition: `transform 0.5s ${spring}`,
        },
        next: {
          transform: "scale(0.95)",
          transition: `transform 0.5s ${spring}`,
        },
      });

      const apiCalls: Promise<any>[] = [];

      if (direction === "left") {
        setLastDeniedProfile(targetProfile);
        apiCalls.push(handleUpdateCategoryRelation("Denied", targetProfile));
      } else {
        setLastDeniedProfile(null);
        if (direction === "right") {
          apiCalls.push(handleUpdateCategoryRelation("Liked", targetProfile));
          apiCalls.push(handleUpdateLikeMatch(targetProfile));
        } else if (direction === "down") {
          apiCalls.push(handleUpdateCategoryRelation("Maybe", targetProfile));
        }
      }

      Promise.all(apiCalls).catch((error) => {
        console.error("Swipe API error:", error);
      });

      if (!isUserPremium() && hasReachedSwipeLimit()) {
        setShowLimitPopup(true);
      } else if (!isUserPremium()) {
        setSwipeCount((prev) => prev + 1);
      }

      setIsProcessingSwipe(false);
      setIsExiting(false);
      setPendingSwipeAction(null);
    },
    [
      userProfiles.length,
      isUserPremium,
      hasReachedSwipeLimit,
      handleUpdateCategoryRelation,
      handleUpdateLikeMatch,
      setSwipeCount,
      setShowLimitPopup,
      setCurrentIndex,
      fetchNextBatchAndAppend,
      isFetchingMore,
      profileId,
      setCardStyles,
      setIsProcessingSwipe,
      setIsExiting,
      setPendingSwipeAction,
    ],
  );

  // Safety net to prevent swiping from getting stuck if the browser fails to fire onTransitionEnd (common on fast gestures or visibility changes)
  useEffect(() => {
    if (!pendingSwipeAction || !currentProfile) return;

    const duration = pendingSwipeAction === "maybe" ? 750 : 450;
    const timer = setTimeout(() => {
      if (isExiting && pendingSwipeAction) {
        const actionMap: any = {
          delete: "left",
          like: "right",
          maybe: "down",
        };
        processSwipe(actionMap[pendingSwipeAction], currentProfile);
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [pendingSwipeAction, isExiting, currentProfile, processSwipe]);

  const hasMoreProfiles = currentIndex < userProfiles.length;

  useEffect(() => {
    setCardStyles({
      active: { transform: "scale(1)", transition: `transform 0.5s ${spring}` },
      next: {
        transform: "scale(0.95)",
        transition: `transform 0.5s ${spring}`,
      },
    });
  }, [currentIndex]);

  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (prefsOpen) return;

      if (
        window.scrollY === 0 &&
        e.touches &&
        e.touches.length === 1 &&
        e.touches[0].clientY > 0
      ) {
        if (e.cancelable) e.preventDefault();
      }
    };
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    return () => {
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [prefsOpen]);

  const handleClose = () => {
    setShowDetail(false);
    setSelectedUserId(null);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("loginInfo");
      const count = localStorage.getItem("memberalarm");
      setMemberAlarm(count ?? "0");
      if (token) {
        const decodeToken = jwtDecode<any>(token);
        setProfileId(decodeToken?.profileId);
        setMembership(decodeToken?.membership);
        getUserList(decodeToken?.profileId);
      } else {
        router.push("/login");
      }
    }
  }, []);

  const handleReportModalToggle = () => {
    const nextState = !isReportModalOpen;
    setIsReportModalOpen(nextState);
    if (nextState) {
      window.history.pushState({ modal: "report" }, "");
    }
  };


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
        <AppHeaderMobile />
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
        <AppFooterMobile />
      </Box>
    );
  }

  return (
    <>
      {/* Glows - matching React Native styles */}
      <div
        style={{
          position: 'fixed',
          top: -130,
          right: -90,
          width: 270,
          height: 270,
          borderRadius: '50%',
          backgroundColor: 'rgba(194,24,91,0.25)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'fixed',
          bottom: -170,
          left: -110,
          width: 280,
          height: 280,
          borderRadius: '50%',
          backgroundColor: 'rgba(194,24,91,0.17)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Main content wrapper with higher z-index */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <AppHeaderMobile />

        <div className="mobile-sweeping-container">
          {lastDeniedProfile && hasMoreProfiles && (
            <div
              style={{
                position: "absolute",
                top: 10,
                left: 0,
                right: 0,
                display: "flex",
                justifyContent: "center",
                zIndex: 100,
                pointerEvents: "auto",
              }}
            >
              <button
                onClick={handleUndo}
                type="button"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 16px",
                  borderRadius: "999px",
                  backgroundColor: "rgba(20, 10, 35, 0.85)",
                  border: "1px solid rgba(255, 82, 82, 0.45)",
                  boxShadow: "0 4px 14px rgba(255, 82, 82, 0.28)",
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  outline: "none",
                  transition: "transform 0.2s ease, background-color 0.2s ease",
                }}
              >
                <RotateCcw size={15} color="#ffffff" />
                {getProfilePhotos(lastDeniedProfile)[0] && (
                  <img
                    src={getProfilePhotos(lastDeniedProfile)[0]}
                    alt={lastDeniedProfile.Username || lastDeniedProfile.Name || "Profile"}
                    style={{
                      width: "26px",
                      height: "26px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "1.5px solid rgba(255, 82, 82, 0.6)",
                    }}
                  />
                )}
                <span
                  style={{
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: 700,
                    maxWidth: "120px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {lastDeniedProfile.Username || lastDeniedProfile.Name || "Previous"}
                </span>
              </button>
            </div>
          )}
          {userProfiles.length > 0 && hasMoreProfiles ? (
            visibleProfiles.map((profile: any, index: number) => (
              <Card
                key={profile.Id}
                ref={index === 0 ? currentCardRef : null}
                elevation={0}
                sx={{
                  position: "absolute",
                  top: 20,
                  left: 10,
                  right: 10,
                  bottom: 30,
                  background: "transparent",
                  boxShadow: "none",
                  transform:
                    index === 0
                      ? cardStyles.active.transform
                      : cardStyles.next.transform,
                  transition:
                    index === 0
                      ? cardStyles.active.transition
                      : cardStyles.next.transition,
                  zIndex: index === 0 ? 2 : 1,
                  pointerEvents: "auto",
                }}
                onTransitionEnd={(e) => {
                  if (
                    index === 0 &&
                    isExiting &&
                    e.propertyName === "transform" &&
                    pendingSwipeAction
                  ) {
                    const actionMap: any = {
                      delete: "left",
                      like: "right",
                      maybe: "down",
                    };
                    processSwipe(actionMap[pendingSwipeAction], profile);
                  }
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 6,
                    touchAction: "none",
                  }}
                  onPointerDown={handleSwipeStart}
                  onPointerMove={handleSwipeMove}
                  onPointerUp={handleSwipeEnd}
                  onPointerCancel={handleSwipeEnd}
                />
                <SwipeProfileCard
                  profile={profile}
                  isActive={index === 0}
                  imageIndex={index === 0 ? imageIndex : 0}
                  setImageIndex={setImageIndex}
                  membership={membership}
                  data={data}
                  imageContainerRef={imageContainerRef}
                  verticalDragFrameRef={index === 0 ? verticalDragFrameRef : undefined}
                  swipeIndicator={
                    index === 0
                      ? {
                        type: cardStyles.active.swipeType,
                        opacity: cardStyles.active.swipeOpacity,
                      }
                      : undefined
                  }
                  onOpenDetail={(id) => {
                    setShowDetail(true);
                    setSelectedUserId(id);
                    window.history.pushState({ modal: "userProfile" }, "");
                  }}
                  onOpenPrefs={openPrefs}
                />
              </Card>
            ))
          ) : (
            <NoProfilesState onAdjustPreferences={openPrefs} />
          )}
        </div>
        <AppFooterMobile />

        <PreferencesSheet
          open={prefsOpen}
          onOpen={openPrefs}
          onClose={closePrefs}
          profileId={profileId}
          onSaved={handlePrefsSaved}
        />

        {memberalarm === "0" && <InstructionModal />}

        {selectedUserId && (
          <UserProfileModal
            open={showDetail}
            userid={selectedUserId}
            handleClose={handleClose}
            handleGrantAccess={handleGrantAccess}
          />
        )}

        <ReportModalSwipe
          open={isReportModalOpen}
          onClose={handleReportModalToggle}
          currentProfile={currentProfile}
          profileId={profileId}
          onReportSuccess={() => {
            // Optional: any extra logic after successful report
          }}
        />
        <DailyLimitPopup
          open={showLimitPopup}
          onClose={() => setShowLimitPopup(false)}
        />
        <MatchPopup
          open={showMatchPopup}
          onClose={() => setShowMatchPopup(false)}
          matchedProfile={matchedProfile}
          onViewProfile={(userId) => {
            setShowDetail(true);
            setSelectedUserId(userId);
            window.history.pushState({ modal: "userProfile" }, "");
            setShowMatchPopup(false);
          }}
        />
        <Snackbar
          open={snack.open}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          autoHideDuration={1000}
          onClose={handleSnackClose}
        >
          <Alert
            onClose={handleSnackClose}
            severity={snack.severity}
            variant="filled"
            sx={{
              backgroundColor: "white",
              color: "#fc4c82",
              fontWeight: "bold",
              alignItems: "center",
              borderRight: "5px solid #fc4c82",
            }}
            icon={
              <Box
                component="img"
                src="/icon.png"
                alt="Logo"
                sx={{ width: 20, height: 20 }}
              />
            }
          >
            {snack.message}
          </Alert>
        </Snackbar>
      </div>
    </>
  );
}