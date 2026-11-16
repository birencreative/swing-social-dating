import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
  Avatar,
} from "@mui/material";
import { ArrowBack } from "@mui/icons-material";

interface ReplyModalProps {
  open: boolean;
  onClose: () => void;
  selectedMail: any;
  profileId: string;
  onReplySuccess?: () => void;
  selectedMailsWithReply?: any[];
}

const ReplyModal = ({
  open,
  onClose,
  selectedMail,
  profileId,
  onReplySuccess,
  selectedMailsWithReply = [],
}: ReplyModalProps) => {
  const [replyMessage, setReplyMessage] = useState("");
  const pushedStateRef = useRef(false);

  useEffect(() => {
    const modalId = "replyModal";
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
  }, [open, onClose]);

  const handleSendReply = async () => {
    if (!replyMessage.trim()) return;

    try {
      const response = await fetch("/api/user/mailbox/reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fromId: profileId,
          toId: selectedMail.ProfileFromId,
          htmlBody: replyMessage,
          subject: selectedMail.subject,
          image1: "",
          image2: "",
          image3: "",
          image4: "",
          image5: "",
          parentId: selectedMail.id,
        }),
      });

      if (response.ok) {
        setReplyMessage("");
        onClose();
        if (onReplySuccess) {
          onReplySuccess();
        }
      }
    } catch (error) {
      console.error("Error sending reply:", error);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      BackdropProps={{
        sx: {
          backdropFilter: "blur(8px)",
        },
      }}
      PaperProps={{
        style: {
          color: "white",
          borderRadius: 4,
          background: "rgba(20, 10, 35, 0.95)",
          backdropFilter: "blur(25px)",
          border: "1px solid rgba(255,255,255,0.08)",
          margin: "12px",
          width: "calc(100% - 24px)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
        },
      }}
    >
      <Box sx={{ position: 'relative', p: 2, pb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            onClick={onClose}
            sx={{ color: "rgba(255,255,255,0.7)", "&:hover": { color: "#FF2D55", bgcolor: "rgba(255,45,85,0.1)" } }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 800, background: "linear-gradient(90deg, #fff, rgba(255,255,255,0.7))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontSize: "1.2rem" }}>
            Reply to Mail
          </Typography>
        </Box>
      </Box>

      <DialogContent
        sx={{
          px: 2.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          "&::-webkit-scrollbar": { width: "6px" },
          "&::-webkit-scrollbar-thumb": { background: "rgba(255,255,255,0.2)", borderRadius: "10px" },
        }}
      >
        {/* Context / Previous Emails */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {selectedMailsWithReply && selectedMailsWithReply.length > 0 ? (
            <Box
              sx={{
                maxHeight: "30vh",
                overflowY: "auto",
                pr: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                "&::-webkit-scrollbar": { width: "4px" },
                "&::-webkit-scrollbar-thumb": { background: "rgba(255,255,255,0.1)", borderRadius: "10px" },
              }}
            >
              {selectedMailsWithReply.map((mail, idx) => (
                <Box
                  key={idx}
                  sx={{
                    bgcolor: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.05)",
                    borderRadius: 3,
                    p: 2,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                    <Avatar src={mail?.Avatar || "/noavatar.png"} sx={{ width: 28, height: 28 }} />
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: "0.85rem", color: "rgba(255,255,255,0.9)" }}>
                        {mail.ProfileFromUsername || "User"}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }}>
                        {mail.CreatedAt ? new Date(mail.CreatedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }) : ""}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", whiteSpace: "pre-wrap", fontSize: "0.85rem" }}>
                    {mail.Body}
                  </Typography>
                </Box>
              ))}
            </Box>
          ) : (
            <Box sx={{ bgcolor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 3, p: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                {selectedMail?.ProfileFromUsername || selectedMail?.from || "User"}
              </Typography>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", whiteSpace: "pre-wrap" }}>
                {selectedMail?.subject ? `RE: ${selectedMail.subject}` : "Replying to message..."}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Input Area */}
        <Box>
          <TextField
            fullWidth
            multiline
            minRows={4}
            maxRows={6}
            placeholder="Type your reply here..."
            value={replyMessage}
            onChange={(e) => setReplyMessage(e.target.value)}
            sx={{
              backgroundColor: "rgba(0,0,0,0.3)",
              borderRadius: 4,
              "& .MuiOutlinedInput-root": {
                color: "white",
                borderRadius: 4,
                padding: "16px",
                fontSize: "0.95rem",
                "& fieldset": {
                  borderColor: "rgba(255,255,255,0.1)",
                  borderWidth: "1px",
                },
                "&:hover fieldset": {
                  borderColor: "rgba(255,255,255,0.2)",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#FF2D55",
                  borderWidth: "1px",
                },
              },
            }}
          />
        </Box>
      </DialogContent>

      <Box sx={{ p: 2.5, pt: 1, borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "flex-end", gap: 1.5 }}>
        <Button
          onClick={onClose}
          sx={{
            borderRadius: "12px",
            py: 1.2,
            px: 3,
            color: "rgba(255,255,255,0.7)",
            fontWeight: 600,
            fontSize: "0.9rem",
            "&:hover": { bgcolor: "rgba(255,255,255,0.05)" }
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSendReply}
          disabled={!replyMessage.trim()}
          sx={{
            borderRadius: "12px",
            py: 1.2,
            px: 4,
            background: "linear-gradient(90deg, #FF2D55, #7000FF)",
            color: "#fff",
            fontWeight: 700,
            fontSize: "0.9rem",
            boxShadow: "0 4px 15px rgba(255,45,85,0.3)",
            "&:hover": { opacity: 0.9 },
            "&.Mui-disabled": {
              background: "rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.3)",
              boxShadow: "none"
            }
          }}
        >
          Send Reply
        </Button>
      </Box>
    </Dialog>
  );
};

export default ReplyModal;
