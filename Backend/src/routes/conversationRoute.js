import express from 'express';
import { addParticipant, addParticipants, clearDirectConversation, createConversation, deleteGroupConversation, deleteParticipant, getConversations, getConversationsByKeyword, getHiddenConversations, getMessages, hideConversation, leaveConversation, unhideConversation, updateParticipantRole } from '../controllers/conversationController.js';

const conversationRoute = express.Router();

conversationRoute.post('/', createConversation)
conversationRoute.get('/', getConversations)
conversationRoute.get('/hidden', getHiddenConversations)
conversationRoute.get('/search', getConversationsByKeyword)
conversationRoute.get('/:conversationId', getMessages)
conversationRoute.post('/:conversationId/hide', hideConversation)
conversationRoute.post('/:conversationId/unhide', unhideConversation)
conversationRoute.post('/:conversationId/clear', clearDirectConversation)
conversationRoute.post('/:conversationId/leave', leaveConversation)
conversationRoute.delete('/:conversationId', deleteGroupConversation)
conversationRoute.delete('/:conversationId/participant/delete', deleteParticipant)
conversationRoute.post('/:conversationId/participant/add', addParticipant)
conversationRoute.post('/:conversationId/participant/add-multiples', addParticipants)
conversationRoute.put('/:conversationId/participant/role', updateParticipantRole)
export default conversationRoute;
