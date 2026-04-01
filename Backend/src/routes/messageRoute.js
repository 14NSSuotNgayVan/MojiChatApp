import express from 'express'
import {
    deleteMessageForEveryone,
    deleteMessageForMe,
    sendDirectMessage,
    senGroupMessage,
    toggleMessageReaction,
} from '../controllers/messageController.js';
import { checkFriendShips, checkGroupMembership } from '../middlewares/friendMiddleware.js';

const messageRoute = express.Router();

messageRoute.post("/direct", sendDirectMessage)
messageRoute.post("/group", checkGroupMembership, senGroupMessage)
messageRoute.post("/reaction/toggle", toggleMessageReaction)
messageRoute.post("/delete-for-me", deleteMessageForMe)
messageRoute.post("/delete-for-everyone", deleteMessageForEveryone)

export default messageRoute;