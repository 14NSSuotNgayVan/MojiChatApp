import express from 'express'
import {
    sendDirectMessage,
    senGroupMessage,
    toggleMessageReaction,
} from '../controllers/messageController.js';
import { checkFriendShips, checkGroupMembership } from '../middlewares/friendMiddleware.js';

const messageRoute = express.Router();

messageRoute.post("/direct", sendDirectMessage)
messageRoute.post("/group", checkGroupMembership, senGroupMessage)
messageRoute.post("/reaction/toggle", toggleMessageReaction)

export default messageRoute;