"use client";

import { useEffect, useRef, useState } from "react";
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  IconButton,
  TextField,
  Drawer,
  Modal,
  useMediaQuery,
  Badge,
  Dialog,
  DialogContent,
  Popover,
} from "@mui/material";
import axios from "axios";
import Header from "@/components/Header";
import Picker from "emoji-picker-react";
import { useRouter } from "next/navigation";
import {
  Send as SendIcon,
  EmojiEmotions as EmojiIcon,
  Image as ImageIcon,
  Done as DoneIcon,
  DoneAll as DoneAllIcon,
  CameraAlt as CameraIcon,
} from "@mui/icons-material";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import UserProfileModal from "@/components/UserProfileModal";
import { X, Pencil, Trash2, MoreVertical, Ban } from "lucide-react";
import { sendNotification } from "@/utils/notifications";
import { getSocket } from "@/lib/socket";
import AppFooterDesktop from "@/layout/AppFooterDesktop";
import AppHeaderMobile from "@/layout/AppHeaderMobile";
import { useSocketContext } from "@/context/SocketProvider";

const typingDots = (
  <Box sx={{ display: "inline-flex", ml: 0.5 }}>
    {[0, 1, 2].map((i) => (
      <Box
        key={i}
        sx={{
          width: 4,
          height: 4,
          bgcolor: "#4CAF50",
          borderRadius: "50%",
          mx: 0.3,
          animation: "typing 1.4s infinite",
          animationDelay: `${i * 0.2}s`,
        }}
      />
    ))}

    <style>
      {`
        @keyframes typing {
          0% { opacity: 0.3; }
          20% { opacity: 1; }
          100% { opacity: 0.3; }
        }
      `}
    </style>
  </Box>
);

dayjs.extend(relativeTime);

type Params = {
  id?: string;
};

interface DesktopChatListProps {
  userId?: string;
}

