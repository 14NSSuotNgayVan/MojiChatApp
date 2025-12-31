import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import cookieParser from 'cookie-parser';
import { connectDB } from './libs/db.js';
import { app, server } from './socket/index.js'
import { protectedRoute } from './middlewares/authMiddleware.js';
import authRoute from './routes/authRoute.js';
import userRoute from './routes/userRoute.js';
import friendRouter from './routes/friendRoute.js';
import messageRoute from './routes/messageRoute.js';
import conversationRoute from './routes/conversationRoute.js';
import uploadFileRoute from './routes/uploadFileRoute.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
//protected route


//public
app.use('/api/auth', authRoute)

//private
app.use(protectedRoute)

app.use('/api/file', uploadFileRoute)
app.use('/api/user', userRoute)
app.use('/api/friend', friendRouter)
app.use('/api/message', messageRoute)
app.use('/api/conversations', conversationRoute)


connectDB().then(() => {
    server.listen(PORT, () => {
        console.log(`App run on port: http://localhost:${PORT}`)
    })
});
