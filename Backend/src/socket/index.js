import { Server } from "socket.io";
import http from "http";
import express from "express";
import { socketAuthMiddleware } from "../middlewares/socketMiddleware.js";
import { getConversationIds } from "../controllers/conversationController.js";
import { onSeenMessage } from "../utils/socketHelper.js";

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL,
        credentials: true,
    },
});
io.use(socketAuthMiddleware);

// Map<userId, Set<socketId>>
const onlineUsers = new Map();

io.on("connection", async (socket) => {
    const user = socket?.user;
    if (!user?._id) {
        return socket.disconnect(true);
    }

    console.log("socket connected: " + user._id);

    const userId = user._id.toString();
    const existing = onlineUsers.get(userId) || new Set();
    existing.add(socket.id);
    onlineUsers.set(userId, existing);

    io.emit("online-user", Array.from(onlineUsers.keys()));

    const userConversationIds = await getConversationIds(user._id);
    userConversationIds.forEach((id) => {
        socket.join(id);
    });

    onSeenMessage(socket);

    socket.on("disconnect", () => {
        const sockets = onlineUsers.get(userId);
        if (sockets) {
            sockets.delete(socket.id);
            if (sockets.size === 0) {
                onlineUsers.delete(userId);
            } else {
                onlineUsers.set(userId, sockets);
            }
        }

        io.emit("online-user", Array.from(onlineUsers.keys()));
        console.log("socket disconnected: " + user._id);
    });
});

export { io, app, server };