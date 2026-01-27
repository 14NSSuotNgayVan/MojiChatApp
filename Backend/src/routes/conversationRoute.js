import express from 'express';
import { createConversation, getConversations, getConversationsByKeyword, getMessages } from '../controllers/conversationController.js';

const conversationRoute = express.Router();

conversationRoute.post('/', createConversation)
conversationRoute.get('/', getConversations)
conversationRoute.get('/search', getConversationsByKeyword) 
conversationRoute.get('/:conversationId', getMessages)

export default conversationRoute;