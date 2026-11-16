"use client";

import React, { useCallback, useEffect, useState, useRef, memo, Suspense } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  Button,
  IconButton,
  Container,
  CardActions,
  useMediaQuery,
  Stack,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  useTheme,
  Pagination,
  PaginationItem,
  Tooltip,
} from "@mui/material";
import {
  Heart,
  Flag,
  MoreVertical,
  BadgeCheck,
  Plus,
  Edit,
  Trash2,
  Flame,
  MessageCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { jwtDecode } from "jwt-decode";
import { toast } from "react-toastify";
import Loader from "@/commonPage/Loader";
import AppHeaderMobile from "@/layout/AppHeaderMobile";
import AppHeaderDesktop from "@/layout/AppHeaderDesktop";
import AppFooterMobile from "@/layout/AppFooterMobile";
import AppFooterDesktop from "@/layout/AppFooterDesktop";
import UserProfileModal from "@/components/UserProfileModal";
import CustomDialog from "@/components/CustomDialog";
import ReportModal from "@/components/ReportModal";
import ReportIcon from "@mui/icons-material/Report";

const PostCard = memo(({ post, index, profileId, onLike, onReport, onProfileClick, onEdit, isRevealed, onReveal }: any) => {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.3) }}
    >
      <Card
        id={`post-${post.Id}`}
        sx={{
          background: "rgba(255, 255, 255, 0.03)",
          backdropFilter: "blur(12px)",
          borderRadius: "24px",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          overflow: "hidden",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            transform: "translateY(-8px)",
            border: "1px solid rgba(255, 45, 149, 0.3)",
            boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
          },
        }}
      >
        <Box sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            sx={{ cursor: "pointer" }}
            onClick={() => onProfileClick(post.ProfileId)}
          >
            <Box sx={{
              position: "relative",
              width: 38,
              height: 38,
              borderRadius: "50%",
              border: "2px solid #FF2D95",
              overflow: "hidden", // Clips the blur inside the circle
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Image
                src={post.Avatar}
                alt={post.Username}
                fill
                sizes="38px"
                style={{
                  objectFit: "cover",
                  // NSFW Blur Logic for Avatars - Sync with post reveal
                  filter: post.IsAvatarNsfw && !isRevealed ? "blur(10px)" : "none",
                  transition: "filter 0.3s ease"
                }}
              />
            </Box>
            <Box>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", color: "#fff" }}>{post.Username}</Typography>
                {post.selfie_verification_status === "true" && (
                  <Tooltip
                    title="This profile has been officially verified for authenticity."
                    arrow
                    placement="top"
                    enterTouchDelay={0}
                    componentsProps={{
                      tooltip: {
                        sx: {
                          bgcolor: "rgba(10, 4, 18, 0.95)",
                          backdropFilter: "blur(10px)",
                          border: "1px solid rgba(0, 230, 118, 0.3)",
                          color: "#fff",
                          fontWeight: 600,
                          fontSize: "0.8rem",
                          p: 1.5,
                          borderRadius: "12px",
                          boxShadow: "0 8px 32px rgba(0,0,0,0.4)"
                        }
                      },
                      arrow: { sx: { color: "rgba(10, 4, 18, 0.95)" } }
                    }}
                  >
                    <Box sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      background: "rgba(0, 230, 118, 0.1)",
                      color: "#00E676",
                      px: 1.2,
                      py: 0.5,

                      borderRadius: "100px",
                      border: "1px solid rgba(0, 230, 118, 0.3)",
                      cursor: "help",
                      userSelect: "none",
                      WebkitUserSelect: "none",
                      transition: "all 0.3s ease",
                      "&:hover": { background: "rgba(0, 230, 118, 0.2)", transform: "scale(1.05)" }
                    }}>
                      <ShieldCheck size={14} />
                      <Typography sx={{ fontSize: "9px", fontWeight: 900, letterSpacing: "0.5px" }}>VERIFIED</Typography>
                    </Box>
                  </Tooltip>
                )}
              </Stack>
              <Typography sx={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)" }}>
                {new Date(post.CreatedAt).toLocaleDateString("en-US")}
              </Typography>
            </Box>
          </Stack>

          {[post.ProfileId, "347313ee-89c1-4f81-a089-4cbc2e2358ca", "4454da1b-010d-4daf-a580-e5a30f61dd08"].includes(profileId) && (
            <IconButton size="small" onClick={(e) => onEdit(e, post.Id)} sx={{ color: "rgba(255,255,255,0.4)" }}>
              <MoreVertical size={20} />
            </IconButton>
          )}
        </Box>

        <Box
          sx={{ position: "relative", aspectRatio: { xs: "1/1", sm: "4/5" }, cursor: "pointer", overflow: "hidden", backgroundColor: "rgba(255,255,255,0.05)" }}
          onClick={() => {
            if (post.IsAvatarNsfw && !isRevealed) {
              onReveal();
            } else {
              router.push(`/whatshot/post/detail/${post.Id}`);
            }
          }}
        >
          <Box sx={{
            width: "100%",
            height: "100%",
            position: "relative",
            filter: post.IsAvatarNsfw && !isRevealed ? "blur(50px)" : "none",
            transition: "filter 0.4s ease-in-out"
          }}>
            <Image
              src={post.PhotoLink}
              alt={post.ImageCaption || "Post image"}
              fill
              sizes="(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={index < 2}
              style={{ objectFit: "cover", transition: "transform 0.5s ease" }}
            />
          </Box>

          {/* NSFW Overlay for Post Image */}
          {post.IsAvatarNsfw && !isRevealed && (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 2,
                backgroundColor: "rgba(0,0,0,0.3)",
                textAlign: "center",
                p: 2
              }}
            >
              <ReportIcon sx={{ color: "#fff", fontSize: 40, mb: 1, opacity: 0.9 }} />
              <Typography sx={{ color: "#fff", fontWeight: "bold", fontSize: "0.85rem", textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}>
                Sensitive Content
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.8)", fontSize: "0.7rem", mb: 2 }}>
                Click to view
              </Typography>
            </Box>
          )}
          <Box sx={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "40%", background: "linear-gradient(to top, rgba(10, 5, 20, 0.8) 0%, transparent 100%)", pointerEvents: "none" }} />

          <Box sx={{ position: "absolute", top: 12, right: 12, px: 1.5, py: 0.5, borderRadius: "8px", background: "rgba(255, 45, 149, 0.9)", backdropFilter: "blur(4px)", color: "#fff", fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase", zIndex: 2 }}>
            Hot Now
          </Box>

          <Box sx={{ position: "absolute", bottom: 12, left: 12, display: "flex", alignItems: "center", gap: 1, px: 1.2, py: 0.8, borderRadius: "12px", background: "rgba(0, 0, 0, 0.3)", backdropFilter: "blur(10px)", border: "1px solid rgba(255, 255, 255, 0.1)", color: "#fff", zIndex: 2, maxWidth: "calc(100% - 32px)" }}>
            <Sparkles size={14} color="#FF2D95" />
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {post.Tagline || "Trending"}
            </Typography>
          </Box>
        </Box>

        <CardActions sx={{ p: 2, justifyContent: "space-between" }}>
          <Stack direction="row" spacing={2}>
            <IconButton onClick={() => onLike(post)} sx={{ color: post.hasLiked ? "#FF2D55" : "rgba(255,255,255,0.6)" }}>
              <Heart size={22} fill={post.hasLiked ? "#FF2D55" : "none"} />
            </IconButton>
            <IconButton onClick={() => router.push(`/whatshot/post/detail/${post.Id}`)} sx={{ color: "rgba(255,255,255,0.6)" }}>
              <MessageCircle size={22} />
            </IconButton>
          </Stack>
          <IconButton onClick={() => onReport(post)} sx={{ color: "rgba(255,255,255,0.3)" }}>
            <Flag size={18} />
          </IconButton>
        </CardActions>

        <Box sx={{ px: 2, pb: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", color: "#fff" }}>{post.LikesCount || 0} Likes</Typography>
            <Box sx={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(255,255,255,0.2)" }} />
            <Typography sx={{ fontWeight: 600, fontSize: "0.85rem", color: "rgba(255,255,255,0.4)" }}>{post.CommentsCount || 0} comments</Typography>
          </Stack>
        </Box>
      </Card>
    </motion.div>
  );
});
PostCard.displayName = "PostCard";

function WhatshotContent() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentPage = parseInt(searchParams?.get("page") || "1");
  const [totalPages, setTotalPages] = useState(1);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [profileId, setProfileId] = useState<any>();
  const [currentName, setCurrentName] = useState<any>("");
  const [targetId, setTargetId] = useState<any>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [showDetail, setShowDetail] = useState<any>(false);
  const [selectedUserId, setSelectedUserId] = useState<any>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [revealedPosts, setRevealedPosts] = useState<Set<string>>(new Set()); // New: Track which NSFW posts the user clicked to "Reveal"
  const [reportOptions, setReportOptions] = useState({ reportUser: false, blockUser: false, reportImage: false });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");

  const pushedStateRef = useRef<string | null>(null);
  const showDetailRef = useRef(showDetail);
  const isReportModalOpenRef = useRef(isReportModalOpen);

  useEffect(() => {
    showDetailRef.current = showDetail;
    isReportModalOpenRef.current = isReportModalOpen;
  }, [showDetail, isReportModalOpen]);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const state = event.state;

      // Only close the Profile Modal if we are NOT in the profile state OR the sub-image state
      if (showDetailRef.current) {
        if (!state || (state.modal !== "userProfile" && state.modal !== "imagePreview")) {
          setShowDetail(false);
          setSelectedUserId(null);
          pushedStateRef.current = null;
        }
      }
      // Only close the Report Modal if we are NOT in the report state
      else if (isReportModalOpenRef.current) {
        if (!state || state.modal !== "report") {
          setIsReportModalOpen(false);
          setReportOptions({ reportUser: false, blockUser: false, reportImage: false });
          pushedStateRef.current = null;
        }
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleProfileClick = useCallback((uid: string) => {
    setSelectedUserId(uid);
    setShowDetail(true);
    if (typeof window !== "undefined") {
      window.history.pushState({ modal: "userProfile" }, "");
      pushedStateRef.current = "userProfile";
    }
  }, []);

  const handleCloseDetail = useCallback(() => {
    if (pushedStateRef.current === "userProfile") {
      window.history.back();
      // The popstate listener will handle setShowDetail(false)
    } else {
      // Fallback if history state wasn't pushed for some reason
      setShowDetail(false);
      setSelectedUserId(null);
    }
  }, []);

  const handleReportModalToggle = useCallback((post: any) => {
    setTargetId(post);
    setIsReportModalOpen(true);
    if (typeof window !== "undefined") {
      window.history.pushState({ modal: "report" }, "");
      pushedStateRef.current = "report";
    }
  }, []);

  const handleCloseReport = useCallback(() => {
    if (pushedStateRef.current === "report") {
      window.history.back();
      // The popstate listener will handle setIsReportModalOpen(false)
    } else {
      setIsReportModalOpen(false);
      setReportOptions({ reportUser: false, blockUser: false, reportImage: false });
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("loginInfo");
      if (token) {
        try {
          const decodeToken = jwtDecode<any>(token);
          setCurrentName(decodeToken?.profileName);
          setProfileId(decodeToken?.profileId);
        } catch (e) { console.warn(e); }
      } else { router.push("/login"); }
    }
  }, []);

  const fetchPosts = useCallback(async () => {
    if (!profileId) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/user/whatshot?id=${profileId}&page=${currentPage}&limit=24`);
      const data = await response.json();
      setPosts(data?.posts || []);
      setTotalPages(data?.totalPages || 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  }, [profileId, currentPage]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("page", value.toString());
    router.push(`?${params.toString()}`);
  };

  const handlePostLike = useCallback(async (post: any) => {
    try {
      setPosts((prev) => prev.map((p) => p.Id === post.Id ? { ...p, hasLiked: !p.hasLiked, LikesCount: p.hasLiked ? p.LikesCount - 1 : p.LikesCount + 1 } : p));
      const response = await fetch("/api/user/whatshot/post/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.Id, profileId, commenterName: currentName, profileUsername: post.Username, email: post.Email }),
      });
      if (!response.ok) fetchPosts();
    } catch (error) { fetchPosts(); }
  }, [profileId, currentName, fetchPosts]);

  const handleEditClick = useCallback((event: any, postId: string) => { setAnchorEl(event.currentTarget); setSelectedPostId(postId); }, []);

  const handleDeletePost = async (postId: string) => {
    try {
      const res = await fetch("/api/user/whatshot/post/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ postId }) });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.Id !== postId));
        setDialogTitle("Deleted");
        setDialogMessage("Your post has been removed.");
        setDialogOpen(true);
      }
    } catch (error) { toast.error("Failed to delete post"); }
  };

  const handleReportSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      if (reportOptions.reportImage) {
        await fetch("/api/user/reportedUser", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reportedById: profileId, reportedByName: currentName, reportedUserId: targetId?.UserId, reportedUserName: targetId?.Username, image: targetId?.Avatar }) });
      }
      if (reportOptions.reportUser || reportOptions.blockUser) {
        await fetch("/api/user/sweeping/report", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profileid: profileId, targetid: targetId?.UserId }) });
      }
      setDialogTitle("Report Received");
      setDialogMessage("Our team will review this shortly. Thank you!");
      setDialogOpen(true);
      setIsReportModalOpen(false);
      setReportOptions({ reportUser: false, blockUser: false, reportImage: false });
    } catch (err) { toast.error("Error reporting."); }
    finally { setIsSubmitting(false); }
  }, [profileId, reportOptions, targetId, currentName]);

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "linear-gradient(160deg, #120820 0%, #0d0518 40%, #0a0415 100%)", color: "white" }}>
      {isMobile ? <AppHeaderMobile /> : <AppHeaderDesktop />}

      <Container maxWidth="xl" sx={{ pt: { xs: 2, sm: 2, md: 16 }, px: { xs: 2, sm: 3, md: 4 }, pb: 10 }}>
        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, gap: { xs: 3, md: 0 }, mb: { xs: 4, md: 6 } }}>
          <Box>
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", p: { xs: 0.8, md: 1 }, borderRadius: "12px", background: "rgba(255, 45, 149, 0.15)", color: "#FF2D95", width: { xs: 36, md: 44 }, height: { xs: 36, md: 44 } }}>
                  <Flame size={isMobile ? 20 : 24} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 900, fontSize: { xs: "1.7rem", md: "2.5rem" }, userSelect: "none" }}>
                  What's <span style={{ color: "#FF2D95" }}>Hot</span>
                </Typography>
              </Stack>
              <Box
                sx={{
                  mt: 1.5,
                  height: "4px",
                  width: "60px",
                  background: "linear-gradient(90deg, #FF2D95 0%, #7000FF 100%)",
                  borderRadius: "10px",
                  boxShadow: "0 2px 10px rgba(255, 45, 149, 0.4)",
                  mb: 2,
                }}
              />
              <Typography
                sx={{
                  color: "rgba(255, 255, 255, 0.5)",
                  fontSize: { xs: "0.85rem", md: "1rem" },
                  fontWeight: 500,
                  maxWidth: "400px",
                  lineHeight: 1.6,
                }}
              >
                Discover the most trending stories and popular posts from the community today.
              </Typography>
            </motion.div>
          </Box>
          <Button component={motion.button} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => router.push("/whatshot/post/create")} variant="contained" fullWidth={isMobile} startIcon={<Plus size={18} />} sx={{ borderRadius: "14px", py: 1.5, px: 4, color: "#fff", background: "linear-gradient(135deg, #FF2D55 0%, #7000FF 100%)", textTransform: "none", fontWeight: 800 }}>Create Post</Button>
        </Box>

        {loading ? (
          <Box sx={{ py: 10, display: "flex", justifyContent: "center" }}><CircularProgress color="secondary" /></Box>
        ) : (
          <>
            <Grid container spacing={{ xs: 2, md: 3 }}>
              {posts.map((post, index) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={post.Id}>
                  <PostCard
                    post={post}
                    index={index}
                    profileId={profileId}
                    onLike={handlePostLike}
                    onReport={handleReportModalToggle}
                    onProfileClick={handleProfileClick}
                    onEdit={handleEditClick}
                    isRevealed={revealedPosts.has(post.Id)}
                    onReveal={() => setRevealedPosts(prev => new Set(prev).add(post.Id))}
                  />
                </Grid>
              ))}
            </Grid>

            <Box
              sx={{
                mt: 8,
                mb: 4,
                display: "flex",
                justifyContent: "center",
                width: "100%"
              }}
            >
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                siblingCount={isMobile ? 0 : 1}
                boundaryCount={1}
                size={isMobile ? "small" : "medium"}
                renderItem={(item) => (
                  <PaginationItem
                    slots={{ previous: ChevronLeft, next: ChevronRight }}
                    {...item}
                    sx={{
                      color: "#fff",
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      backdropFilter: "blur(4px)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "12px",
                      margin: "0 4px",
                      transition: "all 0.2s ease",
                      "&.Mui-selected": {
                        background: "linear-gradient(135deg, #FF2D55 0%, #7000FF 100%)",
                        boxShadow: "0 0 20px rgba(255, 45, 149, 0.4)",
                        border: "none",
                        fontWeight: 800,
                        "&:hover": {
                          background: "linear-gradient(135deg, #FF2D55 0%, #7000FF 100%)",
                          opacity: 0.9
                        }
                      },
                      "&:hover": {
                        backgroundColor: "rgba(255, 255, 255, 0.15)",
                        transform: "translateY(-2px)"
                      },
                      "& .MuiPaginationItem-icon": {
                        fontSize: isMobile ? "1.2rem" : "1.5rem"
                      },
                      minWidth: { xs: "36px", md: "48px" },
                      height: { xs: "36px", md: "48px" }
                    }}
                  />
                )}
              />
            </Box>
          </>
        )}
      </Container>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)} PaperProps={{ sx: { background: "rgba(20, 10, 35, 0.95)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", color: "#fff", minWidth: "160px" } }}>
        <MenuItem onClick={() => { setAnchorEl(null); router.push(`/whatshot/post/detail/${selectedPostId}`); }} sx={{ py: 1.2 }}><ListItemIcon><Edit size={18} color="#FF2D95" /></ListItemIcon><ListItemText primary="Edit Post" /></MenuItem>
        <MenuItem onClick={() => { setAnchorEl(null); if (selectedPostId) handleDeletePost(selectedPostId); }} sx={{ py: 1.2, color: "#FF2D55" }}><ListItemIcon><Trash2 size={18} color="#FF2D55" /></ListItemIcon><ListItemText primary="Delete" /></MenuItem>
      </Menu>

      <UserProfileModal handleGrantAccess={() => { }} handleClose={handleCloseDetail} open={showDetail} userid={selectedUserId} />
      <ReportModal open={isReportModalOpen} onClose={handleCloseReport} options={reportOptions} setOptions={setReportOptions} onSubmit={handleReportSubmit} isSubmitting={isSubmitting} />
      <CustomDialog open={dialogOpen} title={dialogTitle} description={dialogMessage} confirmText="Got it" cancelText="Close" onClose={() => setDialogOpen(false)} onConfirm={() => setDialogOpen(false)} />
      {isMobile ? <AppFooterMobile /> : <AppFooterDesktop />}
    </Box>
  );
}

export default function Whatshot() {
  return (
    <Suspense fallback={<Loader />}>
      <WhatshotContent />
    </Suspense>
  );
}
