import express from 'express';
import { addParticipant, addParticipants, createConversation, deleteParticipant, getConversations, getConversationsByKeyword, getMessages } from '../controllers/conversationController.js';

const conversationRoute = express.Router();

conversationRoute.post('/', createConversation)
conversationRoute.get('/', getConversations)
conversationRoute.get('/search', getConversationsByKeyword)
conversationRoute.get('/:conversationId', getMessages)
conversationRoute.delete('/:conversationId/participant/delete', deleteParticipant)
conversationRoute.post('/:conversationId/participant/add', addParticipant)
conversationRoute.post('/:conversationId/participant/add-multiples', addParticipants)
export default conversationRoute;