const MobileChatList = ({ userId }: DesktopChatListProps) => {
  const { refetchUnreadCount } = useSocketContext();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<any>({});
  const [myProfile, setMyProfile] = useState<any>({});
  const isMobile = useMediaQuery("(max-width: 480px)") ? true : false;
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const scrollWrapperRef = useRef<HTMLDivElement | null>(null);
  const [showDetail, setShowDetail] = useState<any>(false);
  const [selectedUserId, setSelectedUserId] = useState<any>(null);
  const [messages, setMessages] = useState<any>([]);
  const [openImage, setOpenImage] = useState<string | null>(null);
  const [chatList, setChatList] = useState<any>([]);
  const [newMessage, setNewMessage] = useState("");
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [userDeviceToken, setUserDeviceToken] = useState(null);
  const [profileId, setProfileId] = useState<any>();
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const listenersSetupRef = useRef(false);

  // Edit and Delete message states
  const [editingMessage, setEditingMessage] = useState<{ id: string; tempId?: string; text: string } | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [activeMenuMessage, setActiveMenuMessage] = useState<any | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const socket = getSocket();

    const handleConnect = () => {
      if (profileId) {
        socket.emit("user:online", profileId);
      }
      if (userId) {
        socket.emit("user:get_status", userId);
      }
    };

    const handleDisconnect = () => {
      console.log("❌ Socket disconnected");
    };

    const handleUserStatus = ({ userId: statusUserId, online, lastSeen }: any) => {
      console.log("📡 user:status event received:", { statusUserId, online, lastSeen });
      if (statusUserId && userId && String(statusUserId).toLowerCase() === String(userId).toLowerCase()) {
        setIsOnline(online);
        setLastSeen(lastSeen);
        setUserProfile((prev: any) => ({
          ...prev,
          isOnline: online,
          LastOnline: online ? null : lastSeen,
        }));
      }
    };

    const handleTypingStart = ({ from }: any) => {
      console.log("⌨️ typing:start from:", from);
      if (from && userId && String(from).toLowerCase() === String(userId).toLowerCase()) {
        setIsTyping(true);
        setIsOnline(true);
      }
    };

    const handleTypingStop = ({ from }: any) => {
      console.log("⌨️ typing:stop from:", from);
      if (from && userId && String(from).toLowerCase() === String(userId).toLowerCase()) {
        setIsTyping(false);
      }
    };

    const handleChatReceive = (msg: any) => {
      console.log("📩 chat:receive event:", msg);
      if (msg.MemberIdFrom && userId && String(msg.MemberIdFrom).toLowerCase() === String(userId).toLowerCase()) {
        setIsOnline(true);
        setLastSeen(null);
      }

      setMessages((prev: any) => {
        const exists = prev.some((m: any) => {
          if (m.ConversationId && msg.ConversationId && String(m.ConversationId) === String(msg.ConversationId)) {
            return true;
          }
          if (
            m.MemberIdFrom && msg.MemberIdFrom &&
            String(m.MemberIdFrom).toLowerCase() === String(msg.MemberIdFrom).toLowerCase() &&
            m.Conversation === msg.Conversation &&
            Math.abs(new Date(m.CreatedAt || Date.now()).getTime() - new Date(msg.CreatedAt || Date.now()).getTime()) < 10000
          ) {
            return true;
          }
          return false;
        });

        if (exists) return prev;
        return [...prev, msg];
      });

      if (msg.MemberIdTo && profileId && String(msg.MemberIdTo).toLowerCase() === String(profileId).toLowerCase()) {
        socket.emit("message:delivered", {
          from: profileId,
          to: msg.MemberIdFrom,
          messageIds: [msg.ConversationId],
        });
      }
    };

    const handleMessageDelivered = ({ messageIds, deliveredAt }: any) => {
      console.log("✓✓ message:delivered event:", { messageIds, deliveredAt });
      setMessages((prev: any[]) =>
        prev.map((m) =>
          messageIds.includes(m.ConversationId) ? { ...m, deliveredAt } : m
        )
      );
    };

    const handleMessageRead = ({ messageIds, readAt }: any) => {
      console.log("✓✓ message:read event:", { messageIds, readAt });
      setMessages((prev: any[]) =>
        prev.map((m) =>
          messageIds.includes(m.ConversationId) ? { ...m, readAt } : m
        )
      );
    };

    const handleChatEdit = (payload: any) => {
      const targetId = payload?.ConversationId || payload?.messageId || payload?.id;
      const tempId = payload?.tempId;
      const updatedText = payload?.newText || payload?.text || payload?.Conversation;

      if ((targetId || tempId) && updatedText) {
        setMessages((prev: any[]) =>
          prev.map((m: any) => {
            const mId = m.id || m.Id || m.ConversationId;
            const mTempId = m.tempId;

            const match =
              (targetId && String(mId).toLowerCase() === String(targetId).toLowerCase()) ||
              (tempId && String(mId).toLowerCase() === String(tempId).toLowerCase()) ||
              (targetId && mTempId && String(mTempId).toLowerCase() === String(targetId).toLowerCase()) ||
              (tempId && mTempId && String(mTempId).toLowerCase() === String(tempId).toLowerCase());

            return match ? { ...m, Conversation: updatedText, isEdited: true, is_edited: true } : m;
          })
        );
      }
    };

    const handleChatDelete = (payload: any) => {
      const targetId = payload?.ConversationId || payload?.messageId || payload?.id;
      const tempId = payload?.tempId;

      if (targetId || tempId) {
        setMessages((prev: any[]) =>
          prev.map((m: any) => {
            const mId = m.id || m.Id || m.ConversationId;
            const mTempId = m.tempId;

            const match =
              (targetId && String(mId).toLowerCase() === String(targetId).toLowerCase()) ||
              (tempId && String(mId).toLowerCase() === String(tempId).toLowerCase()) ||
              (targetId && mTempId && String(mTempId).toLowerCase() === String(targetId).toLowerCase()) ||
              (tempId && mTempId && String(mTempId).toLowerCase() === String(tempId).toLowerCase());

            return match ? { ...m, Conversation: "This message was deleted", isDeleted: true } : m;
          })
        );
      }
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("user:status", handleUserStatus);
    socket.on("typing:start", handleTypingStart);
    socket.on("typing:stop", handleTypingStop);
    socket.on("chat:receive", handleChatReceive);
    socket.on("chat:edit", handleChatEdit);
    socket.on("chat:delete", handleChatDelete);
    socket.on("message:delivered", handleMessageDelivered);
    socket.on("message:read", handleMessageRead);

    // If already connected, trigger online status and get partner's status immediately
    if (socket.connected) {
      if (profileId) {
        socket.emit("user:online", profileId);
      }
      if (userId) {
        socket.emit("user:get_status", userId);
      }
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("user:status", handleUserStatus);
      socket.off("typing:start", handleTypingStart);
      socket.off("typing:stop", handleTypingStop);
      socket.off("chat:receive", handleChatReceive);
      socket.off("chat:edit", handleChatEdit);
      socket.off("chat:delete", handleChatDelete);
      socket.off("message:delivered", handleMessageDelivered);
      socket.off("message:read", handleMessageRead);
    };
  }, [profileId, userId]);

  useEffect(() => {
    const socket = getSocket();

    const onReceive = (msg: any) => {
      setMessages((prev: any[]) => {
        // prevent duplicates
        if (prev.some((m) => m.ConversationId === msg.ConversationId)) {
          return prev;
        }
        return [...prev, msg];
      });
    };

    socket.on("chat:receive", onReceive);

    return () => {
      socket.off("chat:receive", onReceive);
    };
  }, []);

  useEffect(() => {
    if (!profileId) return;

    const socket = getSocket();
    if (socket.connected) {
      socket.emit("user:online", profileId);
    } else {
      socket.once("connect", () => {
        socket.emit("user:online", profileId);
      });
    }
  }, [profileId]);

  useEffect(() => {
    const messageElements = document.querySelectorAll(".message-content img");

    const handleClick = (e: Event) => {
      const target = e.target as HTMLImageElement;
      if (target.src) {
        setOpenImage(target.src);
      }
    };

    messageElements.forEach((img) => {
      const imageElement = img as HTMLImageElement;
      imageElement.style.cursor = "pointer";
      imageElement.addEventListener("click", handleClick);
    });

    return () => {
      messageElements.forEach((img) => {
        const imageElement = img as HTMLImageElement;
        imageElement.removeEventListener("click", handleClick);
      });
    };
  }, [messages]);

  const useImageClickHandler = (onImageClick: (src: string) => void) => {
    useEffect(() => {
      const handleDocumentClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;

        if (target.tagName === "IMG" && target.closest(".message-content")) {
          const imgSrc = target.getAttribute("src");
          if (imgSrc) {
            onImageClick(imgSrc);
          }
        }
      };

      document.addEventListener("click", handleDocumentClick);

      return () => {
        document.removeEventListener("click", handleDocumentClick);
      };
    }, [onImageClick]);
  };

  const handleImageOpen = (src: string) => {
    setOpenImage(src);
    window.history.pushState({ modal: "imagePreview" }, "");
  };

  const closeImagePreview = () => {
    setOpenImage(null);
    if (window.history.state?.modal === "imagePreview") {
      window.history.back();
    }
  };

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (openImage) {
        setOpenImage(null);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [openImage]);

  useImageClickHandler((src) => handleImageOpen(src));

  useEffect(() => {
    const handleImageClick = (e: Event) => {
      const target = e.target as HTMLElement;

      if (target.tagName === "IMG" && target.closest(".message-content")) {
        const imgElement = target as HTMLImageElement;
        if (imgElement.src) {
          handleImageOpen(imgElement.src);
        }
      }
    };

    document.addEventListener("click", handleImageClick);

    return () => {
      document.removeEventListener("click", handleImageClick);
    };
  }, []);

  useEffect(() => {
    const storedProfileId = localStorage.getItem("logged_in_profile");
    if (storedProfileId) {
      setProfileId(storedProfileId);
    }
  }, []);

  useEffect(() => {
    const wrapper = scrollWrapperRef.current;
    if (!wrapper) return;

    const resizeObserver = new ResizeObserver(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });

    resizeObserver.observe(wrapper);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const handleClose = () => {
    setShowDetail(false);
    setSelectedUserId(null);
    if (window.history.state?.modal === "userProfile") {
      window.history.back();
    }
  };

  const handleGrantAccess = async () => {
    try {
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    if (!userId) return;

    getUserProfile(userId);
  }, [userId]);

  useEffect(() => {
    if (userProfile) {
      setUserDeviceToken(userProfile?.Device_Token);
    }
  }, [userProfile]);

  const getUserProfile = async (userId: string) => {
    if (userId) {
      try {
        const response = await fetch(`/api/user/sweeping/user?id=${userId}`);
        if (!response.ok) {
          console.error(
            "Failed to fetch advertiser data:",
            response.statusText,
          );
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const { user: userData } = await response.json();
        if (!userData) {
          console.error("Advertiser not found");
        } else {
          setUserProfile(userData);
        }
      } catch (error: any) {
        console.error("Error fetching data:", error.message);
      }
    }
  };

  const getMyProfile = async (userId: string) => {
    if (userId) {
      try {
        const response = await fetch(`/api/user/sweeping/user?id=${userId}`);
        if (!response.ok) {
          console.error(
            "Failed to fetch advertiser data:",
            response.statusText,
          );
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const { user: userData } = await response.json();
        if (!userData) {
          console.error("Advertiser not found");
        } else {
          setMyProfile(userData);
        }
      } catch (error: any) {
        console.error("Error fetching data:", error.message);
      }
    }
  };

  const findExistingChatIndex = (username: string) => {
    return chatList.findIndex((chat: any) => chat.Username === username);
  };

  const existingChatIndex = userProfile
    ? findExistingChatIndex(userProfile.Username)
    : -1;

  const sendNotifications = async (message: any) => {
    // Push notifications are handled automatically on the server by /api/user/messaging.
    // Disabling client-side duplicate dispatch.
    return;
  };

  const handleTyping = (value: string) => {
    const socket = getSocket();
    setNewMessage(value);

    if (!userProfile?.Id) return;

    socket.emit("typing:start", {
      from: profileId,
      to: userProfile?.Id,
    });

    clearTimeout((window as any).__typingTimer);
    (window as any).__typingTimer = setTimeout(() => {
      socket.emit("typing:stop", {
        from: profileId,
        to: userProfile?.Id,
      });
    }, 800);
  };

  const handleOpenMessageMenu = (event: React.MouseEvent<HTMLElement>, message: any) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setActiveMenuMessage(message);
  };

  const handleCloseMessageMenu = () => {
    setMenuAnchorEl(null);
    setActiveMenuMessage(null);
  };

  const startEditingMessage = (msg: any) => {
    if (!msg) return;
    const msgText = (msg.Conversation || msg.text || "").replace(/<[^>]*>?/gm, "").trim();
    const msgId = msg.Id || msg.id || msg.ConversationId;
    const tempId = msg.tempId || (String(msgId).startsWith("temp-") ? msgId : undefined);

    setEditingMessage({
      id: String(msgId),
      tempId: tempId ? String(tempId) : undefined,
      text: msgText,
    });
    setNewMessage(msgText);
    handleCloseMessageMenu();
  };

  const cancelEditingMessage = () => {
    setEditingMessage(null);
    setNewMessage("");
  };

  const handleDeleteMessage = async (msg: any) => {
    if (!msg) return;
    const msgId = msg.Id || msg.id || msg.ConversationId;
    const tempId = msg.tempId || (String(msgId).startsWith("temp-") ? msgId : undefined);
    handleCloseMessageMenu();

    // Optimistic UI update
    setMessages((prev: any[]) =>
      prev.map((m: any) => {
        const mId = m.Id || m.id || m.ConversationId;
        const match =
          (msgId && String(mId) === String(msgId)) ||
          (tempId && (String(m.tempId) === String(tempId) || String(mId) === String(tempId)));
        return match ? { ...m, Conversation: "You deleted this message", isDeleted: true } : m;
      })
    );

    // Emit socket event for real-time deletion
    const socket = getSocket();
    if (socket) {
      socket.emit("chat:delete", {
        ConversationId: msgId,
        tempId: tempId,
        MemberIdFrom: profileId,
        MemberIdTo: userProfile?.Id || userId,
        toId: userProfile?.Id || userId,
        fromId: profileId,
      });
    }

    // Call REST API backend
    try {
      await fetch("/api/user/messaging/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId: msgId,
          tempId: tempId,
          fromId: profileId,
          toId: userProfile?.Id || userId,
        }),
      });
    } catch (err) {
      console.error("Error deleting message:", err);
    }

    setToastMessage("Message deleted");
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !profileId || !userProfile?.Id || !myProfile)
      return;

    const socket = getSocket();

    // Handle Editing existing message
    if (editingMessage) {
      const updatedText = newMessage.trim();
      if (!updatedText) return;

      const editId = editingMessage.id;
      const tempId = editingMessage.tempId;

      setMessages((prev: any[]) =>
        prev.map((m: any) => {
          const mId = m.Id || m.id || m.ConversationId;
          const match =
            String(mId) === String(editId) ||
            (tempId && (String(m.tempId) === String(tempId) || String(mId) === String(tempId)));

          if (match) {
            return { ...m, Conversation: updatedText, isEdited: true, is_edited: true };
          }
          return m;
        })
      );

      setEditingMessage(null);
      setNewMessage("");

      const targetToId = userProfile?.Id || userId;
      const targetFromId = profileId || myProfile?.Id;

      socket?.emit?.("chat:edit", {
        ConversationId: editId,
        tempId: tempId,
        MemberIdFrom: targetFromId,
        MemberIdTo: targetToId,
        toId: targetToId,
        fromId: targetFromId,
        newText: updatedText,
        text: updatedText,
      });

      try {
        await fetch("/api/user/messaging/edit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messageId: editId,
            tempId: tempId,
            fromId: targetFromId,
            toId: targetToId,
            text: updatedText,
          }),
        });
      } catch (err) {
        console.error("Error editing message:", err);
      }

      return;
    }
    const tempConversationId = `temp-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const newUserMessage = {
      AvatarFrom: myProfile?.Avatar || "/noavatar.png",
      AvatarTo: userProfile?.Avatar,
      ChatId: "temporary-chat-id",
      Conversation: newMessage,
      ConversationId: tempConversationId,
      CreatedAt: new Date().toISOString(),
      FromUsername: myProfile?.Username || "You",
      MemberIdFrom: profileId,
      MemberIdTo: userProfile?.Id,
      ToUsername: userProfile?.Username || "Recipient",
      lastcommentinserted: 1,
      readAt: null,
    };

    // Optimistic update
    setMessages((prev: any) => [...prev, newUserMessage]);
    setNewMessage("");

    // Emit socket message
    socket.emit("chat:send", {
      ...newUserMessage,
      ConversationId: tempConversationId,
    });

    // Update local cache for ticks and unread status
    try {
      const chatCache = JSON.parse(localStorage.getItem("chat_metadata_cache") || "{}");
      chatCache[userProfile.Id] = {
        lastSenderId: myProfile.Id,
        lastMessageText: newMessage,
        lastSeenTime: new Date().toISOString(),
      };
      localStorage.setItem("chat_metadata_cache", JSON.stringify(chatCache));
    } catch (e) { }

    // Send notification if needed
    if (userDeviceToken) {
      sendNotifications(newMessage);
    }

    // Save to database
    const payload = {
      chatid:
        existingChatIndex === -1 ? 0 : chatList[existingChatIndex]?.ChatId,
      ProfileIdfrom: myProfile?.Id,
      ProfileIDto: userProfile?.Id,
      Conversation: newMessage,
    };

    try {
      const response = await fetch("/api/user/messaging", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error saving message:", errorData);
      }
    } catch (error) {
      console.error("Network error while sending message:", error);
    }
  };

  const handleEmojiClick = (emoji: any) => {
    setNewMessage((prev) => prev + emoji.emoji);
  };



  const uploadToCloudinary = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "dating_unsigned");
      formData.append("folder", "dating-app/chat-images");

      const res = await fetch("https://api.cloudinary.com/v1_1/dkkf79biv/image/upload", {
        method: "POST",
        body: formData
      });
      if (!res.ok) throw new Error("Cloudinary upload failed");
      const data = await res.json();
      return data.secure_url || null;
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      return null;
    }
  };

  const handleCameraUpload = async (event: any) => {
    const file = event.target.files?.[0];
    if (file) {
      const socket = getSocket();
      const tempConversationId = `temp-img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // 1. Local preview reader for instant rendering
      const reader: any = new FileReader();
      reader.onload = () => {
        const newUserMessage = {
          AvatarFrom: myProfile?.Avatar || "/noavatar.png",
          AvatarTo: userProfile?.Avatar,
          ChatId: chatList[existingChatIndex]?.ChatId || "temporary-chat-id",
          Conversation: `<img src="${reader.result && typeof reader.result === "string" && reader.result.trim() !== ""
              ? reader.result
              : "/noavatar.png"
            }" alt="Uploaded" style="max-width: 100px; border-radius: 8px;"/>`,
          ConversationId: tempConversationId,
          CreatedAt: new Date().toISOString(),
          FromUsername: myProfile?.Username || "You",
          MemberIdFrom: profileId,
          MemberIdTo: userProfile?.Id,
          ToUsername: userProfile?.Username || "Recipient",
          lastcommentinserted: 1,
          readAt: null,
        };

        setMessages((prev: any) => [...prev, newUserMessage]);

        if (userDeviceToken) {
          sendNotifications(newUserMessage?.Conversation);
        }
      };
      reader.readAsDataURL(file);

      // 2. Perform background image upload to retrieve hosted Cloudinary URL
      let imageUrl: any = await uploadToCloudinary(file);
      if (!imageUrl) {
        console.error("Camera image upload to Cloudinary failed");
        return;
      }

      const hostedMessageHtml = `<img src="${imageUrl}" alt="Uploaded" style="max-width: 100px; border-radius: 8px;"/>`;

      // 3. Emit the message with final hosted URL via WebSockets
      const finalConversationId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const socketMessage = {
        AvatarFrom: myProfile?.Avatar || "/noavatar.png",
        AvatarTo: userProfile?.Avatar,
        ChatId: chatList[existingChatIndex]?.ChatId || "temporary-chat-id",
        Conversation: hostedMessageHtml,
        ConversationId: finalConversationId,
        CreatedAt: new Date().toISOString(),
        FromUsername: myProfile?.Username || "You",
        MemberIdFrom: profileId,
        MemberIdTo: userProfile?.Id,
        ToUsername: userProfile?.Username || "Recipient",
        lastcommentinserted: 1,
        readAt: null,
      };

      socket.emit("chat:send", socketMessage);

      // 4. Update local messages state: replace Base64 with hosted CDN URL
      setMessages((prev: any) =>
        prev.map((m: any) =>
          m.ConversationId === tempConversationId
            ? { ...m, Conversation: hostedMessageHtml, ConversationId: finalConversationId }
            : m
        )
      );

      // 5. Update local cache
      try {
        const chatCache = JSON.parse(localStorage.getItem("chat_metadata_cache") || "{}");
        chatCache[userProfile.Id] = {
          lastSenderId: myProfile.Id,
          lastMessageText: "[Image]",
          lastSeenTime: new Date().toISOString(),
        };
        localStorage.setItem("chat_metadata_cache", JSON.stringify(chatCache));
      } catch (e) { }

      // 6. Save to database for persistence
      const payload = {
        chatid:
          existingChatIndex === -1 ? 0 : chatList[existingChatIndex]?.ChatId,
        ProfileIdfrom: myProfile?.Id,
        ProfileIDto: userProfile?.Id,
        Conversation: hostedMessageHtml,
      };

      try {
        const response: any = await fetch("/api/user/messaging", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        if (response.ok) {
          const result = await response.json();
        } else {
          const errorData = await response.json();
          console.error("Error sending camera image message:", errorData);
        }
      } catch (error) {
        console.error("Network error while sending camera image message:", error);
      }
    }
  };

  const handleImageUpload = async (event: any) => {
    const file = event.target.files[0];
    if (file) {
      const socket = getSocket();
      const tempConversationId = `temp-img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // 1. Local preview reader for instant rendering
      const reader: any = new FileReader();
      reader.onload = () => {
        const newUserMessage = {
          AvatarFrom: myProfile?.Avatar || "/noavatar.png",
          AvatarTo: userProfile?.Avatar,
          ChatId: chatList[existingChatIndex]?.ChatId || "temporary-chat-id",
          Conversation: `<img src="${reader.result && typeof reader.result === "string" && reader.result.trim() !== ""
              ? reader.result
              : "/noavatar.png"
            }" alt="Uploaded" style="max-width: 100px; border-radius: 8px;"/>`,
          ConversationId: tempConversationId,
          CreatedAt: new Date().toISOString(),
          FromUsername: myProfile?.Username || "You",
          MemberIdFrom: profileId,
          MemberIdTo: userProfile?.Id,
          ToUsername: userProfile?.Username || "Recipient",
          lastcommentinserted: 1,
          readAt: null,
        };

        setMessages((prev: any) => [...prev, newUserMessage]);

        if (userDeviceToken) {
          sendNotifications(newUserMessage?.Conversation);
        }
      };
      reader.readAsDataURL(file);

      // 2. Perform background image upload to retrieve hosted blob/CDN URL
      let imageUrl: any = await uploadToCloudinary(file);
      if (!imageUrl) {
        console.error("Image upload failed");
        return;
      }

      const hostedMessageHtml = `<img src="${imageUrl}" alt="Uploaded" style="max-width: 100px; border-radius: 8px;"/>`;

      // 3. Emit the message with final hosted URL via WebSockets
      const finalConversationId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const socketMessage = {
        AvatarFrom: myProfile?.Avatar || "/noavatar.png",
        AvatarTo: userProfile?.Avatar,
        ChatId: chatList[existingChatIndex]?.ChatId || "temporary-chat-id",
        Conversation: hostedMessageHtml,
        ConversationId: finalConversationId,
        CreatedAt: new Date().toISOString(),
        FromUsername: myProfile?.Username || "You",
        MemberIdFrom: profileId,
        MemberIdTo: userProfile?.Id,
        ToUsername: userProfile?.Username || "Recipient",
        lastcommentinserted: 1,
        readAt: null,
      };

      socket.emit("chat:send", socketMessage);

      // 4. Update local messages state: replace Base64 with hosted CDN URL
      setMessages((prev: any) =>
        prev.map((m: any) =>
          m.ConversationId === tempConversationId
            ? { ...m, Conversation: hostedMessageHtml, ConversationId: finalConversationId }
            : m
        )
      );

      // 5. Update local cache
      try {
        const chatCache = JSON.parse(localStorage.getItem("chat_metadata_cache") || "{}");
        chatCache[userProfile.Id] = {
          lastSenderId: myProfile.Id,
          lastMessageText: "[Image]",
          lastSeenTime: new Date().toISOString(),
        };
        localStorage.setItem("chat_metadata_cache", JSON.stringify(chatCache));
      } catch (e) { }

      // 6. Save to database for persistence
      const payload = {
        chatid:
          existingChatIndex === -1 ? 0 : chatList[existingChatIndex]?.ChatId,
        ProfileIdfrom: myProfile?.Id,
        ProfileIDto: userProfile?.Id,
        Conversation: hostedMessageHtml,
      };

      try {
        const response: any = await fetch("/api/user/messaging", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        if (response.ok) {
          const result = await response.json();
        } else {
          const errorData = await response.json();
          console.error("Error sending image message:", errorData);
        }
      } catch (error) {
        console.error("Network error while sending image message:", error);
      }
    }
  };

  useEffect(() => {
    if (profileId) {
      getCurrentLocation();
      getMyProfile(profileId);
      fetchAllChats();
    }
  }, [profileId]);

  const fetchAllChats = async () => {
    try {
      let profileid = await localStorage.getItem("logged_in_profile");
      const response = await axios.get(
        `/api/user/messaging?profileid=${profileid}`,
      );
      setChatList(response.data.data);
    } catch (err: any) {
      console.error("Error fetching chats:", err);
    }
  };

  useEffect(() => {
    if (profileId && userId) {
      fetchChatConversation(profileId, userId);
    }
  }, [profileId, userId]);

  const fetchChatConversation = async (profileId: any, userId: any) => {
    try {
      const payload = {
        ProfileIdfrom: profileId,
        ProfileIDto: userId,
      };
      const response = await fetch("/api/user/messaging/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        const result = await response.json();
        const enriched = (result?.data || []).map((m: any) => ({
          ...m,
          deliveredAt: m.deliveredAt || m.CreatedAt,
          readAt: m.readAt || (m.Viewed === 1 ? m.CreatedAt : null)
        }));
        setMessages((prevMessages: any) => [...prevMessages, ...enriched]);

        // Mark any notifications for this chat as read and refetch unread counts
        fetch("/api/user/messaging/chat/read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            profileId,
            otherUserId: userId,
          }),
        })
          .then(() => {
            refetchUnreadCount();
          })
          .catch(console.error);
      } else {
        const errorData = await response.json();
        console.error("Error sending message:", errorData);
      }
    } catch (err: any) {
      console.error("Error fetching chats:", err);
    }
  };

  useEffect(() => {
    if (userId) {
      getUserProfile(userId);
    }
  }, [userId]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const locationName = await getLocationName(latitude, longitude);
          await sendLocationToAPI(locationName, latitude, longitude);
        },
        (error: any) => {
          console.error("Geolocation error:", error);
        },
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  };

  const getLocationName = async (latitude: number, longitude: number) => {
    const apiKey = "AIzaSyBEr0k_aQ_Sns6YbIQ4UBxCUTdPV9AhdF0";

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`,
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.status === "OK" && data.results.length > 0) {
        return data.results[0].formatted_address;
      }

      console.error("No results found or status not OK:", data);
      return "Unknown Location";
    } catch (error) {
      console.error("Error fetching location name:", error);
      return "Unknown Location";
    }
  };

  const sendLocationToAPI = async (
    locationName: string,
    latitude: number,
    longitude: number,
  ) => {
    if (!profileId) {
      console.error("Profile ID is missing.");
      return;
    }

    try {
      const response = await fetch("/api/user/location", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profileId,
          locationName,
          latitude,
          longitude,
        }),
      });

      const data = await response.json();
      if (response.ok) {
      } else {
        console.error("Error sending location:", data.message);
      }
    } catch (error) {
      console.error("Error sending location to API:", error);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.visualViewport) {
        const keyboardHeight =
          window.innerHeight - window.visualViewport.height;

        document.documentElement.style.setProperty(
          "--keyboard-offset",
          `${Math.max(keyboardHeight, 0)}px`,
        );
      }
    };

    window.visualViewport?.addEventListener("resize", handleResize);
    return () =>
      window.visualViewport?.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const socket = getSocket();

    socket.on("typing:start", ({ from }) => {
      if (from === userProfile?.Id) {
        setIsTyping(true);
      }
    });

    socket.on("typing:stop", ({ from }) => {
      if (from === userProfile?.Id) {
        setIsTyping(false);
      }
    });

    return () => {
      socket.off("typing:start");
      socket.off("typing:stop");
    };
  }, [userProfile?.Id]);

  useEffect(() => {
    if (!profileId || !userProfile?.Id) return;

    const unreadIds = messages
      .filter((m: any) => m.MemberIdFrom && userProfile.Id && String(m.MemberIdFrom).toLowerCase() === String(userProfile.Id).toLowerCase() && !m.readAt)
      .map((m: any) => m.ConversationId);

    if (!unreadIds.length) return;

    const socket = getSocket();
    socket.emit("message:read", {
      from: profileId,
      to: userProfile.Id,
      messageIds: unreadIds,
    });

    // Mark as read in database
    fetch("/api/user/messaging/chat/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profileId,
        otherUserId: userProfile.Id,
      }),
    })
      .then(() => {
        refetchUnreadCount();
      })
      .catch(console.error);
  }, [messages.length, profileId, userProfile?.Id, refetchUnreadCount]);

  useEffect(() => {
    const socket = getSocket();

    const handler = ({ messageIds, readAt }: any) => {
      setMessages((prev: any) =>
        prev.map((m: any) =>
          messageIds.includes(m.ConversationId) ? { ...m, readAt } : m,
        ),
      );
    };

    socket.on("message:read", handler);

    return () => {
      socket.off("message:read", handler);
    };
  }, []);

  return (
    <>
      <Box
        sx={{
          background: "linear-gradient(160deg, #14071f 0%, #0a0412 100%)",
          height: "100dvh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          color: "#fff",
        }}
      >
        <AppHeaderMobile />

        {/* Chat Header - User Info */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.8,
            px: 2,
            py: 1.4,
            flexShrink: 0,
            cursor: "pointer",

            // 🔥 Modern gradient header
            background: "linear-gradient(135deg, #0F0F1A, #1A1A2E)",

            // glass effect
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",

            transition: "all 0.25s ease",

            "&:hover": {
              background: "linear-gradient(135deg, #141427, #202040)",
            },
          }}
          onClick={() => {
            setShowDetail(true);
            setSelectedUserId(userProfile?.Id);
            window.history.pushState({ modal: "userProfile" }, "");
          }}
        >
          {/* Avatar */}
          <Box sx={{ position: "relative" }}>
            <Avatar
              src={userProfile?.Avatar}
              alt={userProfile?.Username}
              sx={{
                width: 42,
                height: 42,
                border: "2px solid rgba(255,255,255,0.08)",
              }}
            />

            {/* 🟢 Online Indicator */}
            {isOnline && (
              <Box
                sx={{
                  position: "absolute",
                  bottom: 2,
                  right: 2,
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  backgroundColor: "#00E676",
                  border: "2px solid #0F0F1A",
                }}
              />
            )}
          </Box>

          {/* User Info */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 600,
                color: "#fff",
                fontSize: 15,
                letterSpacing: 0.2,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {userProfile?.Username || "User"}
            </Typography>

            {/* Status */}
            <Box sx={{ minHeight: 18, display: "flex", alignItems: "center" }}>
              {isTyping ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Typography fontSize={12} color="#FF4D8D" fontWeight={500}>
                    typing
                  </Typography>
                  {typingDots}
                </Box>
              ) : isOnline ? (
                <Typography fontSize={12} color="#00E676" fontWeight={500}>
                  Online
                </Typography>
              ) : (
                <Typography fontSize={12} color="rgba(255,255,255,0.5)">
                  {(() => {
                    let effectiveLastSeen = lastSeen;
                    if (messages && messages.length > 0 && userId) {
                      const partnerMsgs = messages.filter(
                        (m: any) => String(m.MemberIdFrom || m.fromId || m.senderId || "").toLowerCase() === String(userId).toLowerCase()
                      );
                      if (partnerMsgs.length > 0) {
                        const latestMsg = partnerMsgs[partnerMsgs.length - 1];
                        const msgTimeStr = latestMsg.CreatedAt || latestMsg.createdAt || latestMsg.LastUp;
                        if (msgTimeStr) {
                          const msgTime = new Date(msgTimeStr).getTime();
                          const currentLastSeenTime = lastSeen ? new Date(lastSeen).getTime() : 0;
                          if (!isNaN(msgTime) && msgTime > (isNaN(currentLastSeenTime) ? 0 : currentLastSeenTime)) {
                            effectiveLastSeen = new Date(msgTime).toISOString();
                          }
                        }
                      }
                    }
                    return effectiveLastSeen ? `Last seen ${dayjs(effectiveLastSeen).fromNow()}` : "Offline";
                  })()}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>

        {/* Messages List */}
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            px: 2,
            py: 2,
            pb: "calc(72px + env(safe-area-inset-bottom, 0px))", // Dynamically match input height plus safe area for optimal spacing

            // 🔥 Glass background
            background: "linear-gradient(180deg, #0B0B14, #111122)",
            backdropFilter: "blur(10px)",

            // Rounded container
            borderTopLeftRadius: "24px",
            borderTopRightRadius: "24px",

            WebkitOverflowScrolling: "touch",

            // Subtle inner glow
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
          }}
        >
          <Box
            ref={scrollWrapperRef}
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
            }}
          >
            {messages?.map((m: any, i: number) => {
              if (!m?.ChatId) return null;

              const isMe = m?.MemberIdFrom === profileId;

              return (
                <Box
                  key={i}
                  sx={{
                    display: "flex",
                    justifyContent: isMe ? "flex-end" : "flex-start",
                  }}
                >
                  <Box
                    sx={{
                      px: 1.8,
                      py: 1.0, // Clean, normal bubble padding without excessive spacing
                      borderRadius: "18px",
                      color: "#fff",
                      maxWidth: "75%",
                      display: "inline-flex", // Use inline-flex to flow text and time together dynamically
                      flexWrap: "wrap",
                      justifyContent: "flex-end",
                      alignItems: "flex-end",
                      gap: 1.0, // Gap between text and timestamp

                      ...(isMe
                        ? {
                          background:
                            "linear-gradient(135deg, #FF4D8D, #7B61FF)",
                          borderBottomRightRadius: "6px",
                        }
                        : {
                          background:
                            "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
                          backdropFilter: "blur(12px)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderBottomLeftRadius: "6px",
                        }),

                      // Image styles
                      "& img": {
                        width: "100%",
                        height: "auto",
                        borderRadius: "12px",
                        display: "block",
                        objectFit: "contain",
                        marginTop: "4px",
                      },
                    }}
                  >
                    {(() => {
                      const isDeleted =
                        m?.isDeleted ||
                        m?.is_deleted ||
                        m?.Conversation === "This message was deleted" ||
                        m?.Conversation === "You deleted this message";

                      if (isDeleted) {
                        return (
                          <Box
                            component="span"
                            sx={{
                              fontSize: 14,
                              lineHeight: 1.5,
                              flex: "1 1 auto",
                              fontStyle: "italic",
                              color: isMe ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.65)",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 0.8,
                            }}
                          >
                            <Ban size={15} style={{ opacity: 0.85 }} />
                            {isMe ? "You deleted this message" : "This message was deleted"}
                          </Box>
                        );
                      }

                      return (
                        <Typography
                          component="span"
                          className="message-content"
                          sx={{
                            fontSize: 14,
                            lineHeight: 1.5,
                            flex: "1 1 auto",
                            wordBreak: "break-word",
                            whiteSpace: "pre-wrap",
                            "& img": {
                              cursor: "pointer",
                              transition: "all 0.25s ease",
                              "&:hover": {
                                transform: "scale(1.03)",
                              },
                            },
                          }}
                          dangerouslySetInnerHTML={{
                            __html: m?.Conversation,
                          }}
                        />
                      );
                    })()}

                    {/* Floating timestamp container inside the bubble */}
                    <Box
                      component="span"
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 0.4,
                        flex: "0 0 auto", // Do not grow or shrink
                        ml: "auto", // Align to the right in the flex container
                        pb: 0.2, // Align with bottom edge cleanly
                        fontSize: 9.5,
                        color: "rgba(255,255,255,0.65)",
                        userSelect: "none",
                      }}
                    >
                      {!m?.isDeleted && !m?.is_deleted && m?.Conversation !== "This message was deleted" && m?.Conversation !== "You deleted this message" && (m?.isEdited || m?.is_edited) && (
                        <span style={{ fontStyle: "italic", opacity: 0.85 }}>edited • </span>
                      )}
                      <Typography
                        component="span"
                        sx={{ fontSize: 9.5, color: "inherit", display: "inline" }}
                      >
                        {dayjs(m.CreatedAt).format("hh:mm a")}
                      </Typography>
                      {isMe && (
                        <Box component="span" sx={{ display: "inline-flex", alignItems: "center", ml: 0.2 }}>
                          {m.readAt ? (
                            <DoneAllIcon sx={{ fontSize: 13, color: "#34B7F1" }} />
                          ) : m.deliveredAt ? (
                            <DoneAllIcon sx={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }} />
                          ) : (
                            <DoneIcon sx={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }} />
                          )}
                        </Box>
                      )}
                      {isMe && !m?.isDeleted && !m?.is_deleted && m?.Conversation !== "This message was deleted" && m?.Conversation !== "You deleted this message" && (
                        <IconButton
                          size="small"
                          onClick={(e) => handleOpenMessageMenu(e, m)}
                          sx={{
                            color: "rgba(255,255,255,0.6)",
                            p: 0.2,
                            ml: 0.3,
                            alignSelf: "center",
                            "&:hover": {
                              color: "white",
                              bgcolor: "rgba(255,255,255,0.15)",
                            },
                          }}
                        >
                          <MoreVertical size={13} />
                        </IconButton>
                      )}
                    </Box>
                  </Box>
                </Box>
              );
            })}

            {/* Empty State */}
            {messages?.length === 0 && (
              <Typography textAlign="center" color="rgba(255,255,255,0.4)">
                No messages found
              </Typography>
            )}

            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </Box>
        </Box>

        {/* Editing Message Banner */}
        {editingMessage && (
          <Box
            sx={{
              position: "fixed",
              bottom: "calc(72px + env(safe-area-inset-bottom, 0px))",
              left: 0,
              right: 0,
              zIndex: 21,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 2,
              py: 1,
              bgcolor: "rgba(255, 27, 107, 0.2)",
              backdropFilter: "blur(12px)",
              borderTop: "1px solid rgba(255, 27, 107, 0.4)",
              borderBottom: "1px solid rgba(255, 27, 107, 0.4)",
            }}
          >
            <Box sx={{ overflow: "hidden", mr: 1 }}>
              <Typography variant="caption" sx={{ color: "#FF1B6B", fontWeight: 700, display: "block" }}>
                Editing Message
              </Typography>
              <Typography variant="body2" noWrap sx={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>
                {editingMessage.text}
              </Typography>
            </Box>
            <IconButton size="small" onClick={cancelEditingMessage} sx={{ color: "white" }}>
              <X size={18} />
            </IconButton>
          </Box>
        )}

        {/* Message Input - Fixed at bottom of screen */}
        <Box
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          sx={{
            position: "fixed",
            bottom: 0, // Sit at the very bottom
            left: 0,
            right: 0,
            zIndex: 20,

            px: 2,
            pt: 1.2,
            pb: "calc(10px + env(safe-area-inset-bottom, 0px))", // Safe area padding for mobile home indicator

            // 🔥 Glass background layer
            background:
              "linear-gradient(180deg, rgba(15,15,25,0.6), rgba(15,15,25,0.9))",
            backdropFilter: "blur(14px)",

            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center", // Align items to vertical center
              gap: 1,
              px: 1.2,
              py: 0.8,
              borderRadius: "20px",
              // 🔥 Inner glossy container
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
              backdropFilter: "blur(12px)",

              border: "1px solid rgba(255,255,255,0.08)",

              boxShadow:
                "0 6px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)",
            }}
          >
            {/* Emoji Button */}
            <IconButton
              onClick={() => setEmojiPickerOpen(true)}
              sx={{
                color: "#FF4D8D",
                p: 1,
                transition: "all 0.2s ease",
                "&:hover": {
                  transform: "scale(1.1)",
                },
              }}
            >
              <EmojiIcon fontSize="small" />
            </IconButton>

            {/* Input */}
            <TextField
              fullWidth
              variant="standard"
              placeholder="Message"
              multiline
              maxRows={4}
              value={newMessage}
              onChange={(e) => handleTyping(e.target.value)}
              InputProps={{
                disableUnderline: true,
                sx: {
                  fontSize: "0.95rem",
                  color: "#fff",
                  py: 0.5, // Subtle padding for better vertical centering with single line
                },
              }}
              sx={{
                flex: 1,
                "& .MuiInputBase-input": {
                  color: "#fff",
                  "&::placeholder": {
                    color: "rgba(255,255,255,0.4)",
                    opacity: 1,
                  },
                },
              }}
            />

            {/* Image Upload */}
            <IconButton
              component="label"
              sx={{
                color: "rgba(255,255,255,0.6)",
                p: 1,
                "&:hover": {
                  color: "#fff",
                },
              }}
            >
              <ImageIcon fontSize="small" />
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={handleImageUpload}
              />
            </IconButton>

            {/* Camera Capture */}
            {!newMessage?.trim() && (
              <IconButton
                component="label"
                sx={{
                  color: "rgba(255,255,255,0.6)",
                  p: 1,
                  "&:hover": {
                    color: "#fff",
                  },
                }}
              >
                <CameraIcon fontSize="small" />
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  hidden
                  onChange={handleCameraUpload}
                />
              </IconButton>
            )}

            {/* Send Button */}
            <IconButton
              type="submit"
              disabled={!newMessage?.trim()}
              sx={{
                width: 38,
                height: 38,
                p: 0,

                // 🔥 Gradient button
                background: "linear-gradient(135deg, #FF4D8D, #7B61FF)",
                color: "#fff",

                transition: "all 0.2s ease",

                "&:hover": {
                  transform: "scale(1.05)",
                  boxShadow: "0 6px 16px rgba(255,77,141,0.5)",
                },

                "&.Mui-disabled": {
                  background: "rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.3)",
                  boxShadow: "none",
                },
              }}
            >
              <SendIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </Box>

        {/* Emoji Picker Modal */}
        <Modal open={emojiPickerOpen} onClose={() => setEmojiPickerOpen(false)}>
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              bgcolor: "#FFF0F6",
              borderRadius: 3,
              p: 1.5,
              boxShadow: "0 12px 30px rgba(255, 27, 107, 0.25)",
              border: "1px solid rgba(255, 27, 107, 0.25)",
            }}
          >
            <Picker onEmojiClick={handleEmojiClick} />
          </Box>
        </Modal>

        {/* User Profile Modal */}
        <UserProfileModal
          handleGrantAccess={handleGrantAccess}
          handleClose={handleClose}
          open={showDetail}
          userid={selectedUserId}
        />

        {/* Image Preview Dialog */}
        <Dialog
          open={Boolean(openImage)}
          onClose={closeImagePreview}
          maxWidth="lg"
          disableScrollLock={false}
          BackdropProps={{
            sx: {
              backdropFilter: "blur(6px)",
              backgroundColor: "rgba(0, 0, 0, 0.4)",
            },
          }}
          PaperProps={{
            sx: {
              backgroundColor: "#000",
              boxShadow: "none",
              borderRadius: 1,
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
              backgroundColor: "#000",
              height: "80vh",
            }}
          >
            <IconButton
              onClick={closeImagePreview}
              sx={{
                position: "absolute",
                top: 5,
                right: 8,
                color: "white",
                backgroundColor: "rgba(0,0,0,0.4)",
                "&:hover": {
                  backgroundColor: "rgba(255,255,255,0.1)",
                },
                zIndex: 2,
              }}
            >
              <X size={20} />
            </IconButton>
            {openImage && (
              <img
                src={openImage}
                alt="Preview"
                style={{
                  width: "100%",
                  maxHeight: "80vh",
                  objectFit: "contain",
                }}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Message Options Popover (Edit / Delete) */}
        <Popover
          open={Boolean(menuAnchorEl)}
          anchorEl={menuAnchorEl}
          onClose={handleCloseMessageMenu}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          PaperProps={{
            sx: {
              bgcolor: "#1A1A1A",
              color: "white",
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
              borderRadius: 2,
              py: 0.5,
              minWidth: 140,
            },
          }}
        >
          <List dense sx={{ py: 0 }}>
            <ListItemButton
              onClick={() => startEditingMessage(activeMenuMessage)}
              sx={{
                px: 2,
                py: 1,
                "&:hover": { bgcolor: "rgba(255, 27, 107, 0.15)" },
                display: "flex",
                gap: 1.5,
                alignItems: "center",
                cursor: "pointer",
              }}
            >
              <Pencil size={16} color="#FF1B6B" />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Edit
              </Typography>
            </ListItemButton>
            <ListItemButton
              onClick={() => handleDeleteMessage(activeMenuMessage)}
              sx={{
                px: 2,
                py: 1,
                "&:hover": { bgcolor: "rgba(244, 67, 54, 0.15)" },
                display: "flex",
                gap: 1.5,
                alignItems: "center",
                cursor: "pointer",
              }}
            >
              <Trash2 size={16} color="#F44336" />
              <Typography variant="body2" sx={{ color: "#F44336", fontWeight: 500 }}>
                Delete
              </Typography>
            </ListItemButton>
          </List>
        </Popover>

        {/* Toast Notification */}
        {toastMessage && (
          <Box
            sx={{
              position: "fixed",
              bottom: 80,
              left: "50%",
              transform: "translateX(-50%)",
              bgcolor: "rgba(0,0,0,0.88)",
              color: "white",
              px: 3,
              py: 1.2,
              borderRadius: 5,
              border: "1px solid rgba(255,255,255,0.15)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {toastMessage}
            </Typography>
          </Box>
        )}
      </Box>
    </>
  );
};

export default MobileChatList;
