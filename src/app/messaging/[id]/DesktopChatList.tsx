"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  Avatar,
  Typography,
  IconButton,
  TextField,
  Drawer,
  Badge,
  Dialog,
  DialogContent,
  Popover,
  Skeleton,
  Button,
  CircularProgress,
} from "@mui/material";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
  Send as SendIcon,
  EmojiEmotions as EmojiIcon,
  Image as ImageIcon,
  CameraAlt as CameraIcon,
} from "@mui/icons-material";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import UserProfileModal from "@/components/UserProfileModal";
import { InfoIcon, X, Pencil, Trash2, MoreVertical, Ban } from "lucide-react";
import { sendNotification } from "@/utils/notifications";
import AppHeaderDesktop from "@/layout/AppHeaderDesktop";
import Picker from "emoji-picker-react";
import LazyAvatar from "@/utils/LazyAvatar";
import { useSocketContext } from "@/context/SocketProvider";

dayjs.extend(relativeTime);

interface DesktopChatListProps {
  userId?: string;
}

interface ChatMessage {
  ChatId?: string;
  ConversationId?: string;
  Conversation: string;
  CreatedAt: string;
  createdAt?: string;
  LastUp?: string;
  MemberIdFrom: string;
  MemberIdTo: string;
  FromUsername?: string;
  ToUsername?: string;
  AvatarFrom?: string;
  AvatarTo?: string;
  readAt?: string | null;
  Id?: string | number;
  id?: string | number;
  tempId?: string;
  isEdited?: boolean;
  is_edited?: boolean;
}

interface ChatListItem {
  ChatId: string;
  ToProfileId: string;
  Username: string;
  Avatar: string;
  Conversation: string;
  LastUp: string;
  NewMessages: number;
}

