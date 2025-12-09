import express from 'express';
import { createConversation, getConversations, getMessages } from '../controllers/conversationController.js';

const conversationRoute = express.Router();

conversationRoute.post('/', createConversation)
conversationRoute.get('/', getConversations)
conversationRoute.get('/:conversationId', getMessages)

export default conversationRoute;