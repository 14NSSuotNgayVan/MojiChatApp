import { Server } from 'socket.io'
import http from 'http'
import express from 'express'

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL,
        credentials: true
    }
});

io.on("conection", async (socket) => {
    console.log("socket connected: " + socket.id)

    socket.on("disconnect", () => {
        console.log("socket disconnected: " + socket.id)
    })
})

export { io, app, server }