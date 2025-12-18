import { Server } from 'socket.io'
import http from 'http'
import express from 'express'
import { socketAuthMiddleware } from '../middlewares/socketMiddleware.js';
import { getConversationIds } from '../controllers/conversationController.js';

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL,
        credentials: true
    }
});
io.use(socketAuthMiddleware)

const onlineUsers = new Map();


io.on("connection", async (socket) => {
    //Người dùng online
    const user = socket?.user;
    console.log("socket connected: " + user._id);
    onlineUsers.set(user._id, socket.id)
    io.emit("online-user", Array.from(onlineUsers.keys()))

    const userConversationIds = await getConversationIds(user._id);
    userConversationIds.forEach(id => {
        socket.join(id)
    })

    //Người dùng offline
    socket.on("disconnect", () => {
        onlineUsers.delete(user._id)
        io.emit("online-user", Array.from(onlineUsers.keys()))

        console.log("socket disconnected: " + user._id)
    })
})

export { io, app, server }