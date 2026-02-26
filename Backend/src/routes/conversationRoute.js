import express from 'express';
import { createConversation, deleteParticipant, getConversations, getConversationsByKeyword, getMessages } from '../controllers/conversationController.js';

const conversationRoute = express.Router();

conversationRoute.post('/', createConversation)
conversationRoute.get('/', getConversations)
conversationRoute.get('/search', getConversationsByKeyword) 
conversationRoute.get('/:conversationId', getMessages)
conversationRoute.get('/:conversationId/participant/delete', deleteParticipant)

export default conversationRoute;