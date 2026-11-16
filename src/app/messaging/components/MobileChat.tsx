"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  List,
  ListItem,
  Typography,
  IconButton,
  TextField,
  Button,
  Dialog,
  DialogContent,
  CircularProgress,
  Avatar,
  Skeleton,
  Drawer,
} from "@mui/material";
import { ArrowBack, Search } from "@mui/icons-material";
import AddIcon from "@mui/icons-material/Add";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DoneIcon from "@mui/icons-material/Done";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";
import AppHeaderMobile from "@/layout/AppHeaderMobile";
import AppFooterMobile from "@/layout/AppFooterMobile";
import { useSocketContext } from "@/context/SocketProvider";
import CloseIcon from "@mui/icons-material/Close";
import CustomDialog from "@/components/CustomDialog";

const formatFullTime = (value?: string) => {
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

const ChatListSkeleton = ({ count = 8 }: { count?: number }) => {
  return (
    <List sx={{ width: "100%", p: 0 }}>
      {Array.from({ length: count }).map((_, index) => (
        <ListItem
          key={index}
          sx={{
            px: 1.5,
            py: 2.5,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            bgcolor: "#121212",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <Skeleton
            variant="circular"
            width={48}
            height={48}
            sx={{ bgcolor: "rgba(255,255,255,0.08)" }}
          />

          <Box sx={{ flex: 1 }}>
            <Skeleton
              width="55%"
              height={16}
              sx={{ bgcolor: "rgba(255,255,255,0.08)" }}
            />
            <Skeleton
              width="80%"
              height={14}
              sx={{ mt: 0.8, bgcolor: "rgba(255,255,255,0.06)" }}
            />
          </Box>

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 1,
            }}
          >
            <Skeleton
              width={40}
              height={12}
              sx={{ bgcolor: "rgba(255,255,255,0.06)" }}
            />
            <Skeleton
              variant="rounded"
              width={22}
              height={22}
              sx={{ bgcolor: "rgba(255,255,255,0.08)" }}
            />
          </Box>
        </ListItem>
      ))}
    </List>
  );
};

const ChatTypingIndicator = () => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
    <Typography fontSize={13} color="#4CAF50">
      Typing
    </Typography>
    <Box sx={{ display: "flex", gap: 0.3 }}>
      {[0, 1, 2].map((i) => (
        <Box
          key={i}
          sx={{
            width: 4,
            height: 4,
            borderRadius: "50%",
            bgcolor: "#4CAF50",
            animation: "typing 1.4s infinite",
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </Box>

    <style jsx>{`
      @keyframes typing {
        0% {
          opacity: 0.3;
        }
        20% {
          opacity: 1;
        }
        100% {
          opacity: 0.3;
        }
      }
    `}</style>
  </Box>
);

const MobileChat = () => {
  const router = useRouter();
  const { socket, isConnected } = useSocketContext();

  const [profileId, setProfileId] = useState<string | null>(null);
  const [chatList, setChatList] = useState<any[]>([]);
  const [chatOpen, setChatOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [userProfiles, setUserProfiles] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadingChats, setLoadingChats] = useState(true);

  const [swipeX, setSwipeX] = useState<number | null>(null);
  const [swipeChatId, setSwipeChatId] = useState<string | null>(null);
  const [typingChats, setTypingChats] = useState<Record<string, boolean>>({});

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogAction, setDialogAction] = useState<"success" | "error" | null>(
    null,
  );

  const [drawerHeight, setDrawerHeight] = useState("70vh");

  const startXRef = useRef(0);
  const isSwipingRef = useRef(false);
  const activeSearchRef = useRef("");
  const typingTimeouts = useRef<Record<string, any>>({});

  const [pendingDeleteChatId, setPendingDeleteChatId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!isConnected) return;
    
    // Request initial online users list
    socket.emit("users:get_online");

    socket.on("users:online_list", (onlineIds: string[]) => {
      console.log("📡 Received online_list:", onlineIds);
      const lowercaseOnlineIds = (onlineIds || []).map(id => String(id).toLowerCase());
      setChatList((prev) =>
        prev.map((c) =>
          c.ToProfileId && lowercaseOnlineIds.includes(String(c.ToProfileId).toLowerCase())
            ? { ...c, IsOnline: true }
            : { ...c, IsOnline: false }
        )
      );
    });

    // Listen for online status updates to toggle the green dot in the chat list
    socket.on("user:status", ({ userId, online }) => {
      console.log("📡 user:status in MobileChat:", { userId, online });
      if (userId) {
        setChatList((prev) =>
          prev.map((c) =>
            c.ToProfileId && String(c.ToProfileId).toLowerCase() === String(userId).toLowerCase()
              ? { ...c, IsOnline: online }
              : c
          )
        );
      }
    });

    socket.on("typing:start", ({ from }) => {
      setTypingChats((prev) => ({ ...prev, [from]: true }));

      clearTimeout(typingTimeouts.current[from]);
      typingTimeouts.current[from] = setTimeout(() => {
        setTypingChats((prev) => ({ ...prev, [from]: false }));
      }, 3000);
    });

    socket.on("typing:stop", ({ from }) => {
      setTypingChats((prev) => ({
        ...prev,
        [from]: false,
      }));
    });

    socket.on("chat:receive", (msg) => {
      // Emit delivered status if we're the recipient
      if (profileId && msg.MemberIdTo && String(msg.MemberIdTo).toLowerCase() === String(profileId).toLowerCase()) {
        socket.emit("message:delivered", {
          from: profileId,
          to: msg.MemberIdFrom,
          messageIds: [msg.ConversationId],
        });
      }

      setChatList((prev) => {
        if (!profileId) return prev;

        const isFromMe = msg.MemberIdFrom && String(msg.MemberIdFrom).toLowerCase() === String(profileId).toLowerCase();
        const otherUserId = isFromMe ? msg.MemberIdTo : msg.MemberIdFrom;

        const existingIndex = prev.findIndex(
          (c) => c.ToProfileId && otherUserId && String(c.ToProfileId).toLowerCase() === String(otherUserId).toLowerCase(),
        );

        const lastUp = msg.CreatedAt;

        if (existingIndex !== -1) {
          const existingChat = prev[existingIndex];

          const updatedChat = {
            ...existingChat,
            Conversation: msg.Conversation,
            LastUp: lastUp,
            MemberIdFrom: msg.MemberIdFrom,
            readAt: null,
            deliveredAt: null,
            NewMessages: isFromMe
                ? 0
                : Number(existingChat.NewMessages || 0) + 1,
          };

          const newList = [...prev];
          newList.splice(existingIndex, 1);

          return [updatedChat, ...newList];
        }

        return [
          {
            ChatId: `temp-${Date.now()}`,
            ToProfileId: otherUserId,
            Username: msg.FromUsername || "User",
            Avatar: msg.AvatarFrom || "/noavatar.png",
            Conversation: msg.Conversation,
            LastUp: lastUp,
            ReceiptStatus: "delivered",
            NewMessages: isFromMe ? 0 : 1,
            IsOnline: true,
          },
          ...prev,
        ];
      });

      setTypingChats((prev) => ({
        ...prev,
        [msg.MemberIdFrom]: false,
      }));
    });

    socket.on("message:delivered", ({ messageIds, deliveredAt, from }) => {
      setChatList((prev) =>
        prev.map((c) =>
          c.ToProfileId && from && String(c.ToProfileId).toLowerCase() === String(from).toLowerCase()
            ? { ...c, deliveredAt }
            : c,
        ),
      );
    });

    socket.on("message:read", ({ messageIds, readAt, from }) => {
      setChatList((prev) =>
        prev.map((c) =>
          c.ToProfileId && from && String(c.ToProfileId).toLowerCase() === String(from).toLowerCase()
            ? { ...c, readAt }
            : c,
        ),
      );
    });

    socket.on("chat:edit", (payload: any) => {
      const updatedText = payload?.newText || payload?.text || payload?.Conversation;
      const fromId = payload?.fromId || payload?.MemberIdFrom;
      const toId = payload?.toId || payload?.MemberIdTo;

      if (updatedText && (fromId || toId)) {
        setChatList((prev) =>
          prev.map((c) => {
            const isMatch =
              (fromId && c.ToProfileId && String(c.ToProfileId).toLowerCase() === String(fromId).toLowerCase()) ||
              (toId && c.ToProfileId && String(c.ToProfileId).toLowerCase() === String(toId).toLowerCase());
            return isMatch ? { ...c, Conversation: updatedText } : c;
          })
        );
      }
    });

    return () => {
      socket.off("user:status");
      socket.off("users:online_list");
      socket.off("typing:start");
      socket.off("typing:stop");
      socket.off("chat:receive");
      socket.off("message:delivered");
      socket.off("message:read");
      socket.off("chat:edit");
    };
  }, [isConnected, profileId]);

  useEffect(() => {
    const pid = localStorage.getItem("logged_in_profile");
    setProfileId(pid);
  }, []);

  useEffect(() => {
    if (profileId) fetchAllChats();
  }, [profileId]);

  // Refresh chats when window is focused (e.g., returning from a chat thread)
  useEffect(() => {
    const handleFocus = () => {
      if (profileId) fetchAllChats();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [profileId]);

  const fetchAllChats = async () => {
    setLoadingChats(true);
    try {
      const res = await axios.get(`/api/user/messaging?profileid=${profileId}`);
      const newData = res.data.data || [];

      setChatList((prev) => {
        // Create a map of existing chats for quick lookup
        const existingMap = new Map(prev.map(c => [String(c.ChatId), c]));

        return newData.map((newChat: any) => {
          const existing = existingMap.get(String(newChat.ChatId));
          // Merge data: prefer API data but preserve local status fields if API lacks them
          return {
            ...newChat,
            MemberIdFrom: existing?.MemberIdFrom || newChat.MemberIdFrom,
            readAt: existing?.readAt || newChat.readAt,
            deliveredAt: existing?.deliveredAt || newChat.deliveredAt,
          };
        });
      });
    } catch (err) {
      console.error("Chat fetch error:", err);
    } finally {
      setLoadingChats(false);
    }
  };

  const openChatDetails = (toProfileId: string) => {
    const token = localStorage.getItem("loginInfo");
    if (!token) return router.push("/login");

    const decoded: any = jwtDecode(token);
    if (decoded?.membership === 0) {
      setDialogTitle("Premium Feature");
      setDialogMessage("Upgrade to Premium to start chatting and unlock all features! 💎");
      setDialogAction("error");
      setDialogOpen(true);
      return;
    }

    // Mark as seen in localStorage to survive the back navigation
    try {
      const seenData = JSON.parse(localStorage.getItem("chat_seen_status") || "{}");
      seenData[toProfileId] = new Date().toISOString();
      localStorage.setItem("chat_seen_status", JSON.stringify(seenData));
    } catch (e) {
      console.error("Error saving seen status:", e);
    }

    // Clear unread count locally for better UX
    setChatList((prev) =>
      prev.map((c) =>
        String(c.ToProfileId) === String(toProfileId)
          ? { ...c, NewMessages: 0 }
          : c,
      ),
    );

    router.push(`/messaging/${toProfileId}`);
  };

  const deleteChat = (chatId: string) => {
    setPendingDeleteChatId(chatId);
    setDialogTitle("Delete chat?");
    setDialogMessage("This conversation will be removed.");
    setDialogAction("error");
    setDialogOpen(true);
  };

  const handleOpenNewChat = () => {
    const token = localStorage.getItem("loginInfo");
    if (!token) return router.push("/login");

    const decoded: any = jwtDecode(token);
    if (decoded?.membership === 0) {
      setDialogTitle("Premium Feature");
      setDialogMessage("Upgrade to Premium to start new conversations and connect with more people! 💎");
      setDialogAction("error");
      setDialogOpen(true);
      return;
    }

    setChatOpen(true);
    setSearchQuery("");
    setUserProfiles([]);
    setPage(1);
    setHasMore(true);
    window.history.pushState({ drawer: true }, "New Message");
  };

  const handleCloseNewChat = () => {
    setChatOpen(false);
    setSearchQuery("");
    setUserProfiles([]);
    setPage(1);
    setHasMore(true);
    if (window.history.state?.drawer) {
      window.history.back();
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setUserProfiles([]);
      setHasMore(true);
      setPage(1);
      return;
    }

    const timer = setTimeout(() => {
      setPage(1);
      setHasMore(true);
      fetchUserProfiles(true);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchUserProfiles = async (isNewSearch = false) => {
    if (loading || (!hasMore && !isNewSearch)) return;

    const currentSearch = searchQuery.trim();
    activeSearchRef.current = currentSearch;

    try {
      setLoading(true);

      const res = await fetch(
        `/api/user/sweeping?page=${isNewSearch ? 1 : page
        }&size=100&search=${encodeURIComponent(currentSearch)}`,
      );

      const data = await res.json();

      if (activeSearchRef.current !== currentSearch) return;

      if (data?.profiles?.length) {
        setUserProfiles((prev) =>
          isNewSearch ? data.profiles : [...prev, ...data.profiles],
        );
        setPage((prev) => prev + 1);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTouchStart = (e: React.TouchEvent, chatId: string) => {
    startXRef.current = e.touches[0].clientX;
    isSwipingRef.current = true;
    setSwipeChatId(chatId);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwipingRef.current) return;

    const diffX = e.touches[0].clientX - startXRef.current;

    if (diffX < 0) {
      setSwipeX(Math.max(diffX, -100));
    }
  };

  const handleTouchEnd = () => {
    if (!isSwipingRef.current) return;

    if (swipeX && swipeX < -80 && swipeChatId) {
      deleteChat(swipeChatId);
    }

    setSwipeX(null);
    setSwipeChatId(null);
    isSwipingRef.current = false;
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const viewport = window.visualViewport;
    if (!viewport) return;

    const handleResize = () => {
      const keyboardOpen = window.innerHeight - viewport.height > 150;

      setDrawerHeight(keyboardOpen ? "100vh" : "70vh");
    };

    viewport.addEventListener("resize", handleResize);

    return () => {
      viewport.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (chatOpen) {
        event.preventDefault();
        setChatOpen(false);
        setSearchQuery("");
        setUserProfiles([]);
        setPage(1);
        setHasMore(true);
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [chatOpen]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #14071f 0%, #0a0412 100%)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <AppHeaderMobile />

      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          pb: "90px",
        }}
      >
        <Box
          sx={{
            display: "flex",
            bgcolor: "rgba(0,0,0,0.2)",
            backdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          {["Chat", "Mailbox"].map((tab) => {
            const active = tab === "Chat";
            return (
              <Box
                key={tab}
                onClick={() =>
                  router.push(tab === "Chat" ? "/messaging" : "/mailbox")
                }
                sx={{
                  flex: 1,
                  textAlign: "center",
                  py: 2,
                  fontWeight: active ? 800 : 500,
                  fontSize: 15,
                  letterSpacing: 0.5,
                  cursor: "pointer",
                  color: active ? "#fff" : "rgba(255,255,255,0.4)",
                  transition: "all 0.3s ease",
                  position: "relative",
                  "&::after": active
                    ? {
                      content: '""',
                      position: "absolute",
                      bottom: 0,
                      left: "15%",
                      width: "70%",
                      height: "3px",
                      borderRadius: "10px",
                      background: "linear-gradient(90deg, #FF2D55, #7000FF)",
                      boxShadow: "0 0 10px rgba(255,45,85,0.4)",
                    }
                    : {},
                }}
              >
                {tab.toUpperCase()}
              </Box>
            );
          })}
        </Box>

        {loadingChats ? (
          <ChatListSkeleton />
        ) : chatList.length > 0 ? (
          <List sx={{ width: "100%", p: 0 }}>
            {chatList.map((chat) => {
              const hasImage = /<img/i.test(chat.Conversation || "");
              const isOnline = chat.IsOnline;
              const chatId = String(chat.ChatId);

              const isTyping = typingChats[chat.ToProfileId];

              // Determine if the last message was from me
              let lastSenderId = chat.MemberIdFrom || chat.MemberIdfrom || chat.ProfileIdFrom || chat.ProfileIdfrom || chat.profileidfrom || chat.sender_id || chat.SenderId;

              // Fallback to local cache for sender info (API misses this)
              let lastSeenTime = null;
              try {
                const chatCache = JSON.parse(localStorage.getItem("chat_metadata_cache") || "{}");
                const cacheEntry = chatCache[chat.ToProfileId];
                if (cacheEntry) {
                  // If the text matches, use the cached sender
                  if (!lastSenderId && cacheEntry.lastMessageText === chat.Conversation) {
                    lastSenderId = cacheEntry.lastSenderId;
                  }
                  lastSeenTime = cacheEntry.lastSeenTime;
                }

                // Also check the simpler seen status
                const seenData = JSON.parse(localStorage.getItem("chat_seen_status") || "{}");
                if (seenData[chat.ToProfileId]) {
                  if (!lastSeenTime || new Date(seenData[chat.ToProfileId]) > new Date(lastSeenTime)) {
                    lastSeenTime = seenData[chat.ToProfileId];
                  }
                }
              } catch (e) { }

              const isLastMessageFromMe = String(lastSenderId) === String(profileId);

              // Only show unread count if the last message was NOT from me
              let hasUnread = chat.NewMessages > 0 && !isLastMessageFromMe && chat.NewMessages !== "0";

              // Extra check: If seen more recently than last message, hide unread
              if (hasUnread && lastSeenTime && new Date(chat.LastUp) <= new Date(lastSeenTime)) {
                hasUnread = false;
              }

              return (
                <Box
                  key={chat.ChatId}
                  sx={{ position: "relative", overflow: "hidden" }}
                >
                  {swipeChatId === chatId && (
                    <Box
                      sx={{
                        position: "absolute",
                        inset: 0,
                        background: "linear-gradient(90deg, #ff4d4f 0%, #d32f2f 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        pr: 3,
                        zIndex: 1,
                      }}
                    >
                      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
                        <DeleteOutlineIcon sx={{ color: "white", fontSize: 24 }} />
                        <Typography fontSize={10} fontWeight={800} color="white">
                          DELETE
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  <ListItem
                    onClick={() => {
                      if (swipeX) return;
                      openChatDetails(chat.ToProfileId);
                    }}
                    onTouchStart={(e) => handleTouchStart(e, chatId)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    sx={{
                      px: 2,
                      py: 2.5,
                      background: hasUnread ? "rgba(255,255,255,0.06)" : "#0a0412",
                      transform:
                        swipeChatId === chatId && swipeX
                          ? `translateX(${swipeX}px)`
                          : "translateX(0)",
                      transition: swipeX ? "none" : "transform 0.2s ease",
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      borderBottom: "1px solid rgba(255,255,255,0.03)",
                      cursor: "pointer",
                      zIndex: 2,
                      position: "relative",
                      "&:active": {
                        bgcolor: "rgba(255,255,255,0.05)",
                      }
                    }}
                  >
                    <Box sx={{ position: "relative" }}>
                      <Avatar
                        src={chat.Avatar || "/noavatar.png"}
                        sx={{
                          width: 54,
                          height: 54,
                          border: "2px solid transparent",
                          background:
                            "linear-gradient(#0a0412, #0a0412) padding-box, linear-gradient(135deg, #FF2D55, #7000FF) border-box",
                        }}
                      />
                      {isOnline && (
                        <Box
                          sx={{
                            position: "absolute",
                            bottom: 2,
                            right: 2,
                            width: 10,
                            height: 10,
                            bgcolor: "#4CAF50",
                            borderRadius: "50%",
                            border: "2px solid #121212",
                          }}
                        />
                      )}
                    </Box>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        fontSize={15}
                        fontWeight={600}
                        color="white"
                        noWrap
                      >
                        {chat.Username}
                      </Typography>

                      <Box mt={0.4} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        {typingChats[chat.ToProfileId] ? (
                          <ChatTypingIndicator />
                        ) : (
                          <>
                            {isLastMessageFromMe && (
                              <Box sx={{ display: "flex", mr: 0.2 }}>
                                {chat.readAt ? (
                                  <DoneAllIcon sx={{ fontSize: 16, color: "#34B7F1" }} />
                                ) : chat.deliveredAt ? (
                                  <DoneAllIcon sx={{ fontSize: 16, color: "rgba(255,255,255,0.4)" }} />
                                ) : (
                                  <DoneIcon sx={{ fontSize: 16, color: "rgba(255,255,255,0.4)" }} />
                                )}
                              </Box>
                            )}
                            <Typography
                              fontSize={13}
                              color="rgba(255,255,255,0.6)"
                              noWrap
                              sx={{ flex: 1 }}
                            >
                              {hasImage
                                ? "📷 Photo"
                                : chat.Conversation || "Say hi 👋"}
                            </Typography>
                          </>
                        )}
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        justifyContent: "space-between",
                        minHeight: 44,
                        ml: 1,
                      }}
                    >
                      {/* Time */}
                      {!isTyping && (
                        <Typography
                          fontSize={12}
                          color="rgba(255,255,255,0.45)"
                        >
                          {formatFullTime(chat.LastUp)}
                        </Typography>
                      )}

                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        {!isTyping && hasUnread && (
                          <Box
                            sx={{
                              minWidth: 22,
                              height: 22,
                              px: 0.8,
                              borderRadius: 9,
                              background:
                                "linear-gradient(135deg, #FF2D55, #7000FF)",
                              color: "white",
                              fontSize: 11,
                              fontWeight: 700,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {chat.NewMessages}
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </ListItem>
                </Box>
              );
            })}
          </List>
        ) : (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              mt: "35%",
              px: 4,
              textAlign: "center",
              opacity: 0.8,
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.03)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 3,
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <ChatBubbleOutlineIcon
                sx={{ fontSize: 40, color: "rgba(255,255,255,0.4)" }}
              />
            </Box>
            <Typography
              variant="h6"
              sx={{
                color: "#fff",
                fontWeight: 800,
                fontSize: "1.2rem",
                mb: 1,
              }}
            >
              No messages yet
            </Typography>
            <Typography
              sx={{
                color: "rgba(255,255,255,0.5)",
                fontSize: "0.95rem",
                lineHeight: 1.5,
              }}
            >
              Your conversations will appear here. <br />
              Tap the button below to start chatting!
            </Typography>
          </Box>
        )}

        <Button
          onClick={handleOpenNewChat}
          sx={{
            position: "fixed",
            right: 24,
            bottom: 100,
            width: 60,
            height: 60,
            minWidth: 0,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #FF2D55, #7000FF)",
            color: "#fff",
            boxShadow: "0 8px 25px rgba(255,45,85,0.4)",
            transition: "all 0.3s ease",
            "&:active": {
              transform: "scale(0.9)",
            }
          }}
        >
          <AddIcon sx={{ fontSize: "32px" }} />
        </Button>
      </Box>

      <AppFooterMobile />

      <Drawer
        anchor="bottom"
        open={chatOpen}
        onClose={handleCloseNewChat}
        ModalProps={{ keepMounted: true }}
        PaperProps={{
          sx: {
            height: drawerHeight,
            background: "linear-gradient(160deg, #14071f 0%, #0a0412 100%)",
            borderTopLeftRadius: drawerHeight === "100vh" ? 0 : 30,
            borderTopRightRadius: drawerHeight === "100vh" ? 0 : 30,
            overflow: "hidden",
            transition: "height 0.25s ease",
            boxShadow: "0 -10px 40px rgba(0,0,0,0.5)",
          },
        }}
      >
        <Box
          sx={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            px: 2,
            py: 1,
            display: "flex",
            alignItems: "center",
            gap: 1,
            background: "rgba(0,0,0,0.2)",
            backdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <IconButton onClick={handleCloseNewChat} sx={{ color: "#fff" }}>
            <ArrowBack />
          </IconButton>

          <Typography sx={{ color: "#fff", fontSize: 18, fontWeight: 800 }}>
            New Message
          </Typography>
        </Box>

        <Box sx={{ px: 2, py: 2.5 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              bgcolor: "rgba(255,255,255,0.04)",
              px: 2.5,
              py: 1.5,
              borderRadius: "16px",
              border: "1px solid rgba(255,255,255,0.08)",
              transition: "all 0.3s ease",
              "&:focus-within": {
                borderColor: "#FF2D55",
                bgcolor: "rgba(255,255,255,0.06)",
              }
            }}
          >
            <Search sx={{ color: "rgba(255,255,255,0.4)", fontSize: 22 }} />

            <TextField
              variant="standard"
              placeholder="Search profiles"
              fullWidth
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                disableUnderline: true,
                sx: {
                  color: "#fff",
                  fontSize: 14,

                  "& input": {
                    backgroundColor: "transparent",
                    color: "#fff",
                  },

                  "& input::placeholder": {
                    color: "rgba(255,255,255,0.45)",
                  },
                },
              }}
            />

            {searchQuery && (
              <IconButton
                size="small"
                onClick={() => {
                  setSearchQuery("");
                  setUserProfiles([]);
                  setPage(1);
                  setHasMore(true);
                }}
                sx={{
                  color: "rgba(255,255,255,0.6)",
                  "&:hover": {
                    color: "#fff",
                  },
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        </Box>

        <DialogContent
          sx={{
            p: 1.5,
            overflowY: "auto",
            background: "transparent",
          }}
        >
          {searchQuery && !loading && userProfiles.length === 0 && (
            <Typography
              sx={{
                mt: 6,
                textAlign: "center",
                color: "rgba(255,255,255,0.5)",
                fontSize: 14,
              }}
            >
              No profiles found
            </Typography>
          )}

          <List sx={{ px: 1 }}>
            {userProfiles.map((user) => (
              <ListItem
                key={user.Id}
                onClick={() => openChatDetails(user.Id)}
                sx={{
                  gap: 2,
                  py: 1.5,
                  px: 2,
                  mb: 1,
                  borderRadius: 4,
                  cursor: "pointer",
                  bgcolor: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.04)",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    bgcolor: "#1A1A22",
                  },
                  "&:active": {
                    transform: "scale(0.97)",
                  },
                }}
              >
                <Avatar
                  src={user.Avatar || "/noavatar.png"}
                  sx={{
                    width: 48,
                    height: 48,
                    border: "2px solid transparent",
                    background:
                      "linear-gradient(#141417, #141417) padding-box, linear-gradient(135deg, #FF2D55, #7000FF) border-box",
                  }}
                />

                <Box sx={{ flex: 1 }}>
                  <Typography
                    sx={{
                      color: "#fff",
                      fontWeight: 600,
                      fontSize: 15,
                    }}
                  >
                    {user.Username}
                  </Typography>

                  <Typography
                    sx={{
                      color: "rgba(255,255,255,0.55)",
                      fontSize: 13,
                    }}
                  >
                    Tap to start chatting 💬
                  </Typography>
                </Box>
              </ListItem>
            ))}
          </List>

          {loading && (
            <Box py={4} textAlign="center">
              <CircularProgress size={22} />
            </Box>
          )}
        </DialogContent>
      </Drawer>

      <CustomDialog
        open={dialogOpen}
        title={dialogTitle}
        description={dialogMessage}
        icon={
          pendingDeleteChatId ? (
            <DeleteOutlineIcon sx={{ color: "#fff", fontSize: 40 }} />
          ) : (
            <WorkspacePremiumIcon sx={{ color: "#fff", fontSize: 40 }} />
          )
        }
        confirmText={
          pendingDeleteChatId
            ? "Delete"
            : dialogTitle === "Premium Feature"
              ? "Upgrade"
              : "OK"
        }
        cancelText="Cancel"
        onClose={() => {
          setDialogOpen(false);
          setPendingDeleteChatId(null);
        }}
        onConfirm={async () => {
          setDialogOpen(false);

          // 🗑 If deleting chat
          if (pendingDeleteChatId) {
            try {
              await fetch("/api/user/messaging/chat/delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chatId: pendingDeleteChatId }),
              });

              fetchAllChats();
            } catch {
              setDialogTitle("Error");
              setDialogMessage("Could not delete chat");
              setDialogAction("error");
              setDialogOpen(true);
            }

            setPendingDeleteChatId(null);
            return;
          }
          if (dialogTitle === "Premium Feature") {
            router.push("/membership");
          }
        }}
      />
    </Box>
  );
};

export default MobileChat;
