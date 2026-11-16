"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  IconButton,
  TextField,
  Drawer,
  CircularProgress,
  Button,
  Badge,
  Dialog,
  DialogContent,
} from "@mui/material";
import {
  Delete,
  ArrowBack,
  Close,
  Search,
  AddPhotoAlternate,
  WorkspacePremium as WorkspacePremiumIcon,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import imageCompression from "browser-image-compression";

import AppFooterMobile from "@/layout/AppFooterMobile";
import AppHeaderMobile from "@/layout/AppHeaderMobile";
import CustomDialog from "@/components/CustomDialog";
import ReplyModal from "../../components/ReplyModal";
import UserProfileModal from "@/components/UserProfileModal";

interface Mail {
  Avatar: string;
  Subject: string;
  ProfileFromUsername: string;
  ProfileToUsername: string;
  ProfileIdFrom: string;
  ProfileTo: string;
  Body: string;
  Image?: string;
  Image_1?: string;
  Image_2?: string;
  Image_3?: string;
  Image_4?: string;
  CreatedAt: string;
}

const useDialogHistory = (open: boolean, onClose: () => void, modalId: string) => {
  const pushedStateRef = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined" && !(window as any).__activeModals) {
      (window as any).__activeModals = [];
    }

    if (open && !pushedStateRef.current) {
      window.history.pushState({ dialogOpen: true }, "", window.location.href);
      pushedStateRef.current = true;
      (window as any).__activeModals.push(modalId);
    } else if (!open && pushedStateRef.current) {
      const activeModals = (window as any).__activeModals;
      if (activeModals[activeModals.length - 1] === modalId) {
        (window as any).__ignoreNextPopState = true;
        window.history.back();
        setTimeout(() => {
          (window as any).__ignoreNextPopState = false;
        }, 100);
      }
      pushedStateRef.current = false;
      const index = activeModals.indexOf(modalId);
      if (index > -1) activeModals.splice(index, 1);
    }

    const handlePopState = (event: PopStateEvent) => {
      if ((window as any).__ignoreNextPopState) return;

      const activeModals = (window as any).__activeModals;
      if (open && activeModals[activeModals.length - 1] === modalId) {
        if ((window as any).__popStateHandled === event.timeStamp) return;
        (window as any).__popStateHandled = event.timeStamp;

        pushedStateRef.current = false;
        const index = activeModals.indexOf(modalId);
        if (index > -1) activeModals.splice(index, 1);
        onClose();
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [open, onClose, modalId]);
};

const MobileSent = () => {
  const router = useRouter();
  const [sentMails, setSentMails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [selectedMail, setSelectedMail] = useState<any>(null);
  const [selectedMailsWithReply, setSelectedMailsWithReply] = useState<Mail[]>([]);
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mailToDelete, setMailToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [premiumDialogOpen, setPremiumDialogOpen] = useState(false);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [showDetail, setShowDetail] = useState<any>(false);
  const [selectedUserId, setSelectedUserId] = useState<any>(null);

  // States for creating new mail
  const [creatingNew, setCreatingNew] = useState(false);
  const [mailSearchQuery, setMailSearchQuery] = useState("");
  const [userProfiles, setUserProfiles] = useState<any>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newMail, setNewMail] = useState({ subject: "", message: "" });
  const [uploadedImages, setUploadedImages] = useState<Array<{ file: File; preview: string; url?: string }>>([]);
  const [isSending, setIsSending] = useState(false);

  useDialogHistory(openModal, () => setOpenModal(false), "sentMailDetailsModal");
  useDialogHistory(imageModalOpen, () => setImageModalOpen(false), "sentImageExpandedModal");
  useDialogHistory(replyModalOpen, () => setReplyModalOpen(false), "sentReplyModal");
  useDialogHistory(creatingNew, () => setCreatingNew(false), "sentCreateMailModal");

  useEffect(() => {
    const token = localStorage.getItem("loginInfo");
    if (token) {
      const decoded = jwtDecode<any>(token);
      if (decoded.membership === 0) {
        setPremiumDialogOpen(true);
      } else {
        const storedProfileId = localStorage.getItem("logged_in_profile");
        setProfileId(storedProfileId);
      }
    } else {
      router.push("/login");
    }
  }, []);

  useEffect(() => {
    if (profileId) {
      fetchSentMails();
    }
  }, [profileId]);

  useEffect(() => {
    if (creatingNew && mailSearchQuery) {
      fetchUserProfiles();
    }
  }, [creatingNew, mailSearchQuery]);

  const fetchSentMails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/user/mailbox?profileid=${profileId}&type=sent`);
      setSentMails(response.data.data);
    } catch (error) {
      console.error("Error fetching sent mails:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfiles = async () => {
    try {
      const response = await fetch(`/api/user/sweeping?page=1&size=20&search=${encodeURIComponent(mailSearchQuery)}`);
      const data = await response.json();
      setUserProfiles(data.profiles || []);
    } catch (error) {
      console.error("Error fetching profiles:", error);
    }
  };

  const handleCloseUserProfileModal = () => {
    setShowDetail(false);
  };

  const handleMailClick = async (mail: any) => {
    setSelectedMail({
      Avatar: mail.Avatar,
      ProfileFromId: mail.ProfileIdFrom,
      id: mail.MessageId,
      from: mail.ProfileFromUsername,
      to: mail.ProfileToUsername,
      subject: mail.Subject,
      content: mail.Body,
      image: mail.Image || null,
      image1: mail.Image_1 || null,
      image2: mail.Image_2 || null,
      image3: mail.Image_3 || null,
      image4: mail.Image_4 || null,
    });

    setOpenModal(true);

    try {
      const result = await fetch(`/api/user/mailbox/reply?chatid=${mail.MessageId}`);
      const data = await result.json();
      setSelectedMailsWithReply(data.data);
    } catch (error) {
      console.error("Error fetching mail replies:", error);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, mailId: any) => {
    e.stopPropagation();
    setMailToDelete(mailId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!mailToDelete) return;
    setIsDeleting(true);
    try {
      await fetch("/api/user/mailbox/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: mailToDelete }),
      });
      fetchSentMails();
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting mail:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    const newImages = Array.from(files).slice(0, 5 - uploadedImages.length);
    const processedImages = await Promise.all(
      newImages.map(async (file) => {
        const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };
        const compressedFile = await imageCompression(file, options);
        return {
          file: new File([compressedFile], file.name, { type: file.type }),
          preview: URL.createObjectURL(compressedFile),
        };
      })
    );
    setUploadedImages((prev) => [...prev, ...processedImages]);
  };

  const handleSendMail = async () => {
    if (!selectedUser || !newMail.subject || !newMail.message) return;
    setIsSending(true);
    try {
      const uploadedUrls = [];
      for (const image of uploadedImages) {
        const formData = new FormData();
        formData.append("image", image.file);
        const res = await fetch("/api/user/upload", { method: "POST", body: formData });
        const data = await res.json();
        uploadedUrls.push(data.blobUrl);
      }

      await fetch("/api/user/mailbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromId: profileId,
          toId: selectedUser.Id,
          htmlBody: newMail.message,
          subject: newMail.subject,
          image1: uploadedUrls[0] || "",
          image2: uploadedUrls[1] || "",
          image3: uploadedUrls[2] || "",
          image4: uploadedUrls[3] || "",
          image5: uploadedUrls[4] || "",
        }),
      });

      setCreatingNew(false);
      setSelectedUser(null);
      setNewMail({ subject: "", message: "" });
      setUploadedImages([]);
      fetchSentMails();
    } catch (error) {
      console.error("Error sending mail:", error);
    } finally {
      setIsSending(false);
    }
  };

  const filteredMails = sentMails.filter((mail) => {
    const search = searchQuery.toLowerCase();
    return (
      mail.ProfileToUsername?.toLowerCase().includes(search) ||
      mail.Subject?.toLowerCase().includes(search)
    );
  });

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #14071f 0%, #0a0412 100%)",
        color: "white",
        flexDirection: "column",
        display: "flex",
      }}
    >
      <AppHeaderMobile />

      {/* Page Title */}
      <Box sx={{ p: 2, }}>
        <Typography variant="h6" sx={{ fontWeight: 900, color: "#fff", fontSize: "1.7rem" }}>
          Sent Mails
        </Typography>
      </Box>

      {/* Page Header & Search */}
      <Box
        sx={{
          background: "rgba(20, 7, 31, 0.8)",
          backdropFilter: "blur(20px)",
          position: "sticky",
          top: 0,
          zIndex: 10,
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          pb: 2
        }}
      >
        <Box sx={{ px: 2, mb: 1.5 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              bgcolor: "rgba(255,255,255,0.04)",
              borderRadius: "12px",
              px: 1.5,
              py: 0.6,
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <Search sx={{ fontSize: 16, color: "rgba(255,255,255,0.3)" }} />
            <TextField
              fullWidth
              variant="standard"
              placeholder="Search sent mails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                disableUnderline: true,
                sx: {
                  color: "white",
                  ml: 1,
                  fontSize: "0.85rem",
                  "& input::placeholder": {
                    color: "rgba(255,255,255,0.3)",
                    opacity: 1,
                  },
                },
              }}
            />
          </Box>
        </Box>

        {/* Quick Action Buttons */}
        <Box sx={{ display: "flex", px: 2, gap: 1 }}>
          {/* <Button
            onClick={() => setCreatingNew(true)}
            fullWidth
            sx={{
              background: "rgba(255,45,85,0.1)",
              color: "#FF2D55",
              borderRadius: "10px",
              py: 0.8,
              fontSize: "0.75rem",
              fontWeight: 700,
              textTransform: "none",
              border: "1px solid rgba(255,45,85,0.2)",
              display: "flex",
              gap: 0.8,
              "&:hover": {
                background: "rgba(255,45,85,0.2)",
              }
            }}
          >
            <Close sx={{ fontSize: 16, transform: 'rotate(45deg)' }} />
            Create Mail
          </Button> */}
          <Button
            onClick={() => router.push("/mailbox")}
            fullWidth
            sx={{
              background: "rgba(255,255,255,0.03)",
              color: "rgba(255,255,255,0.7)",
              borderRadius: "10px",
              py: 0.8,
              fontSize: "0.75rem",
              fontWeight: 600,
              textTransform: "none",
              border: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              gap: 0.8,
              "&:hover": {
                background: "rgba(255,255,255,0.06)",
              }
            }}
          >
            <ArrowBack sx={{ fontSize: 16 }} />
            Inbox
          </Button>
        </Box>
      </Box>

      {/* Mails List */}
      <Box sx={{ mt: 1 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
            <CircularProgress sx={{ color: "#FF2D55" }} />
          </Box>
        ) : filteredMails.length > 0 ? (
          <List sx={{ display: "flex", flexDirection: "column" }}>
            {filteredMails.map((mail) => {
              const hasImage = /<img.*?src=["'](.*?)["']/.test(mail.Body);
              return (
                <ListItem
                  key={mail.MessageId}
                  onClick={() => handleMailClick(mail)}
                  sx={{
                    px: 1.5,
                    py: 1.2,
                    mx: 2,
                    mb: 1,
                    width: 'auto',
                    bgcolor: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.05)",
                    borderRadius: "16px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    transition: "all 0.2s",
                    "&:hover": {
                      bgcolor: "rgba(255,255,255,0.06)",
                      transform: "translateY(-2px)",
                      borderColor: "rgba(255,45,85,0.3)",
                    },
                  }}
                >
                  {/* Avatar */}
                  <ListItemAvatar>
                    <Avatar
                      src={mail.Avatar || "/noavatar.png"}
                      sx={{
                        width: 42,
                        height: 42,
                        border: "2px solid rgba(255,255,255,0.1)",
                        background: "linear-gradient(45deg, #FF2D55, #7000FF) border-box",
                      }}
                    />
                  </ListItemAvatar>

                  {/* Info */}
                  <ListItemText
                    primary={
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.95rem" }}>
                          {mail.ProfileToUsername}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.7rem" }}>
                          {mail.CreatedAt ? new Date(mail.CreatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 0.5 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            color: "rgba(255,255,255,0.5)",
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '180px'
                          }}
                        >
                          {hasImage ? "📷 Photo" : mail.Subject || "No subject"}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={(e) => handleDeleteClick(e, mail.MessageId)}
                          sx={{
                            color: "rgba(255, 45, 85, 0.7)",
                            "&:hover": {
                              backgroundColor: "rgba(255, 45, 85, 0.1)",
                              color: "#FF2D55"
                            },
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    }
                    sx={{ flex: 1, ml: 2 }}
                  />
                </ListItem>
              );
            })}
          </List>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mt: 10, opacity: 0.2 }}>
            <img src="/empty_mailbox.png" alt="Empty" style={{ width: 120, height: 120, objectFit: "contain" }} />
            <Typography sx={{ mt: 2, color: "#fff" }}>No sent mails found.</Typography>
          </Box>
        )}
      </Box>

      {/* Create New Mail Drawer */}
      <Drawer
        anchor="bottom"
        open={creatingNew}
        onClose={() => setCreatingNew(false)}
        PaperProps={{
          sx: {
            height: "90vh",
            background: "linear-gradient(160deg, #14071f 0%, #0a0412 100%)",
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
            overflow: "hidden",
          },
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <Box sx={{ p: 2, display: "flex", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <IconButton onClick={() => setCreatingNew(false)} sx={{ color: "rgba(255,255,255,0.7)" }}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: 800, color: "#fff", ml: 1 }}>
              Create New Mail
            </Typography>
          </Box>

          <Box sx={{ flex: 1, overflowY: "auto", p: 2.5, display: "flex", flexDirection: "column", gap: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, bgcolor: "rgba(255,255,255,0.04)", px: 2.5, py: 1.5, borderRadius: "16px", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Search sx={{ color: "rgba(255,255,255,0.4)", fontSize: 22 }} />
              <TextField
                variant="standard"
                placeholder="Search profiles"
                fullWidth
                value={mailSearchQuery}
                onChange={(e) => setMailSearchQuery(e.target.value)}
                InputProps={{ disableUnderline: true, sx: { color: "#fff", fontSize: 14 } }}
              />
            </Box>

            {mailSearchQuery && !selectedUser && (
              <List sx={{ maxHeight: "300px", overflowY: "auto" }}>
                {userProfiles.map((user: any) => (
                  <ListItem
                    key={user.Id}
                    onClick={() => setSelectedUser(user)}
                    sx={{
                      mb: 1,
                      bgcolor: "rgba(255,255,255,0.03)",
                      borderRadius: "12px",
                      border: "1px solid rgba(255,255,255,0.05)",
                      "&:hover": { bgcolor: "rgba(255,255,255,0.08)" }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar src={user.Avatar || "/noavatar.png"} sx={{ width: 35, height: 35 }} />
                    </ListItemAvatar>
                    <ListItemText primary={user.Username} secondary={user.Location || "N/A"} primaryTypographyProps={{ color: "#fff" }} />
                  </ListItem>
                ))}
              </List>
            )}

            {selectedUser && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 2, bgcolor: "rgba(255,255,255,0.03)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <Avatar src={selectedUser.Avatar || "/noavatar.png"} sx={{ width: 40, height: 40 }} />
                  <Box>
                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }}>Sending to</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: "#fff" }}>{selectedUser.Username}</Typography>
                  </Box>
                  <IconButton sx={{ ml: "auto", color: "rgba(255,255,255,0.3)" }} onClick={() => setSelectedUser(null)}><Close /></IconButton>
                </Box>

                <TextField
                  fullWidth
                  placeholder="Subject"
                  value={newMail.subject}
                  onChange={(e) => setNewMail({ ...newMail, subject: e.target.value })}
                  sx={{
                    "& .MuiOutlinedInput-root": { color: "#fff", bgcolor: "rgba(255,255,255,0.03)", borderRadius: "12px", "& fieldset": { borderColor: "rgba(255,255,255,0.1)" }, "&.Mui-focused fieldset": { borderColor: "#FF2D55" } }
                  }}
                />

                <TextField
                  fullWidth
                  multiline
                  rows={5}
                  placeholder="Type your mail here..."
                  value={newMail.message}
                  onChange={(e) => setNewMail({ ...newMail, message: e.target.value })}
                  sx={{
                    "& .MuiOutlinedInput-root": { color: "#fff", bgcolor: "rgba(255,255,255,0.03)", borderRadius: "16px", "& fieldset": { borderColor: "rgba(255,255,255,0.1)" }, "&.Mui-focused fieldset": { borderColor: "#FF2D55" } }
                  }}
                />

                <Box>
                  <input accept="image/*" style={{ display: "none" }} id="sent-image-upload" type="file" onChange={handleImageUpload} multiple />
                  <label htmlFor="sent-image-upload">
                    <Button component="span" variant="outlined" startIcon={<AddPhotoAlternate />} sx={{ color: "rgba(255,255,255,0.7)", borderColor: "rgba(255,255,255,0.1)", borderRadius: "12px", textTransform: "none" }}>
                      Add Images ({uploadedImages.length}/5)
                    </Button>
                  </label>
                  <Box sx={{ display: "flex", gap: 1, mt: 2, flexWrap: "wrap" }}>
                    {uploadedImages.map((img, idx) => (
                      <Box key={idx} sx={{ position: "relative", width: 80, height: 80 }}>
                        <img src={img.preview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }} />
                        <IconButton size="small" sx={{ position: "absolute", top: -5, right: -5, bgcolor: "rgba(0,0,0,0.5)", color: "#fff" }} onClick={() => setUploadedImages(prev => prev.filter((_, i) => i !== idx))}><Close sx={{ fontSize: 12 }} /></IconButton>
                      </Box>
                    ))}
                  </Box>
                </Box>

                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleSendMail}
                  disabled={isSending || !selectedUser || !newMail.subject || !newMail.message}
                  sx={{ py: 1.5, borderRadius: "14px", background: "linear-gradient(90deg, #FF2D55, #7000FF)", fontWeight: 700 }}
                >
                  {isSending ? <CircularProgress size={24} sx={{ color: "#fff" }} /> : "Send Mail"}
                </Button>
              </Box>
            )}
          </Box>
        </Box>
      </Drawer>

      {/* Mail Details Drawer */}
      <Drawer
        anchor="bottom"
        open={openModal}
        onClose={() => setOpenModal(false)}
        PaperProps={{
          sx: {
            height: "100vh",
            background: "rgba(20, 10, 35, 0.95)",
            backdropFilter: "blur(25px)",
            backgroundImage: "none",
            borderRadius: "0",
            overflow: "hidden",
          },
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
          {/* Header Row */}
          <Box sx={{ position: 'relative', p: 2, pb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton
                onClick={() => setOpenModal(false)}
                sx={{ color: "rgba(255,255,255,0.7)", "&:hover": { color: "#FF2D55", bgcolor: "rgba(255,45,85,0.1)" } }}
              >
                <ArrowBack />
              </IconButton>
              <Typography variant="h6" sx={{ fontWeight: 800, background: "linear-gradient(90deg, #fff, rgba(255,255,255,0.7))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontSize: "1.2rem" }}>
                Mail Details
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              flex: 1,
              overflowY: "auto",
              p: 2.5,
              "&::-webkit-scrollbar": { width: "6px" },
              "&::-webkit-scrollbar-thumb": { background: "rgba(255,255,255,0.1)", borderRadius: "10px" },
            }}
          >
            {selectedMail && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {selectedMailsWithReply.map((mail, index) => (
                  <Box key={index} sx={{ width: "100%" }}>
                    {/* Message Header */}
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Avatar
                          sx={{
                            width: 38,
                            height: 38,
                            border: "2px solid rgba(255,255,255,0.1)",
                            background: "linear-gradient(45deg, #FF2D55, #7000FF) border-box",
                          }}
                          alt={mail?.ProfileFromUsername || "User"}
                          src={mail?.Avatar || "/noavatar.png"}
                          onClick={() => {
                            setShowDetail(true);
                            setSelectedUserId(mail?.ProfileIdFrom);
                            window.history.pushState({ modal: "userProfile" }, "");
                          }}
                        />
                        <Box>
                          <Typography variant="subtitle2" sx={{ color: "#fff", fontWeight: 700, lineHeight: 1.2, fontSize: "0.95rem" }}>
                            {mail.ProfileFromUsername || "User"}
                          </Typography>
                          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", fontWeight: 600, fontSize: "0.8rem" }}>
                            {index === 0 ? mail.Subject : `RE: ${mail.Subject}`}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)", whiteSpace: "nowrap", fontSize: "0.7rem" }}>
                        {mail.CreatedAt ? new Date(mail.CreatedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }) : ""}
                      </Typography>
                    </Box>

                    {/* Message Body */}
                    <Box
                      sx={{
                        bgcolor: index === 0 ? "rgba(255, 45, 85, 0.05)" : "rgba(255,255,255,0.03)",
                        border: index === 0 ? "1px solid rgba(255, 45, 85, 0.3)" : "1px solid rgba(255,255,255,0.05)",
                        p: 2,
                        borderRadius: 4,
                        borderTopLeftRadius: index === 0 ? 4 : 20,
                      }}
                    >
                      <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.9)", lineHeight: 1.5, whiteSpace: "pre-wrap", fontSize: "0.9rem" }}>
                        {mail.Body}
                      </Typography>
                      {/* Images Grid */}
                      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 1.5, mt: 2 }}>
                        {[mail.Image, mail.Image_1, mail.Image_2, mail.Image_3, mail.Image_4]
                          .filter((img): img is string => !!img)
                          .map((img, imgIdx) => (
                            <img
                              key={imgIdx}
                              src={img}
                              alt="Attachment"
                              onClick={() => { setExpandedImage(img); setImageModalOpen(true); }}
                              style={{ width: "100%", height: "120px", objectFit: "cover", borderRadius: "12px", cursor: "pointer" }}
                            />
                          ))
                        }
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Box>

          <Box sx={{ p: 2, display: "flex", gap: 1.5 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => setOpenModal(false)}
              sx={{
                borderRadius: "12px",
                py: 1.2,
                bgcolor: "rgba(255,255,255,0.05)",
                color: "white",
                fontWeight: 600,
                border: "1px solid rgba(255,255,255,0.1)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.1)" }
              }}
            >
              Close
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={() => setReplyModalOpen(true)}
              sx={{
                borderRadius: "12px",
                py: 1.2,
                background: "linear-gradient(90deg, #FF2D55, #7000FF)",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.9rem",
                boxShadow: "0 4px 15px rgba(255,45,85,0.3)",
                "&:hover": { opacity: 0.9 }
              }}
            >
              Reply
            </Button>
          </Box>
        </Box>
      </Drawer>

      <ReplyModal
        open={replyModalOpen}
        onClose={() => setReplyModalOpen(false)}
        selectedMail={selectedMail}
        profileId={profileId || ""}
        selectedMailsWithReply={selectedMailsWithReply}
        onReplySuccess={async () => {
          if (selectedMail?.id) {
            const result = await fetch(`/api/user/mailbox/reply?chatid=${selectedMail.id}`);
            const data = await result.json();
            setSelectedMailsWithReply(data.data);
          }
        }}
      />

      <UserProfileModal
        handleGrantAccess={() => { }}
        handleClose={handleCloseUserProfileModal}
        open={showDetail}
        userid={selectedUserId}
      />

      <Dialog
        open={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        maxWidth="lg"
        PaperProps={{
          sx: {
            bgcolor: "rgba(0,0,0,0.9)",
            backgroundImage: "none",
            boxShadow: "none",
          },
        }}
      >
        <DialogContent sx={{ p: 0, position: "relative" }}>
          <img
            src={expandedImage || ""}
            alt="Expanded"
            style={{
              width: "100%",
              maxHeight: "90vh",
              objectFit: "contain",
            }}
          />
          <IconButton
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: "white",
              bgcolor: "rgba(0,0,0,0.5)",
              "&:hover": { bgcolor: "rgba(0,0,0,0.7)" }
            }}
            onClick={() => setImageModalOpen(false)}
          >
            <Close />
          </IconButton>
        </DialogContent>
      </Dialog>

      <CustomDialog
        open={deleteDialogOpen}
        title="Delete Sent Mail"
        description="Are you sure you want to permanently delete this sent message?"
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        confirmText="Delete"
        cancelText="Cancel"
        icon={<Delete sx={{ color: "#fff", fontSize: 35 }} />}
      />

      <CustomDialog
        open={premiumDialogOpen}
        title="Upgrade your membership."
        description="Sorry, to access sent mails, you need to upgrade your membership"
        icon={<WorkspacePremiumIcon sx={{ color: "#fff", fontSize: 40 }} />}
        confirmText="Upgrade the membership"
        cancelText="Back"
        onClose={() => router.back()}
        onConfirm={async () => router.push("/membership")}
      />

      <AppFooterMobile />
    </Box>
  );
};

export default MobileSent;
