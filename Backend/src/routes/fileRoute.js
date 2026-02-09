import express from 'express'
import { deleteFile, getAvatarSignature, getBgSignature, getConversationMediasByDirection, getMediasGalleryById, getMediaSignature } from '../controllers/fileController.js';

const uploadFileRoute = express.Router();

uploadFileRoute.get("/signature/avatar", getAvatarSignature)
uploadFileRoute.get("/signature/bg", getBgSignature)
uploadFileRoute.get("/signature/media", getMediaSignature)
uploadFileRoute.get("/media/conversation/direction/:conversationId", getConversationMediasByDirection)
uploadFileRoute.get("/media/:mediaId", getMediasGalleryById)
uploadFileRoute.delete("/delete", deleteFile)

export default uploadFileRoute;