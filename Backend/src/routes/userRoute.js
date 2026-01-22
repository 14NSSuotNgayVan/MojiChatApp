import express from 'express';
import { findUserHandler, getNotFriendsHandler, getProfileHandler, getUser, updateProfile } from '../controllers/userController.js';

const userRoute = express.Router();
userRoute.get('/profile', getProfileHandler);
userRoute.put('/profile/update', updateProfile);
userRoute.get('/', findUserHandler);
userRoute.get('/not-friend', getNotFriendsHandler);
userRoute.get('/:userId', getUser);

export default userRoute;
