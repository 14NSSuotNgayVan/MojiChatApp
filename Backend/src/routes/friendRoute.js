import express from 'express';
import { acceptFriendRequestHandler, addFriendHandler, deleteFriendRequestHandler, getFriendRequestsHandler, getFriendsHandler, unFriendsHandler } from '../controllers/friendController.js';

const friendRouter = express.Router();

friendRouter.post('/request', addFriendHandler)
friendRouter.post('/request/:requestId/accept', acceptFriendRequestHandler)
friendRouter.post('/request/:requestId/decline', deleteFriendRequestHandler)
friendRouter.get('/', getFriendsHandler)
friendRouter.get('/request', getFriendRequestsHandler)
friendRouter.delete('/:friendId', unFriendsHandler)

export default friendRouter;