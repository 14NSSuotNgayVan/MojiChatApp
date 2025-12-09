import express from 'express'
import { sendDirectMessage, senGroupMessage } from '../controllers/messageController.js';
import { checkFriendShips } from '../middlewares/friendMiddleware.js';

const messageRoute = express.Router();

messageRoute.post("/direct", checkFriendShips, sendDirectMessage)
messageRoute.post("/group", senGroupMessage)

export default messageRoute;