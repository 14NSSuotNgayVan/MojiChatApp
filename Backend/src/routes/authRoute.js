import express from 'express';
import { refreshTokenHander, signInhandler, signOutHandler, signUpHandler } from '../controllers/authController.js';

const authRoute = express.Router();

authRoute.post('/signup', signUpHandler)
authRoute.post('/signin', signInhandler)
authRoute.post('/signout', signOutHandler)
authRoute.post('/refresh-token', refreshTokenHander)

export default authRoute;