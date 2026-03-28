import express from 'express';
import {
  facebookOAuthCallbackHandler,
  googleOAuthCallbackHandler,
  googleOAuthStartHandler,
  facebookOAuthStartHandler,
  refreshTokenHander,
  signInhandler,
  signOutHandler,
  signUpHandler
} from '../controllers/authController.js';

const authRoute = express.Router();

authRoute.post('/signup', signUpHandler)
authRoute.post('/signin', signInhandler)
authRoute.post('/signout', signOutHandler)
authRoute.post('/refresh-token', refreshTokenHander)
authRoute.get('/oauth/google', googleOAuthStartHandler)
authRoute.get('/oauth/google/callback', googleOAuthCallbackHandler)
authRoute.get('/oauth/facebook', facebookOAuthStartHandler)
authRoute.get('/oauth/facebook/callback', facebookOAuthCallbackHandler)

export default authRoute;