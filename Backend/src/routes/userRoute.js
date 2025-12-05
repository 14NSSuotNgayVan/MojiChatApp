import express from 'express';
import { findUserHandler, getProfileHandler } from '../controllers/userController.js';

const userRoute = express.Router();
userRoute.get('/profile', getProfileHandler);
userRoute.get('/', findUserHandler);

export default userRoute;
