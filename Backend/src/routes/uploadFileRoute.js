import express from 'express'
import { getAvatarSignature } from '../controllers/fileController.js';

const uploadFileRoute = express.Router();

uploadFileRoute.get("/avatar/signature", getAvatarSignature)

export default uploadFileRoute;