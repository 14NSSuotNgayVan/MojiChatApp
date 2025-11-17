import express from 'express';
import { signInhandler, signUpHandler } from '../controllers/authController.js';

const authRoute = express.Router();

authRoute.post('/signup', signUpHandler)
authRoute.post('/signin', signInhandler)

export default authRoute;