import express from 'express';
import { getProfileHandler } from '../controllers/userController.js';

const userRoute = express.Router();
userRoute.get('/profile', getProfileHandler);

export default userRoute;