const DesktopChatList = ({ userId }: DesktopChatListProps) => {
  const { socket, isConnected, refetchUnreadCount } = useSocketContext();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<any>({});
  const [myProfile, setMyProfile] = useState<any>({});
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [showDetail, setShowDetail] = useState<any>(false);
  const [selectedUserId, setSelectedUserId] = useState<any>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [openImage, setOpenImage] = useState<string | null>(null);
  const [chatList, setChatList] = useState<ChatListItem[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [userDeviceToken, setUserDeviceToken] = useState(null);
  const [profileId, setProfileId] = useState<any>();
  const [emojiAnchorEl, setEmojiAnchorEl] = useState<HTMLElement | null>(null);
  const typingTimeouts = useRef<Record<string, any>>({});
  const [typingChats, setTypingChats] = useState<Record<string, boolean>>({});
  const [isUserOnline, setIsUserOnline] = useState(false);

  // Edit and Delete message states
  const [editingMessage, setEditingMessage] = useState<{ id: string; tempId?: string; text: string } | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [activeMenuMessage, setActiveMenuMessage] = useState<any | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isCameraDialogOpen, setIsCameraDialogOpen] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const scrollWrapperRef = useRef<HTMLDivElement | null>(null);
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const [chatListLoading, setChatListLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);

  const HEADER_HEIGHT = 90.5;

  const openEmoji = Boolean(emojiAnchorEl);

  useEffect(() => {
    if (!socket || !isConnected || !userId) return;

    socket.emit("user:online", profileId);
    socket.emit("user:get_status", userId);

    socket.on(
      "user:status",
      ({
        userId: statusUserId,
        online,
        lastSeen,
      }: {
        userId: string;
        online: boolean;
        lastSeen: string | null;
      }) => {
        if (statusUserId && userId && String(statusUserId).toLowerCase() !== String(userId).toLowerCase()) return;

        setIsUserOnline(online);
        setLastSeen(lastSeen);
      }
    );

    socket.on("typing:start", ({ from }) => {
      if (from && userId && String(from).toLowerCase() !== String(userId).toLowerCase()) return;

      setTypingChats((prev) => ({ ...prev, [from]: true }));

      clearTimeout(typingTimeouts.current[from]);
      typingTimeouts.current[from] = setTimeout(() => {
        setTypingChats((prev) => ({ ...prev, [from]: false }));
      }, 2000);
    });

    socket.on("typing:stop", ({ from }) => {
      setTypingChats((prev) => ({ ...prev, [from]: false }));
    });

    socket.on("chat:receive", (msg: ChatMessage) => {
      const myId = localStorage.getItem("logged_in_profile");

      setTypingChats((prev) => ({
        ...prev,
        [msg.MemberIdFrom]: false,
      }));

      const isFromUser = msg.MemberIdFrom && userId && String(msg.MemberIdFrom).toLowerCase() === String(userId).toLowerCase();
      const isToUser = msg.MemberIdTo && userId && String(msg.MemberIdTo).toLowerCase() === String(userId).toLowerCase();

      if (isFromUser) {
        setIsUserOnline(true);
        setLastSeen(null);
      }

      if (isFromUser || isToUser) {
        setMessages((prev: any[]) => {
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
      }

      setChatList((prev: any[]) => {
        const otherUserId =
          myId && msg.MemberIdFrom && String(msg.MemberIdFrom).toLowerCase() === String(myId).toLowerCase() ? msg.MemberIdTo : msg.MemberIdFrom;

        const index = prev.findIndex((c: any) => c.ToProfileId && otherUserId && String(c.ToProfileId).toLowerCase() === String(otherUserId).toLowerCase());

        const isChatOpen =
          userId && otherUserId && String(userId).toLowerCase() === String(otherUserId).toLowerCase() && document.visibilityState === "visible";

        if (index !== -1) {
          const updated = {
            ...prev[index],
            Conversation: msg.Conversation,
            LastUp: msg.CreatedAt,
            NewMessages:
              (myId && msg.MemberIdFrom && String(msg.MemberIdFrom).toLowerCase() === String(myId).toLowerCase()) || isChatOpen
                ? 0
                : Number(prev[index].NewMessages || 0) + 1,
          };

          const copy = [...prev];
          copy.splice(index, 1);
          return [updated, ...copy];
        }

        return [
          {
            ChatId: `temp-${Date.now()}`,
            ToProfileId: otherUserId,
            Username: msg.FromUsername || "User",
            Avatar: msg.AvatarFrom || "/noavatar.png",
            Conversation: msg.Conversation,
            LastUp: msg.CreatedAt,
            NewMessages: isChatOpen ? 0 : 1,
          },
          ...prev,
        ];
      });
    });

    socket.on("chat:edit", (payload: any) => {
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
    });

    socket.on("chat:delete", (payload: any) => {
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
    });

    return () => {
      socket.off("user:status");
      socket.off("typing:start");
      socket.off("typing:stop");
      socket.off("chat:receive");
      socket.off("chat:edit");
      socket.off("chat:delete");
    };
  }, [socket, isConnected, profileId, userId]);

  useEffect(() => {
    if (!socket || !profileId || !userId) return;

    socket.emit("chat:read", {
      from: userId,
      to: profileId,
    });
    setChatList((prev) =>
      prev.map((c) => (c.ToProfileId === userId ? { ...c, NewMessages: 0 } : c))
    );
  }, [userId, socket, profileId]);

  useEffect(() => {
    const handleUnload = () => {
      if (socket && profileId) {
        socket.emit("user:offline", profileId);
      }
    };

    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [socket, profileId]);

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
    try {
      setProfileLoading(true);
      const res = await fetch(`/api/user/sweeping/user?id=${userId}`);
      const { user } = await res.json();
      setUserProfile(user);
    } catch (e) {
      console.error(e);
    } finally {
      setProfileLoading(false);
    }
  };

  const getMyProfile = async (userId: string) => {
    if (userId) {
      try {
        const response = await fetch(`/api/user/sweeping/user?id=${userId}`);
        if (!response.ok) {
          console.error(
            "Failed to fetch advertiser data:",
            response.statusText
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
    setNewMessage(value);

    if (!socket || !profileId || !userProfile?.Id) return;

    socket.emit("typing:start", {
      from: profileId,
      to: userProfile.Id,
    });

    clearTimeout(typingTimeouts.current["self"]);
    typingTimeouts.current["self"] = setTimeout(() => {
      socket.emit("typing:stop", {
        from: profileId,
        to: userProfile.Id,
      });
    }, 1500);
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
    if (socket && isConnected) {
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

    socket.emit("typing:stop", {
      from: profileId,
      to: userProfile.Id,
    });

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

    socket.emit("chat:send", {
      ...newUserMessage,
      ConversationId: tempConversationId,
    });

    setMessages((prev: any[]) => [...prev, newUserMessage]);

    setNewMessage("");

    if (userDeviceToken) {
      sendNotifications(newMessage);
    }

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

  const startCamera = async () => {
    setIsCameraLoading(true);
    setIsCameraDialogOpen(true);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera not supported on this browser.");
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      setCameraStream(mediaStream);
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("Could not access camera. Please check your camera permissions.");
      setIsCameraDialogOpen(false);
    } finally {
      setIsCameraLoading(false);
    }
  };

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsCameraDialogOpen(false);
  }, [cameraStream]);

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream, isCameraDialogOpen]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob(async (blob) => {
          if (blob) {
            const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
            await sendCameraFile(file);
          }
        }, "image/jpeg", 0.9);
        
        stopCamera();
      }
    }
  };

  const sendCameraFile = async (file: File) => {
    const tempConversationId = `temp-img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // 1. Local preview reader for instant rendering
    const reader: any = new FileReader();
    reader.onload = () => {
      const newUserMessage = {
        AvatarFrom: myProfile?.Avatar || "/noavatar.png",
        AvatarTo: userProfile?.Avatar,
        ChatId: chatList[existingChatIndex]?.ChatId || "temporary-chat-id",
        Conversation: `<img src="${
          reader.result && typeof reader.result === "string" && reader.result.trim() !== ""
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

    if (socket) {
      socket.emit("chat:send", socketMessage);
    }

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
    } catch (e) {}

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
  };

  const handleCameraUpload = async (event: any) => {
    const file = event.target.files?.[0];
    if (file) {
      await sendCameraFile(file);
    }
  };

  const handleImageUpload = async (event: any) => {
    const file = event.target.files[0];
    if (file) {
      const tempConversationId = `temp-img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // 1. Local preview reader for instant rendering
      const reader: any = new FileReader();
      reader.onload = () => {
        const newUserMessage = {
          AvatarFrom: myProfile?.Avatar || "/noavatar.png",
          AvatarTo: userProfile?.Avatar,
          ChatId: chatList[existingChatIndex]?.ChatId || "temporary-chat-id",
          Conversation: `<img src="${
            reader.result && typeof reader.result === "string" && reader.result.trim() !== ""
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

      if (socket) {
        socket.emit("chat:send", socketMessage);
      }

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
      } catch (e) {}

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
      setChatListLoading(true);
      let profileid = localStorage.getItem("logged_in_profile");
      const response = await axios.get(
        `/api/user/messaging?profileid=${profileid}`
      );
      setChatList(response.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setChatListLoading(false);
    }
  };

  useEffect(() => {
    if (profileId && userId) {
      fetchChatConversation(profileId, userId);
    }
  }, [profileId, userId]);

  const fetchChatConversation = async (profileId: any, userId: any) => {
    try {
      setMessagesLoading(true);
      const response = await fetch("/api/user/messaging/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ProfileIdfrom: profileId,
          ProfileIDto: userId,
        }),
      });

      const result = await response.json();
      const enriched = (result?.data || []).map((m: any) => ({
        ...m,
        deliveredAt: m.deliveredAt || m.CreatedAt,
        readAt: m.readAt || (m.Viewed === 1 ? m.CreatedAt : null)
      }));
      setMessages(enriched);

      // Clear notifications for this chat in the database too and refetch unread counts
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
    } catch (err) {
      console.error(err);
    } finally {
      setMessagesLoading(false);
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
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  };

  const getLocationName = async (latitude: number, longitude: number) => {
    const apiKey = "AIzaSyBEr0k_aQ_Sns6YbIQ4UBxCUTdPV9AhdF0";

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
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
    longitude: number
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
          `${Math.max(keyboardHeight, 0)}px`
        );
      }
    };

    window.visualViewport?.addEventListener("resize", handleResize);
    return () =>
      window.visualViewport?.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!profileId || !userProfile?.Id) return;

    const unreadIds = messages
      .filter((m: any) => m.MemberIdFrom && userProfile.Id && String(m.MemberIdFrom).toLowerCase() === String(userProfile.Id).toLowerCase() && !m.readAt)
      .map((m: any) => m.ConversationId);

    if (!unreadIds.length) return;

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
  }, [messages.length, profileId, userProfile?.Id, socket, refetchUnreadCount]);

  const formatLastUpSmart = (value?: string) => {
    if (!value) return "";

    const date = new Date(value);
    if (isNaN(date.getTime())) return "";

    const now = new Date();

    const isSameDay =
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    const isYesterday =
      date.getFullYear() === yesterday.getFullYear() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getDate() === yesterday.getDate();

    if (isSameDay) {
      return date.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }

    if (isYesterday) {
      return "Yesterday";
    }

    return date.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatMessageTime = (isoString?: string) => {
    if (!isoString) return "";

    const date = new Date(isoString);

    let hours = date.getHours();
    const minutes = date.getMinutes();

    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;

    return `${hours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
  };

  return (
    <>
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "#0A0A0A",
          color: "white",
          flexDirection: "column",
          display: "flex",
        }}
      >
        <AppHeaderDesktop />
        <Box
          sx={{
            display: "flex",
            flex: 1,
            height: "100vh",
          }}
        >
          <Drawer
            variant="permanent"
            sx={{
              width: 350,
              flexShrink: 0,
              [`& .MuiDrawer-paper`]: {
                width: 350,
                boxSizing: "border-box",
                bgcolor: "#1A1A1A",
                color: "white",
                top: `${HEADER_HEIGHT}px`,
                height: `calc(100vh - ${HEADER_HEIGHT}px)`,
                borderRight: "1px solid rgba(255,255,255,0.08)",
              },
            }}
          >
            <Box sx={{ display: "flex", borderBottom: "1px solid #333" }}>
              <Typography
                onClick={() => router.push("/messaging")}
                sx={{
                  width: "50%",
                  textAlign: "center",
                  py: 2,
                  cursor: "pointer",
                  fontSize: 18,
                  fontWeight: 700,
                  borderBottom: "3px solid #FF1B6B",
                }}
              >
                Chat
              </Typography>

              <Typography
                onClick={() => router.push("/mailbox")}
                sx={{
                  width: "50%",
                  textAlign: "center",
                  py: 2,
                  cursor: "pointer",
                  fontSize: 18,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.6)",
                }}
              >
                Mailbox
              </Typography>
            </Box>

            <List sx={{ px: 1 }}>
              {chatListLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <ListItem key={i} sx={{ px: 1.5, py: 1.5 }}>
                    <Skeleton variant="circular" width={46} height={46} />
                    <Box sx={{ ml: 2, flex: 1 }}>
                      <Skeleton width="60%" height={18} />
                      <Skeleton width="90%" height={14} />
                    </Box>
                  </ListItem>
                ))
              ) : (
                <>
                  {chatList.map((chat: any) => {
                    const hasImage = /<img.*?src=/.test(chat.Conversation);
                    const isActive = userId === chat?.ToProfileId;

                    return (
                      <ListItem
                        key={chat.ToProfileId}
                        disableGutters
                        onClick={() =>
                          router.push(`/messaging/${chat.ToProfileId}`)
                        }
                        sx={{
                          px: 1.5,
                          py: 1.5,
                          mt: 0.8,
                          borderRadius: 3,
                          cursor: "pointer",
                          alignItems: "flex-start",
                          position: "relative",
                          bgcolor: isActive
                            ? "rgba(255,27,107,0.15)"
                            : "rgba(255,255,255,0.02)",
                          boxShadow: isActive
                            ? "inset 0 0 0 1px rgba(255,27,107,0.4)"
                            : "none",
                          transition: "all 0.2s ease",

                          "&:hover": {
                            bgcolor: isActive
                              ? "rgba(255,27,107,0.22)"
                              : "rgba(255,255,255,0.07)",
                          },
                          "&::before": isActive
                            ? {
                              content: '""',
                              position: "absolute",
                              left: 0,
                              top: "12%",
                              height: "76%",
                              width: 4,
                              borderRadius: "0 6px 6px 0",
                              bgcolor: "#FF1B6B",
                            }
                            : {},
                        }}
                      >
                        <ListItemAvatar sx={{ minWidth: 56 }}>
                          {chat.NewMessages > 0 ? (
                            <Badge
                              badgeContent={chat.NewMessages}
                              color="error"
                              overlap="circular"
                              anchorOrigin={{
                                vertical: "top",
                                horizontal: "right",
                              }}
                            >
                              <LazyAvatar
                                src={chat.Avatar}
                                size={46}
                                border="2px solid #FF1B6B"
                              />
                            </Badge>
                          ) : (
                            <LazyAvatar
                              src={chat.Avatar}
                              size={46}
                              border="2px solid #FF1B6B"
                            />
                          )}
                        </ListItemAvatar>

                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            noWrap
                            sx={{
                              fontSize: 15,
                              fontWeight: 600,
                              color: "#FF1B6B",
                            }}
                          >
                            {chat.Username}
                          </Typography>

                          {typingChats[chat.ToProfileId] ? (
                            <Typography
                              sx={{ fontSize: 13, color: "#4CAF50", mt: 0.3 }}
                            >
                              Typing…
                            </Typography>
                          ) : (
                            <Typography
                              noWrap
                              sx={{
                                fontSize: 13,
                                color: "rgba(255,255,255,0.65)",
                                mt: 0.3,
                              }}
                            >
                              {hasImage
                                ? "📷 Sent an image"
                                : chat.Conversation}
                            </Typography>
                          )}
                        </Box>

                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-end",
                            justifyContent: "space-between",
                            height: 46,
                            ml: 1,
                            flexShrink: 0,
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: 11,
                              color: "rgba(255,255,255,0.45)",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {formatLastUpSmart(chat.LastUp)}
                          </Typography>
                        </Box>
                      </ListItem>
                    );
                  })}
                </>
              )}
            </List>
          </Drawer>

          <Box
            sx={{
              flex: 1,
              height: `calc(100vh - ${HEADER_HEIGHT}px)`,
              bgcolor: "#121212",
              color: "white",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              mt: `${HEADER_HEIGHT}px`,
            }}
          >
            {/* Chat Header */}
            <Box
              sx={{
                flexShrink: 0,
                height: 62,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                px: 2,
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                bgcolor: "#1A1A1A",
              }}
            >
              {profileLoading ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Skeleton variant="circular" width={36} height={36} />
                  <Box>
                    <Skeleton width={120} height={16} />
                    <Skeleton width={80} height={12} />
                  </Box>
                </Box>
              ) : (
                <>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      setShowDetail(true);
                      setSelectedUserId(userProfile?.Id);
                      window.history.pushState({ modal: "userProfile" }, "");
                    }}
                  >
                    <Box>
                      <LazyAvatar
                        src={userProfile?.Avatar}
                        size={36}
                        border="2px solid #FF1B6B"
                      />
                    </Box>

                    <Box>
                      <Typography
                        noWrap
                        sx={{
                          fontSize: 15,
                          fontWeight: 600,
                          color: "#FF1B6B",
                          letterSpacing: 0.6,
                        }}
                      >
                        {userProfile?.Username || "User"}
                      </Typography>

                      <Typography
                        sx={{
                          fontSize: 12,
                          color: isUserOnline
                            ? "#4CAF50"
                            : "rgba(255,255,255,0.5)",
                        }}
                      >
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
                          return isUserOnline
                            ? "Online"
                            : effectiveLastSeen
                              ? `Last seen at ${formatMessageTime(effectiveLastSeen)}`
                              : "Offline";
                        })()}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: "flex", gap: 1 }}>
                    <IconButton
                      sx={{ color: "rgba(255,255,255,0.7)" }}
                      onClick={() => {
                        setShowDetail(true);
                        setSelectedUserId(userProfile?.Id);
                        window.history.pushState({ modal: "userProfile" }, "");
                      }}
                    >
                      <InfoIcon />
                    </IconButton>
                  </Box>
                </>
              )}
            </Box>

            {/* Messages - ONLY this scrolls */}
            <List
              sx={{
                flex: 1,
                overflowY: "auto",
                px: 2,
                py: 2,
                "&::-webkit-scrollbar": { width: 6 },
                "&::-webkit-scrollbar-thumb": {
                  bgcolor: "#FF1B6B",
                  borderRadius: 3,
                },
              }}
            >
              <Box ref={scrollWrapperRef} sx={{ display: "flex", flexDirection: "column" }}>
                {messagesLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <ListItem key={i} disableGutters sx={{ mb: 1.5 }}>
                      <Skeleton
                        variant="rounded"
                        width={`${Math.random() * 20 + 40}%`}
                        height={36}
                        sx={{ borderRadius: 3 }}
                      />
                    </ListItem>
                  ))
                ) : messages.length === 0 ? (
                  <Typography sx={{ mt: 4, textAlign: "center", opacity: 0.6 }}>
                    💬 Say hi and start the spark
                  </Typography>
                ) : (
                  <>
                    {messages.map((message: any, index: number) => {
                      const isMine = message?.MemberIdFrom === profileId;

                      return (
                        <ListItem
                          key={index}
                          disableGutters
                          sx={{
                            justifyContent: isMine ? "flex-end" : "flex-start",
                            alignItems: "flex-end",
                            mb: 1.4,
                          }}
                        >
                          {/* Avatar (Only for received messages) */}
                          {!isMine && (
                            <ListItemAvatar sx={{ minWidth: 40, mr: 1 }}>
                              <Avatar
                                src={userProfile?.Avatar || "/noavatar.png"}
                                sx={{
                                  width: 32,
                                  height: 32,
                                  border: "2px solid #FF1B6B",
                                  cursor: "pointer",
                                }}
                                onClick={() => {
                                  setShowDetail(true);
                                  setSelectedUserId(userProfile?.Id);
                                  window.history.pushState({ modal: "userProfile" }, "");
                                }}
                              />
                            </ListItemAvatar>
                          )}

                          {/* Message Bubble */}
                          <Box
                            sx={{
                              maxWidth: "50%",
                              px: 1.8,
                              py: 1.0, // Clean, normal bubble padding without excessive spacing
                              borderRadius: isMine
                                ? "18px 18px 4px 18px"
                                : "18px 18px 18px 4px",
                              background: isMine
                                ? "linear-gradient(135deg, #FF1B6B 0%, #FF4D8D 100%)"
                                : "#2A2A2A",
                              color: "white",
                              display: "inline-flex", // Use inline-flex to flow text and time together dynamically
                              flexWrap: "wrap",
                              justifyContent: "flex-end",
                              alignItems: "flex-end",
                              gap: 1.0, // Gap between text and timestamp
                              position: "relative",
                            }}
                          >
                            {/* Message */}
                            {(() => {
                              const isDeleted =
                                message?.isDeleted ||
                                message?.is_deleted ||
                                message?.Conversation === "This message was deleted" ||
                                message?.Conversation === "You deleted this message";

                              if (isDeleted) {
                                return (
                                  <Box
                                    component="span"
                                    sx={{
                                      fontSize: 14,
                                      lineHeight: 1.5,
                                      flex: "1 1 auto",
                                      fontStyle: "italic",
                                      color: isMine ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.65)",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 0.8,
                                    }}
                                  >
                                    <Ban size={15} style={{ opacity: 0.85 }} />
                                    {isMine ? "You deleted this message" : "This message was deleted"}
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
                                      maxWidth: "100%",
                                      borderRadius: isMine
                                        ? "18px 18px 4px 18px"
                                        : "18px 18px 18px 4px",
                                      cursor: "pointer",
                                      transition: "transform 0.2s ease",
                                      "&:hover": {
                                        transform: "scale(1.03)",
                                      },
                                    },
                                  }}
                                  dangerouslySetInnerHTML={{
                                    __html: message?.Conversation,
                                  }}
                                />
                              );
                            })()}

                            {/* Time INSIDE bubble - Floating inline-flex */}
                            <Typography
                              component="span"
                              sx={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 0.4,
                                flex: "0 0 auto", // Do not grow or shrink
                                ml: "auto", // Align to the right in the flex container
                                pb: 0.2, // Align with bottom edge cleanly
                                fontWeight: 500,
                                fontSize: 10,
                                color: isMine
                                  ? "rgba(255,255,255,0.75)"
                                  : "rgba(255,255,255,0.45)",
                                userSelect: "none",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {!message?.isDeleted && !message?.is_deleted && message?.Conversation !== "This message was deleted" && message?.Conversation !== "You deleted this message" && (message?.isEdited || message?.is_edited) && (
                                <span style={{ fontStyle: "italic", opacity: 0.85 }}>edited • </span>
                              )}
                              {formatMessageTime(message?.CreatedAt)}
                            </Typography>

                            {/* Options Menu Icon for Own Messages */}
                            {isMine && !message?.isDeleted && !message?.is_deleted && message?.Conversation !== "This message was deleted" && message?.Conversation !== "You deleted this message" && (
                              <IconButton
                                size="small"
                                onClick={(e) => handleOpenMessageMenu(e, message)}
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
                                <MoreVertical size={14} />
                              </IconButton>
                            )}
                          </Box>

                          {isMine && (
                            <ListItemAvatar sx={{ minWidth: 40, ml: 1 }}>
                              <Avatar
                                src={message?.AvatarFrom || "/noavatar.png"}
                                sx={{
                                  width: 32,
                                  height: 32,
                                  border: "2px solid #FF1B6B",
                                }}
                              />
                            </ListItemAvatar>
                          )}
                        </ListItem>
                      );
                    })}

                    {userId && typingChats[userId] && (
                      <ListItem
                        disableGutters
                        sx={{
                          justifyContent: "flex-start",
                          alignItems: "flex-end",
                          mb: 1,
                        }}
                      >
                        <ListItemAvatar sx={{ minWidth: 40, mr: 1 }}>
                          <Avatar
                            src={userProfile?.Avatar || "/noavatar.png"}
                            sx={{
                              width: 32,
                              height: 32,
                              border: "2px solid #FF1B6B",
                            }}
                          />
                        </ListItemAvatar>

                        <Box
                          sx={{
                            px: 2,
                            py: 1.7,
                            borderRadius: "18px 18px 18px 4px",
                            bgcolor: "#2A2A2A",
                            display: "flex",
                            alignItems: "center",
                            minWidth: 42,
                          }}
                        >
                          <Box className="typing-dots">
                            <span />
                            <span />
                            <span />
                          </Box>
                        </Box>
                      </ListItem>
                    )}

                    <div ref={messagesEndRef} />
                  </>
                )}
              </Box>
            </List>

            {/* Editing Message Banner */}
            {editingMessage && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  px: 2,
                  py: 1,
                  bgcolor: "rgba(255, 27, 107, 0.15)",
                  borderLeft: "4px solid #FF1B6B",
                  mx: 2,
                  mb: 1,
                  borderRadius: 1,
                  flexShrink: 0,
                }}
              >
                <Box sx={{ overflow: "hidden", mr: 1 }}>
                  <Typography variant="caption" sx={{ color: "#FF1B6B", fontWeight: 700, display: "block" }}>
                    Editing Message
                  </Typography>
                  <Typography variant="body2" noWrap sx={{ color: "rgba(255,255,255,0.85)", fontSize: 13 }}>
                    {editingMessage.text}
                  </Typography>
                </Box>
                <IconButton size="small" onClick={cancelEditingMessage} sx={{ color: "white" }}>
                  <X size={18} />
                </IconButton>
              </Box>
            )}

            {/* Message Input - FIXED inside panel */}
            <Box
              component="form"
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              sx={{
                flexShrink: 0,
                px: 2,
                py: 1.5,
                bgcolor: "#161616",
                borderTop: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {/* Input Container */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center", // Align items to vertical center
                  gap: 1,
                  bgcolor: "#222",
                  borderRadius: "28px",
                  px: 1.5,
                  py: 1,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                {/* Emoji */}
                <IconButton
                  onClick={(e) => setEmojiAnchorEl(e.currentTarget)}
                  sx={{
                    color: "#FF1B6B",
                    "&:hover": {
                      bgcolor: "rgba(255,27,107,0.15)",
                    },
                  }}
                >
                  <EmojiIcon />
                </IconButton>

                {/* Emoji Picker */}
                <Popover
                  open={openEmoji}
                  anchorEl={emojiAnchorEl}
                  onClose={() => setEmojiAnchorEl(null)}
                  anchorOrigin={{
                    vertical: "top",
                    horizontal: "left",
                  }}
                  transformOrigin={{
                    vertical: "bottom",
                    horizontal: "left",
                  }}
                  disableAutoFocus
                  disableEnforceFocus
                  PaperProps={{
                    sx: {
                      bgcolor: "#FFF0F6",
                      borderRadius: 3,
                      p: 1,
                      boxShadow: "0 12px 30px rgba(255,27,107,0.25)",
                    },
                  }}
                >
                  <Picker
                    onEmojiClick={(emoji) => {
                      handleEmojiClick(emoji);
                    }}
                  />
                </Popover>

                {/* Text Input */}
                <TextField
                  fullWidth
                  placeholder="Write something..."
                  variant="standard"
                  multiline
                  maxRows={5}
                  value={newMessage}
                  onChange={(e) => handleTyping(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  InputProps={{
                    disableUnderline: true,
                    sx: {
                      color: "white",
                      fontSize: 14,
                      px: 1,
                      py: 0.5, // Subtle padding for better vertical centering
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
                    color: "#FF1B6B",
                    "&:hover": {
                      bgcolor: "rgba(255,27,107,0.15)",
                    },
                  }}
                >
                  <ImageIcon />
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </IconButton>

                {/* Camera Capture */}
                {!newMessage?.trim() && (
                  <IconButton
                    onClick={startCamera}
                    disabled={isCameraLoading}
                    sx={{
                      color: "#FF1B6B",
                      "&:hover": {
                        bgcolor: "rgba(255,27,107,0.15)",
                      },
                    }}
                  >
                    {isCameraLoading ? (
                      <CircularProgress size={20} sx={{ color: "#FF1B6B" }} />
                    ) : (
                      <CameraIcon />
                    )}
                  </IconButton>
                )}

                {/* Send Button */}
                <IconButton
                  type="submit"
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: "50%",
                    background:
                      "linear-gradient(135deg, #FF1B6B 0%, #FF4D8D 100%)",
                    color: "white",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      background:
                        "linear-gradient(135deg, #FF4D8D 0%, #FF1B6B 100%)",
                      transform: "scale(1.08)",
                    },
                    "&:active": {
                      transform: "scale(0.95)",
                    },
                  }}
                >
                  <SendIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Box>
            </Box>
          </Box>
        </Box>

        <UserProfileModal
          handleGrantAccess={handleGrantAccess}
          handleClose={handleClose}
          open={showDetail}
          userid={selectedUserId}
        />

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
        {/* Webcam Capture Dialog */}
        <Dialog
          open={isCameraDialogOpen}
          onClose={stopCamera}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              bgcolor: "#161616",
              color: "white",
              borderRadius: 3,
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 24px 48px rgba(0,0,0,0.8)",
              overflow: "hidden",
            },
          }}
        >
          <Box sx={{ p: 2.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>Take a Photo</Typography>
            <IconButton onClick={stopCamera} sx={{ color: "rgba(255,255,255,0.5)" }}>
              <X size={20} />
            </IconButton>
          </Box>
          <DialogContent sx={{ p: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <Box sx={{ position: "relative", borderRadius: 3, overflow: "hidden", border: "2px solid rgba(255,255,255,0.1)", width: "100%", maxWidth: 480, aspectRatio: "4/3", backgroundColor: "#000" }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transform: "scaleX(-1)", // Mirror the display
                }}
              />
              <canvas ref={canvasRef} style={{ display: "none" }} />
            </Box>
            <Box sx={{ display: "flex", gap: 2, width: "100%", maxWidth: 480, mt: 1, pb: 1 }}>
              <Button
                variant="outlined"
                onClick={stopCamera}
                fullWidth
                sx={{
                  py: 1.2,
                  borderRadius: 2,
                  borderColor: "rgba(255,255,255,0.2)",
                  color: "#fff",
                  textTransform: "none",
                  fontWeight: 600,
                  "&:hover": {
                    borderColor: "white",
                    background: "rgba(255,255,255,0.05)",
                  }
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={capturePhoto}
                fullWidth
                sx={{
                  background: "linear-gradient(135deg, #FF1B6B 0%, #FF4D8D 100%)",
                  py: 1.2,
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 600,
                  color: "white",
                  "&:hover": {
                    background: "linear-gradient(135deg, #FF4D8D 0%, #FF1B6B 100%)",
                  }
                }}
              >
                Capture & Send
              </Button>
            </Box>
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
              bottom: 24,
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

export default DesktopChatList;
