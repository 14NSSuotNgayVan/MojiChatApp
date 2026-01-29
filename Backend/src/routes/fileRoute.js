import express from 'express'
import { deleteFile, getAvatarSignature, getBgSignature, getImageSignature } from '../controllers/fileController.js';

const uploadFileRoute = express.Router();

uploadFileRoute.get("/signature/avatar", getAvatarSignature)
uploadFileRoute.get("/signature/bg", getBgSignature)
uploadFileRoute.get("/signature/image", getImageSignature)
uploadFileRoute.delete("/delete", deleteFile)

export default uploadFileRoute;