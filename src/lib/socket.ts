import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

const isLocal = typeof window !== "undefined" && (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.port === "3000" ||
    window.location.port === "3001" ||
    window.location.hostname.startsWith("192.168.") ||
    window.location.hostname.startsWith("10.") ||
    window.location.hostname.startsWith("172.") ||
    window.location.hostname.endsWith(".local")
);

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || (isLocal
    ? `http://${window.location.hostname}:3002`
    : ""); // Connects to the same host as the website in production

export const getSocket = (): Socket => {
    if (!socket) {
        socket = io(SOCKET_URL, {
            transports: ["polling", "websocket"],
            autoConnect: false,
            reconnection: true,
        });
    }
    return socket;
};
