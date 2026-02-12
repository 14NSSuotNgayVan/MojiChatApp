import express from 'express'
import { deleteFile, getAvatarSignature, getBgSignature, getConversationMedias, getConversationMediasByDirection, getMediasGalleryById, getMediasGalleryByStartEnd, getMediaSignature } from '../controllers/fileController.js';

const uploadFileRoute = express.Router();

uploadFileRoute.get("/signature/avatar", getAvatarSignature)
uploadFileRoute.get("/signature/bg", getBgSignature)
uploadFileRoute.get("/signature/media", getMediaSignature)
uploadFileRoute.get("/media/direction/conversation/:conversationId", getConversationMediasByDirection)
uploadFileRoute.get("/media/start-end/conversation/:conversationId", getMediasGalleryByStartEnd)
uploadFileRoute.get("/media/conversation/:conversationId", getConversationMedias)
uploadFileRoute.get("/media/:mediaId", getMediasGalleryById)
uploadFileRoute.delete("/delete", deleteFile)

export default uploadFileRoute;