"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { getSocket } from "@/lib/socket";
import { usePathname } from "next/navigation";

type SocketContextType = {
  socket: ReturnType<typeof getSocket>;
  isConnected: boolean;
  unreadCount: number;
  refetchUnreadCount: () => void;
};

const SocketContext = createContext<SocketContextType | null>(null);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const socket = useRef(getSocket()).current;
  const [isConnected, setIsConnected] = useState(false);
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const fetchIdRef = useRef(0);

  const fetchUnreadCount = useCallback(async (pId: string) => {
    const currentFetchId = ++fetchIdRef.current;
    try {
      const res = await fetch(`/api/user/messaging?profileid=${pId}`);
      if (res.ok && currentFetchId === fetchIdRef.current) {
        const result = await res.json();
        const chats = result?.data || [];
        const count = chats.reduce((sum: number, chat: any) => sum + (Number(chat.NewMessages) || 0), 0);
        setUnreadCount(count);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  }, []);

  const refetchUnreadCount = useCallback(() => {
    const profileId = typeof window !== "undefined" ? localStorage.getItem("logged_in_profile") : null;
    if (profileId) {
      fetchUnreadCount(profileId);
    }
  }, [fetchUnreadCount]);

  useEffect(() => {
    const profileId = typeof window !== "undefined" ? localStorage.getItem("logged_in_profile") : null;
    if (profileId) {
      fetchUnreadCount(profileId);
    }
  }, [pathname, fetchUnreadCount]);

  useEffect(() => {
    const profileId = typeof window !== "undefined" ? localStorage.getItem("logged_in_profile") : null;

    if (!profileId) {
      if (socket.connected) {
        socket.disconnect();
      }
      setIsConnected(false);
      return;
    }

    if (!socket.connected) {
      socket.connect();
    }

    const handleConnect = () => {
      setIsConnected(true);
      socket.emit("user:online", profileId);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    if (socket.connected) {
      setIsConnected(true);
      socket.emit("user:online", profileId);
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [pathname, socket]);

  useEffect(() => {
    const handleReceive = (msg: any) => {
      const currentPath = pathname || "";
      const parts = currentPath.split("/");
      const activeChatPartnerId = parts[parts.length - 1];
      const isCurrentlyViewingChat = 
        currentPath.startsWith("/messaging/") && 
        String(activeChatPartnerId).toLowerCase() === String(msg.MemberIdFrom).toLowerCase();

      if (!isCurrentlyViewingChat) {
        refetchUnreadCount();
      }
    };

    socket.on("chat:receive", handleReceive);

    return () => {
      socket.off("chat:receive", handleReceive);
    };
  }, [pathname, socket, refetchUnreadCount]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, unreadCount, refetchUnreadCount }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocketContext = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocketContext must be inside SocketProvider");
  return ctx;
};
