import express from 'express'
import { deleteFile, getAvatarSignature, getBgSignature, getMediaSignature } from '../controllers/fileController.js';

const uploadFileRoute = express.Router();

uploadFileRoute.get("/signature/avatar", getAvatarSignature)
uploadFileRoute.get("/signature/bg", getBgSignature)
uploadFileRoute.get("/signature/media", getMediaSignature)
uploadFileRoute.delete("/delete", deleteFile)

export default uploadFileRoute;