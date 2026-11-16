const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

// cPanel provides the port via process.env.PORT
const port = process.env.PORT || 3000;

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: "*", 
      methods: ["GET", "POST"],
    },
  });

  // Map to keep track of online users and their associated socket IDs
  const onlineUsers = new Map(); // profileId -> Set of socketIds
  // Map to keep track of socketId -> profileId for easy disconnect cleanup
  const socketToProfile = new Map();

  io.on("connection", (socket) => {
    console.log("A user connected via socket:", socket.id);

    // Keep legacy support if needed
    socket.on("message", (msg) => {
      socket.broadcast.emit("message", msg);
      console.log("messaging event");
    });

    // Register user as online
    socket.on("user:online", (profileId) => {
      if (!profileId) return;
      
      const profileStr = String(profileId).toLowerCase();
      console.log(`User online: ${profileStr} (socket: ${socket.id})`);

      if (!onlineUsers.has(profileStr)) {
        onlineUsers.set(profileStr, new Set());
        // Broadcast that the user is online
        io.emit("user:status", {
          userId: profileStr,
          online: true,
          lastSeen: null
        });
      }
      
      onlineUsers.get(profileStr).add(socket.id);
      socketToProfile.set(socket.id, profileStr);
    });

    // Handle online status queries
    socket.on("user:get_status", (targetUserId) => {
      if (!targetUserId) return;
      const targetStr = String(targetUserId).toLowerCase();
      const isOnline = onlineUsers.has(targetStr) && onlineUsers.get(targetStr).size > 0;
      socket.emit("user:status", {
        userId: targetStr,
        online: isOnline,
        lastSeen: null
      });
    });

    socket.on("users:get_online", () => {
      socket.emit("users:online_list", Array.from(onlineUsers.keys()));
    });

    // Handle user manual offline status
    socket.on("user:offline", (profileId) => {
      if (!profileId) return;

      const profileStr = String(profileId).toLowerCase();
      console.log(`User offline (manual): ${profileStr}`);

      if (onlineUsers.has(profileStr)) {
        const sockets = onlineUsers.get(profileStr);
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlineUsers.delete(profileStr);
          const lastSeen = new Date().toISOString();
          io.emit("user:status", {
            userId: profileStr,
            online: false,
            lastSeen
          });
        }
      }
      socketToProfile.delete(socket.id);
    });

    // Handle chat:send
    socket.on("chat:send", (msg) => {
      console.log("Received chat:send message:", msg);
      if (!msg) return;

      // Deliver to recipient(s)
      if (msg.MemberIdTo) {
        const recipientStr = String(msg.MemberIdTo).toLowerCase();
        const recipientSockets = onlineUsers.get(recipientStr);
        if (recipientSockets) {
          recipientSockets.forEach((sid) => {
            io.to(sid).emit("chat:receive", msg);
          });
        }
      }

      // Sync to sender's sockets/sessions (including current socket for 0ms list update)
      if (msg.MemberIdFrom) {
        const senderStr = String(msg.MemberIdFrom).toLowerCase();
        const senderSockets = onlineUsers.get(senderStr);
        if (senderSockets) {
          senderSockets.forEach((sid) => {
            io.to(sid).emit("chat:receive", msg);
          });
        }
      }
    });

    // Handle chat:edit
    socket.on("chat:edit", (payload) => {
      console.log("Received chat:edit message:", payload);
      if (!payload) return;

      const { toId, fromId, MemberIdTo, MemberIdFrom } = payload;
      const targetTo = toId || MemberIdTo;
      const targetFrom = fromId || MemberIdFrom;

      if (targetTo) {
        const recipientSockets = onlineUsers.get(String(targetTo).toLowerCase());
        if (recipientSockets) {
          recipientSockets.forEach((sid) => {
            io.to(sid).emit("chat:edit", payload);
          });
        }
      }
      if (targetFrom) {
        const senderSockets = onlineUsers.get(String(targetFrom).toLowerCase());
        if (senderSockets) {
          senderSockets.forEach((sid) => {
            io.to(sid).emit("chat:edit", payload);
          });
        }
      }
    });

    // Handle chat:delete
    socket.on("chat:delete", (payload) => {
      console.log("Received chat:delete message:", payload);
      if (!payload) return;

      const { toId, fromId, MemberIdTo, MemberIdFrom } = payload;
      const targetTo = toId || MemberIdTo;
      const targetFrom = fromId || MemberIdFrom;

      if (targetTo) {
        const recipientSockets = onlineUsers.get(String(targetTo).toLowerCase());
        if (recipientSockets) {
          recipientSockets.forEach((sid) => {
            io.to(sid).emit("chat:delete", payload);
          });
        }
      }
      if (targetFrom) {
        const senderSockets = onlineUsers.get(String(targetFrom).toLowerCase());
        if (senderSockets) {
          senderSockets.forEach((sid) => {
            io.to(sid).emit("chat:delete", payload);
          });
        }
      }
    });

    // Handle message:delivered confirmation
    socket.on("message:delivered", (payload) => {
      console.log("Received message:delivered confirmation:", payload);
      if (!payload) return;

      const { from, to, messageIds } = payload;
      if (!to || !messageIds) return;

      const deliveredAt = new Date().toISOString();
      const targetSockets = onlineUsers.get(String(to).toLowerCase());
      if (targetSockets) {
        targetSockets.forEach((sid) => {
          io.to(sid).emit("message:delivered", {
            messageIds,
            deliveredAt,
            from: String(from).toLowerCase()
          });
        });
      }
    });

    // Handle message:read confirmation
    socket.on("message:read", (payload) => {
      console.log("Received message:read confirmation:", payload);
      if (!payload) return;

      const { from, to, messageIds } = payload;
      if (!to || !messageIds) return;

      const readAt = new Date().toISOString();
      const targetSockets = onlineUsers.get(String(to).toLowerCase());
      if (targetSockets) {
        targetSockets.forEach((sid) => {
          io.to(sid).emit("message:read", {
            messageIds,
            readAt,
            from: String(from).toLowerCase()
          });
        });
      }
    });

    // Handle chat:read confirmation
    socket.on("chat:read", (payload) => {
      console.log("Received chat:read confirmation:", payload);
      if (!payload) return;

      const { from, to } = payload;
      if (!from) return;

      const targetSockets = onlineUsers.get(String(from).toLowerCase());
      if (targetSockets) {
        targetSockets.forEach((sid) => {
          io.to(sid).emit("chat:read", {
            from: String(from).toLowerCase(),
            to: String(to).toLowerCase()
          });
        });
      }
    });

    // Typing start indicator
    socket.on("typing:start", (payload) => {
      if (!payload) return;
      const { from, to } = payload;
      if (!to) return;

      const targetSockets = onlineUsers.get(String(to).toLowerCase());
      if (targetSockets) {
        targetSockets.forEach((sid) => {
          io.to(sid).emit("typing:start", { from: String(from).toLowerCase() });
        });
      }
    });

    // Typing stop indicator
    socket.on("typing:stop", (payload) => {
      if (!payload) return;
      const { from, to } = payload;
      if (!to) return;

      const targetSockets = onlineUsers.get(String(to).toLowerCase());
      if (targetSockets) {
        targetSockets.forEach((sid) => {
          io.to(sid).emit("typing:stop", { from: String(from).toLowerCase() });
        });
      }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log("A user disconnected via socket:", socket.id);
      
      const profileStr = socketToProfile.get(socket.id);
      if (profileStr) {
        if (onlineUsers.has(profileStr)) {
          const sockets = onlineUsers.get(profileStr);
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            onlineUsers.delete(profileStr);
            const lastSeen = new Date().toISOString();
            // Broadcast that the user is offline
            io.emit("user:status", {
              userId: profileStr,
              online: false,
              lastSeen
            });
          }
        }
        socketToProfile.delete(socket.id);
      }
    });
  });

  httpServer.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});
