import express from 'express'
import { senDirectMessage, senGroupMessage } from '../controllers/messageController.js';

const messageRoute = express.Router();

messageRoute.post("/direct", senDirectMessage)
messageRoute.post("/group", senGroupMessage)

export default messageRoute;