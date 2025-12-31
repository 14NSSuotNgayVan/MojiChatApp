import express from 'express';
import { findUserHandler, getProfileHandler, getUser, updateProfile } from '../controllers/userController.js';

const userRoute = express.Router();
userRoute.get('/profile', getProfileHandler);
userRoute.put('/profile/update', updateProfile);
userRoute.get('/', findUserHandler);
userRoute.get('/:userId', getUser);

export default userRoute;
