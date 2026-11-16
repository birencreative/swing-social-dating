"use client";

import React, { useEffect, useState } from "react";
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
  CircularProgress,
  Button,
  Badge,
  Dialog,
  DialogContent,
} from "@mui/material";
import {
  Delete,
  Search,
  ArrowBack,
  WorkspacePremium as WorkspacePremiumIcon,
  Close,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import axios from "axios";

import AppHeaderDesktop from "@/layout/AppHeaderDesktop";
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

const DesktopSent = () => {
  const router = useRouter();
  const [sentMails, setSentMails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
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
      setSelectedMail(null);
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting mail:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseUserProfileModal = () => {
    setShowDetail(false);
    setSelectedUserId(null);
  };

  const handleGrantAccess = async () => { };

  const filteredMails = sentMails.filter((mail) => {
    const search = searchQuery.toLowerCase();
    return (
      mail.ProfileToUsername?.toLowerCase().includes(search) ||
      mail.Subject?.toLowerCase().includes(search)
    );
  });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh", bgcolor: "#0A0A0A" }}>
      <AppHeaderDesktop />

      <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Left Sidebar - Sent List */}
        <Box sx={{
          width: 350,
          borderRight: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          flexDirection: "column",
          bgcolor: "#0A0A0A"
        }}>
          <Box sx={{ p: 2, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: "#fff" }}>Sent Mails</Typography>
              <Button
                startIcon={<ArrowBack />}
                onClick={() => router.push("/mailbox")}
                sx={{ color: "#FF2D55", textTransform: "none" }}
              >
                Inbox
              </Button>
            </Box>

            <Box sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              bgcolor: "rgba(255,255,255,0.04)",
              px: 1.5,
              py: 1,
              borderRadius: "12px"
            }}>
              <Search sx={{ color: "rgba(255,255,255,0.3)", fontSize: 20 }} />
              <TextField
                variant="standard"
                placeholder="Search sent..."
                fullWidth
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  disableUnderline: true,
                  sx: { color: "#fff", fontSize: 13 },
                }}
              />
            </Box>
          </Box>

          <Box sx={{ flex: 1, overflowY: "auto" }}>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
                <CircularProgress size={24} sx={{ color: "#FF2D55" }} />
              </Box>
            ) : filteredMails.length > 0 ? (
              <List sx={{ p: 1 }}>
                {filteredMails.map((mail) => (
                  <ListItem
                    key={mail.MessageId}
                    onClick={() => handleMailClick(mail)}
                    sx={{
                      borderRadius: "12px",
                      mb: 0.5,
                      cursor: "pointer",
                      bgcolor: selectedMail?.id === mail.MessageId ? "rgba(255,45,85,0.1)" : "transparent",
                      border: "1px solid",
                      borderColor: selectedMail?.id === mail.MessageId ? "rgba(255,45,85,0.2)" : "transparent",
                      "&:hover": { bgcolor: "rgba(255,255,255,0.03)" },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar src={mail.Avatar || "/noavatar.png"} sx={{ width: 40, height: 40 }} />
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                          <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.85rem" }}>
                            {mail.ProfileToUsername}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.3)" }}>
                            {mail.CreatedAt ? new Date(mail.CreatedAt).toLocaleDateString() : ""}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Typography
                          variant="body2"
                          noWrap
                          sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.75rem" }}
                        >
                          {mail.Subject || "No subject"}
                        </Typography>
                      }
                    />
                    <IconButton size="small" onClick={(e) => handleDeleteClick(e, mail.MessageId)} sx={{ color: "rgba(255,255,255,0.2)", "&:hover": { color: "#FF2D55" } }}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography align="center" sx={{ color: "rgba(255,255,255,0.2)", mt: 4 }}>No sent mails.</Typography>
            )}
          </Box>
        </Box>

        {/* Right Pane - Mail Content */}
        <Box sx={{ flex: 1, bgcolor: "#050505", display: "flex", flexDirection: "column" }}>
          {selectedMail ? (
            <Box sx={{ flex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
              <Box sx={{ flex: 1, overflowY: "auto", p: 4 }}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 4, maxWidth: "800px", mx: "auto" }}>
                  {selectedMailsWithReply.map((mail, index) => (
                    <Box key={index} sx={{ width: "100%" }}>
                      {/* Message Header */}
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <Avatar
                            sx={{
                              width: 42,
                              height: 42,
                              border: "2px solid rgba(255,255,255,0.1)",
                              background: "linear-gradient(45deg, #FF2D55, #7000FF) border-box",
                              cursor: "pointer"
                            }}
                            alt={mail?.ProfileFromUsername || "User"}
                            src={mail?.Avatar || "/noavatar.png"}
                            onClick={() => {
                              setShowDetail(true);
                              setSelectedUserId(mail?.ProfileIdFrom);
                            }}
                          />
                          <Box>
                            <Typography variant="subtitle1" sx={{ color: "#fff", fontWeight: 700, lineHeight: 1.2 }}>
                              {mail.ProfileFromUsername || "User"}
                            </Typography>
                            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>
                              {index === 0 ? mail.Subject : `RE: ${mail.Subject}`}
                            </Typography>
                          </Box>
                        </Box>
                        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.8rem" }}>
                          {mail.CreatedAt ? new Date(mail.CreatedAt).toLocaleString() : ""}
                        </Typography>
                      </Box>

                      {/* Message Body */}
                      <Box
                        sx={{
                          bgcolor: index === 0 ? "rgba(255, 45, 85, 0.04)" : "rgba(255,255,255,0.02)",
                          border: index === 0 ? "1px solid rgba(255, 45, 85, 0.2)" : "1px solid rgba(255,255,255,0.05)",
                          p: 3,
                          borderRadius: 4,
                        }}
                      >
                        <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.9)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                          {mail.Body}
                        </Typography>
                        {/* Images Grid */}
                        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 2, mt: 3 }}>
                          {[mail.Image, mail.Image_1, mail.Image_2, mail.Image_3, mail.Image_4]
                            .filter((img): img is string => !!img)
                            .map((img, imgIdx) => (
                              <img
                                key={imgIdx}
                                src={img}
                                alt="Attachment"
                                onClick={() => { setExpandedImage(img); setImageModalOpen(true); }}
                                style={{ width: "100%", height: "180px", objectFit: "cover", borderRadius: "12px", cursor: "pointer", border: "1px solid rgba(255,255,255,0.1)" }}
                              />
                            ))
                          }
                        </Box>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* Action Bar */}
              <Box sx={{ p: 3, borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "flex-end", bgcolor: "#0A0A0A" }}>
                <Button
                  variant="contained"
                  onClick={() => setReplyModalOpen(true)}
                  sx={{
                    borderRadius: "12px",
                    px: 4,
                    py: 1.5,
                    background: "linear-gradient(90deg, #FF2D55, #7000FF)",
                    fontWeight: 700,
                    boxShadow: "0 4px 15px rgba(255,45,85,0.3)"
                  }}
                >
                  Reply to Thread
                </Button>
              </Box>
            </Box>
          ) : (
            <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 2 }}>
              <Box sx={{ width: 150, height: 150, opacity: 0.1 }}>
                <img src="/empty_mailbox.png" alt="Empty" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </Box>
              <Typography sx={{ color: "rgba(255,255,255,0.2)" }}>Select a mail to view details</Typography>
            </Box>
          )}
        </Box>
      </Box>

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
        handleGrantAccess={handleGrantAccess}
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
    </Box>
  );
};

export default DesktopSent;
