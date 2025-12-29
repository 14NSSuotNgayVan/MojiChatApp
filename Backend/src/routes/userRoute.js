import express from 'express';
import { findUserHandler, getProfileHandler, getUser } from '../controllers/userController.js';

const userRoute = express.Router();
userRoute.get('/profile', getProfileHandler);
userRoute.get('/', findUserHandler);
userRoute.get('/:userId', getUser);

export default userRoute;
