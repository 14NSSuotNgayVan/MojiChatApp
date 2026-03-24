import express from 'express';
import { addParticipant, addParticipants, clearDirectConversation, createConversation, deleteGroupConversation, deleteParticipant, getConversations, getConversationsByKeyword, getHiddenConversations, getMessages, hideConversation, leaveConversation, searchMessages, unhideConversation, updateGroupProfile, updateParticipantRole } from '../controllers/conversationController.js';

const conversationRoute = express.Router();

conversationRoute.post('/', createConversation)
conversationRoute.get('/', getConversations)
conversationRoute.get('/hidden', getHiddenConversations)
conversationRoute.get('/search', getConversationsByKeyword)
conversationRoute.get('/:conversationId/messages/search', searchMessages)
conversationRoute.get('/:conversationId', getMessages)
conversationRoute.put('/:conversationId/group-profile', updateGroupProfile)
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
