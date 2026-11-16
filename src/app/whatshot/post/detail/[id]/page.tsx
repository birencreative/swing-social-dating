"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Typography,
  useTheme,
  useMediaQuery,
  Button,
  IconButton,
  TextField,
  Avatar,
  Container,
  Stack,
  CircularProgress,
  Paper,
  Tooltip,
} from "@mui/material";
import {
  Heart,
  MessageCircle,
  Flag,
  ChevronLeft,
  Trash2,
  BadgeCheck,
  Sparkles,
  Pencil,
  ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { jwtDecode } from "jwt-decode";

import AppHeaderMobile from "@/layout/AppHeaderMobile";
import AppHeaderDesktop from "@/layout/AppHeaderDesktop";
import AppFooterMobile from "@/layout/AppFooterMobile";
import AppFooterDesktop from "@/layout/AppFooterDesktop";
import Loader from "@/commonPage/Loader";
import ReportModal from "@/components/ReportModal";
import ReportIcon from "@mui/icons-material/Report";


type Params = Promise<{ id: string }>;

export default function PostDetail(props: { params: Params }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const router = useRouter();

  const params = useParams();
  const id = params?.id as string;
  const [postDetail, setPostDetail] = useState<any>(null);
  const [comments, setComments] = useState<any>([]);
  const [commentText, setCommentText] = useState("");
  const [parentCommentId, setParentCommentId] = useState<string | null>(null);
  const [commentReply, setCommentReply] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const [profileId, setProfileId] = useState("");
  const [profileName, setProfileName] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportOptions, setReportOptions] = useState({ reportUser: false, blockUser: false, reportImage: false });

  const [feedback, setFeedback] = useState<{ text: string, type: "success" | "error" } | null>(null);
  const [isRevealed, setIsRevealed] = useState(false); // New: Track if NSFW content is revealed

  const showFeedback = (text: string, type: "success" | "error" = "success") => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 3000);
  };



  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("loginInfo");
      if (token) {
        try {
          const decodeToken = jwtDecode<any>(token);
          setProfileId(decodeToken?.profileId);
          setProfileName(decodeToken?.profileName);
        } catch (e) { console.warn(e); }
      } else {
        router.push("/login");
      }
    }
  }, [router]);

  const handleWhatshotPosts = async (userid: string) => {
    if (!id || !userid) return;
    try {
      const response = await fetch("/api/user/whatshot/post?id=" + userid + "&postId=" + id);
      const data = await response.json();
      setPostDetail(data?.posts?.[0]);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleGetPostComments = async () => {
    if (!id) return;
    try {
      const response = await fetch("/api/user/whatshot/post/comment?&postId=" + id);
      const data = await response.json();
      setComments(data?.comments || []);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    const loadAll = async () => {
      if (!id || !profileId) return;
      setLoading(true);
      await Promise.all([handleWhatshotPosts(profileId), handleGetPostComments()]);
      setLoading(false);
    };
    loadAll();
  }, [id, profileId]);

  const handleLike = async () => {
    if (!postDetail || profileName === postDetail.Username) return;
    const originalState = { ...postDetail };
    try {
      setPostDetail({
        ...postDetail,
        hasLiked: !postDetail.hasLiked,
        LikesCount: postDetail.hasLiked ? postDetail.LikesCount - 1 : postDetail.LikesCount + 1,
      });
      await fetch("/api/user/whatshot/post/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: id,
          profileId,
          commenterName: profileName,
          profileUsername: postDetail.Username,
          email: postDetail.Email,
        }),
      });
    } catch (error) {
      setPostDetail(originalState);
    }
  };

  const handleCommentSubmit = async () => {
    if (!commentText.trim() || profileName === postDetail?.Username) return;

    const newComment = {
      Id: Date.now().toString(),
      Username: profileName,
      Comment: commentText,
      CreatedAt: new Date().toISOString(),
      ProfileId: profileId,
      Avatar: ""
    };
    const previousComments = [...comments];
    setComments([newComment, ...comments]);
    setCommentText("");

    try {
      const res = await fetch("/api/user/whatshot/post/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: id,
          profileId,
          comment: commentText,
          commenterName: profileName,
          profileUsername: postDetail?.Username,
          email: postDetail?.Email,
        }),
      });
      if (res.ok) {
        handleGetPostComments();
        showFeedback("Your comment has been posted!");
      } else {
        setComments(previousComments);
      }
    } catch (error) {
      setComments(previousComments);
      showFeedback("Couldn't post your comment.", "error");
    }
  };

  const handlePostDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      const response = await fetch("/api/user/whatshot/post", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: id }),
      });

      if (response.ok) {
        router.push("/whatshot");
      }
    } catch (error) {
      console.error("Error:", error);
      showFeedback("Something went wrong while trying to delete this post.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteComment = async (commentId: any, postId: any) => {
    const previousComments = [...comments];
    setComments(comments.filter((c: any) => (c.CommentId || c.Id || c.id) !== commentId));

    try {
      const response = await fetch("/api/user/whatshot/post/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: commentId }),
      });

      if (!response.ok) {
        setComments(previousComments); // Revert
        showFeedback("Failed to delete comment.", "error");
      }
    } catch (error) {
      setComments(previousComments);
      console.error("Error:", error);
    }
  };

  const handleCommentReplySubmit = async () => {
    if (!commentReply.trim() || !parentCommentId) return;
    setParentCommentId(null);
    setCommentReply("");

    try {
      const response = await fetch("/api/user/whatshot/post/comment/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: id,
          parentId: parentCommentId,
          comment: commentReply,
          profileId,
        }),
      });

      if (response.ok) {
        handleGetPostComments();
        showFeedback("Reply posted!");
      }
    } catch (error) {
      showFeedback("Failed to post reply.", "error");
    }
  };

  const handleCommentUpdate = async (commentId: string) => {
    if (!editedContent.trim()) return;
    const previousComments = [...comments];
    setComments(comments.map((c: any) =>
      (c.CommentId || c.Id || c.id) === commentId ? { ...c, Comment: editedContent } : c
    ));
    setEditingCommentId(null);

    try {
      const response = await fetch("/api/user/whatshot/post/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId: commentId, content: editedContent }),
      });

      if (response.ok) {
        handleGetPostComments();
        showFeedback("Comment updated!");
      } else {
        setComments(previousComments);
      }
    } catch (error) {
      setComments(previousComments);
      showFeedback("Failed to update comment.", "error");
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#0a0415", color: "white" }}>
      {isMobile ? <AppHeaderMobile /> : <AppHeaderDesktop />}

      {loading ? (
        <Box sx={{ flexGrow: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Loader />
        </Box>
      ) : (
        <Container sx={{ maxWidth: "1000px !important", pt: { xs: 1, md: 14 }, pb: 12 }}>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Box sx={{ mb: 2, display: "flex", alignItems: "center" }}>
              <Button
                onClick={() => router.back()}
                startIcon={<ChevronLeft size={20} />}
                sx={{ color: "rgba(255,255,255,0.6)", textTransform: "none", fontWeight: 600, "&:hover": { color: "#fff" } }}
              >
                Back
              </Button>
            </Box>

            <Paper
              sx={{
                background: "rgba(255, 255, 255, 0.03)",
                backdropFilter: "blur(30px)",
                borderRadius: "16px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                overflow: "hidden",
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                minHeight: { md: "600px" },
                maxHeight: { md: "85vh" }
              }}
            >
              <Box
                sx={{
                  width: { xs: "100%", md: "55%" },
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  aspectRatio: { xs: "1/1", md: "auto" },
                  cursor: postDetail?.IsAvatarNsfw && !isRevealed ? "pointer" : "default",
                  backgroundColor: "#000",
                  overflow: "hidden" // Clips the blur bleed
                }}
                onClick={() => {
                  if (postDetail?.IsAvatarNsfw && !isRevealed) setIsRevealed(true);
                }}
              >
                {/* Blurred Image Wrapper */}
                <Box sx={{
                  width: "100%",
                  height: "100%",
                  position: "relative",
                  filter: postDetail?.IsAvatarNsfw && !isRevealed ? "blur(60px)" : "none",
                  transition: "filter 0.5s ease-in-out",
                  transform: postDetail?.IsAvatarNsfw && !isRevealed ? "scale(1.1)" : "scale(1)" // Slight scale to hide edges
                }}>
                  {postDetail?.PhotoLink && (
                    <Image src={postDetail.PhotoLink} alt="Post" fill style={{ objectFit: "contain" }} />
                  )}
                </Box>

                {/* NSFW Overlay (Not blurred) */}
                {postDetail?.IsAvatarNsfw && !isRevealed && (
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
              </Box>

              <Box sx={{
                width: { xs: "100%", md: "45%" },
                display: "flex",
                flexDirection: "column",
                borderLeft: { md: "1px solid rgba(255,255,255,0.08)" },
                background: "rgba(255,255,255,0.01)"
              }}>
                <Box sx={{ p: 2, borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box sx={{
                      position: "relative",
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      border: "2px solid #FF2D95",
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      <Avatar
                        src={postDetail?.Avatar}
                        sx={{
                          width: "100%",
                          height: "100%",
                          filter: postDetail?.IsAvatarNsfw && !isRevealed ? "blur(8px)" : "none",
                          transition: "filter 0.3s ease"
                        }}
                      />
                    </Box>
                    <Box>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Typography sx={{ fontWeight: 800, fontSize: "0.9rem" }}>{postDetail?.Username}</Typography>
                        {postDetail.selfie_verification_status === "true" && (
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
                        {postDetail?.CreatedAt ? new Date(postDetail.CreatedAt).toLocaleDateString("en-US") : "..."}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

                <Box sx={{ flexGrow: 1, overflowY: "auto", p: 2, "&::-webkit-scrollbar": { width: "4px" }, "&::-webkit-scrollbar-thumb": { background: "rgba(255,255,255,0.1)", borderRadius: "10px" } }}>
                  {postDetail?.Tagline && (
                    <Box sx={{ mb: 2, p: 1.5, borderRadius: "12px", background: "rgba(255,45,149,0.05)", border: "1px solid rgba(255,45,149,0.1)", display: "inline-flex", alignItems: "center", gap: 1 }}>
                      <Sparkles size={16} color="#FF2D95" />
                      <Typography sx={{ fontSize: "0.75rem", fontWeight: 800, color: "#FF2D95", textTransform: "uppercase", letterSpacing: "0.05em" }}>{postDetail.Tagline}</Typography>
                    </Box>
                  )}

                  {postDetail?.ImageCaption && (
                    <Typography sx={{ fontSize: "0.95rem", lineHeight: 1.6, color: "rgba(255,255,255,0.9)", mb: 3, pb: 3, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <span style={{ fontWeight: 800, marginRight: "8px" }}>{postDetail.Username}</span>
                      {postDetail.ImageCaption}
                    </Typography>
                  )}

                  <Typography sx={{ fontWeight: 900, color: "rgba(255,255,255,0.3)", fontSize: "0.7rem", mb: 2, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    Discussion
                  </Typography>

                  <Stack spacing={2.5}>
                    <AnimatePresence mode="popLayout">
                      {comments.map((item: any) => (
                        <motion.div key={item.Id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          <Stack direction="row" spacing={1.5} alignItems="flex-start">
                            <Avatar src={item.Avatar} sx={{ width: 32, height: 32 }} />
                            <Box sx={{ flexGrow: 1 }}>
                              <Box sx={{ background: "rgba(255,255,255,0.04)", p: 1.5, borderRadius: "16px 16px 16px 4px" }}>
                                <Typography sx={{ fontWeight: 800, fontSize: "0.8rem", mb: 0.5, color: "#FF2D95" }}>{item.Username}</Typography>
                                {editingCommentId === (item.CommentId || item.Id || item.id) ? (
                                  <Box sx={{ mt: 1 }}>
                                    <TextField
                                      fullWidth
                                      multiline
                                      size="small"
                                      value={editedContent}
                                      onChange={(e) => setEditedContent(e.target.value)}
                                      sx={{
                                        "& .MuiOutlinedInput-root": { color: "#fff", background: "rgba(0,0,0,0.2)" }
                                      }}
                                    />
                                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                                      <Button size="small" variant="contained" onClick={() => handleCommentUpdate(item.CommentId || item.Id || item.id)} sx={{ bgcolor: "#FF2D95", fontSize: "0.6rem" }}>Save</Button>
                                      <Button size="small" onClick={() => setEditingCommentId(null)} sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.6rem" }}>Cancel</Button>
                                    </Stack>
                                  </Box>
                                ) : (
                                  <Typography sx={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.8)", lineHeight: 1.4 }}>{item.Comment}</Typography>
                                )}
                              </Box>
                              <Stack
                                direction="row"
                                spacing={{ xs: 1.5, sm: 2.5 }}
                                sx={{ mt: 1, ml: 1, flexWrap: "wrap", rowGap: 1, alignItems: "center" }}
                              >
                                <Typography sx={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.3)", mr: { xs: 0.5, sm: 0 } }}>{new Date(item.CreatedAt).toLocaleDateString("en-US")}</Typography>

                                <Stack
                                  direction="row"
                                  spacing={0.5}
                                  alignItems="center"
                                  sx={{ cursor: "pointer", "&:hover opacity": 0.8 }}
                                  onClick={() => {
                                    setParentCommentId(item.CommentId || item.Id || item.id);
                                    setCommentReply("");
                                  }}
                                >
                                  <ChevronLeft size={12} color="#FF2D95" style={{ transform: "rotate(-45deg)" }} />
                                  <Typography sx={{ fontSize: "0.65rem", color: "#FF2D95", fontWeight: 800, textTransform: "uppercase" }}>Reply</Typography>
                                </Stack>

                                {item.ProfileId === profileId && (
                                  <>
                                    <Stack
                                      direction="row"
                                      spacing={0.5}
                                      alignItems="center"
                                      sx={{ cursor: "pointer" }}
                                      onClick={() => {
                                        setEditingCommentId(item.CommentId || item.Id || item.id);
                                        setEditedContent(item.Comment);
                                      }}
                                    >
                                      <Pencil size={12} color="#FF2D95" />
                                      <Typography sx={{ fontSize: "0.65rem", color: "#FF2D95", fontWeight: 800, textTransform: "uppercase" }}>Edit</Typography>
                                    </Stack>

                                    <Stack
                                      direction="row"
                                      spacing={0.5}
                                      alignItems="center"
                                      sx={{ cursor: "pointer" }}
                                      onClick={() => handleDeleteComment(item.CommentId || item.Id || item.id, id)}
                                    >
                                      <Trash2 size={12} color="#FF2D95" />
                                      <Typography sx={{ fontSize: "0.65rem", color: "#FF2D95", fontWeight: 800, textTransform: "uppercase" }}>Remove</Typography>
                                    </Stack>
                                  </>
                                )}
                              </Stack>

                              <AnimatePresence>
                                {parentCommentId === (item.CommentId || item.Id || item.id) && (
                                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ marginTop: "12px" }}>
                                    <Paper sx={{ p: 1.5, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px" }}>
                                      <TextField
                                        fullWidth
                                        multiline
                                        placeholder="Write a reply..."
                                        size="small"
                                        value={commentReply}
                                        onChange={(e) => setCommentReply(e.target.value)}
                                        sx={{ "& .MuiOutlinedInput-root": { color: "#fff", fontSize: "0.85rem" } }}
                                      />
                                      <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 1 }}>
                                        <Button size="small" onClick={() => setParentCommentId(null)} sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.7rem" }}>Cancel</Button>
                                        <Button
                                          size="small"
                                          variant="contained"
                                          onClick={handleCommentReplySubmit}
                                          sx={{ bgcolor: "#FF2D95", fontSize: "0.7rem", fontWeight: 800 }}
                                        >
                                          Reply
                                        </Button>
                                      </Stack>
                                    </Paper>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </Box>
                          </Stack>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </Stack>

                  {comments.length === 0 && (
                    <Box sx={{ py: 4, textAlign: "center", opacity: 0.2 }}>
                      <Typography sx={{ fontSize: "0.8rem" }}>No comments yet.</Typography>
                    </Box>
                  )}
                </Box>

                <Box sx={{ p: 2, borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)", position: "relative" }}>
                  <AnimatePresence>
                    {feedback && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        style={{
                          position: "absolute",
                          top: -45,
                          left: 10,
                          right: 10,
                          zIndex: 10
                        }}
                      >
                        <Box sx={{
                          background: feedback.type === "success" ? "rgba(46, 204, 113, 0.9)" : "rgba(231, 76, 60, 0.9)",
                          backdropFilter: "blur(10px)",
                          color: "white",
                          px: 2,
                          py: 1,
                          borderRadius: "10px",
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
                          display: "flex",
                          alignItems: "center",
                          gap: 1
                        }}>
                          {feedback.type === "success" ? <BadgeCheck size={16} /> : <Sparkles size={16} />}
                          {feedback.text}
                        </Box>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                    <Stack
                      direction="row"
                      spacing={0.5}
                      alignItems="center"
                      sx={{
                        cursor: profileName === postDetail?.Username ? "default" : "pointer",
                        opacity: profileName === postDetail?.Username ? 0.5 : 1
                      }}
                      onClick={profileName === postDetail?.Username ? undefined : handleLike}
                    >
                      <IconButton
                        disabled={profileName === postDetail?.Username}
                        sx={{ color: postDetail?.hasLiked ? "#FF2D55" : "#fff", p: 0 }}
                      >
                        <Heart size={22} fill={postDetail?.hasLiked ? "#FF2D55" : "none"} />
                      </IconButton>
                      <Typography sx={{ fontWeight: 800, fontSize: "0.9rem" }}>{postDetail?.LikesCount || 0}</Typography>
                    </Stack>

                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <MessageCircle size={22} />
                      <Typography sx={{ fontWeight: 800, fontSize: "0.9rem" }}>{comments.length}</Typography>
                    </Stack>

                    {profileName === postDetail?.Username && (
                      <IconButton onClick={handlePostDelete} disabled={isDeleting} sx={{ color: "#FF2D55", ml: "auto !important" }}>
                        {isDeleting ? <CircularProgress size={18} color="inherit" /> : <Trash2 size={20} />}
                      </IconButton>
                    )}

                    <IconButton
                      onClick={() => setIsReportModalOpen(true)}
                      sx={{ color: "rgba(255,255,255,0.3)", p: 0, ml: profileName === postDetail?.Username ? 0 : "auto !important" }}
                    >
                      <Flag size={18} />
                    </IconButton>
                  </Stack>

                  <Paper sx={{ p: "4px 12px", background: "rgba(255,255,255,0.03)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center" }}>
                    <TextField
                      fullWidth
                      placeholder={profileName === postDetail?.Username ? "You cannot comment on your own post" : "Add a comment..."}
                      variant="standard"
                      size="small"
                      disabled={profileName === postDetail?.Username}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      InputProps={{ disableUnderline: true, sx: { color: "#fff", fontSize: "0.85rem" } }}
                    />
                    <Button
                      onClick={handleCommentSubmit}
                      disabled={!commentText.trim() || isSubmitting || profileName === postDetail?.Username}
                      sx={{ color: "#FF2D95", fontWeight: 800, textTransform: "none", minWidth: "auto", ml: 1, opacity: profileName === postDetail?.Username ? 0.5 : 1 }}
                    >
                      Post
                    </Button>
                  </Paper>
                </Box>
              </Box>
            </Paper>
          </motion.div>
        </Container>
      )}

      <ReportModal
        open={isReportModalOpen}
        onClose={() => {
          setIsReportModalOpen(false);
          setReportOptions({ reportUser: false, blockUser: false, reportImage: false });
        }}
        options={reportOptions}
        setOptions={setReportOptions}
        onSubmit={() => {
          setIsReportModalOpen(false);
          showFeedback("Thank you! We have received your report and will review it shortly.");
        }}
        isSubmitting={false}
      />

      {isMobile ? <AppFooterMobile /> : <AppFooterDesktop />}
    </Box>
  );
}
