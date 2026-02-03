import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import ConversationStats from "../models/ConversationStats.js";
import Message from "../models/Message.js";
import { io } from "../socket/index.js";
import { emmitNewMessage, updateConversationAfterCreateMessage } from "../utils/messageHelper.js";
import Attachment from "../models/Attachment.js";

export const sendDirectMessage = async (req, res) => {
    const session = await mongoose.startSession()
    session.startTransaction()
    try {
        const { recipientId, content, media, conversationId } = req.body;
        const senderId = req.user._id;

        let conversation;

        if (!content && !media?.length) {
            return res.status(400).json({ message: "Content must not be empty!" })
        }

        if (conversationId) {
            conversation = await Conversation.findById(conversationId).session(session);;
            if (!conversation) {
                return res.status(400).json({ message: "Conversation not found!" })
            }

        } else {
            if (!recipientId) {
                return res.status(400).json({ message: "recipientId must not be empty!" })
            }

            conversation = await Conversation.findOne({
                type: "direct",
                "participants.userId": { $all: [senderId, recipientId] }
            })

            if (!conversation) {
                return res.status(400).json({ message: "conversation not existed!" })
            }
        }

        if (!conversation.participants.some(p => p.userId.toString() === senderId.toString())) {
            return res.status(403).json({ message: 'User does not belong to the conversation!' })
        }

        const [message] = await Message.create([{
            conversationId: conversation._id,
            content: content,
            senderId: senderId,
            type: media?.length ? (content ? 'mixed' : 'media') : 'text'
        }], { session })


        if (media?.length) {
            const attachments = await Attachment.insertMany(
                media.map(file => ({
                    conversationId: conversation._id,
                    messageId: message._id,
                    senderId,
                    type: file.type,
                    url: file.url
                })),
                { session }
            )

            await Message.updateOne(
                { _id: message._id },
                { $set: { mediaIds: attachments.map(a => a._id) } },
                { session }
            )
        }

        await ConversationStats.updateOne({
            userId: senderId,
            conversationId: conversation._id,
        },
            {
                $inc: { messageCount: 1 },
                $set: { lastMessageAt: message.createdAt }
            },
            {
                upsert: true,// cập nhật nếu tồn tại - nếu không => tạo mới,
                session
            })

        await session.commitTransaction()

        const fullMessage = (await Message.findById(message._id)
            .populate([
                {
                    path: 'mediaIds', select: 'type url isDeleted createdAt'
                }
            ])).toObject()

        updateConversationAfterCreateMessage(conversation, fullMessage, senderId);

        await conversation.save();
        emmitNewMessage(io, conversation, fullMessage, req.user)

        return res.status(201).json({ fullMessage })

    } catch (error) {
        console.error("Error when calling sendDirectMessage: " + error);
        await session.abortTransaction();
        return res.status(500).send();
    } finally {
        session.endSession()
    }
}

export const senGroupMessage = async (req, res) => {
    try {
        const { content, imgUrls } = req.body;
        const senderId = req.user._id;
        const conversation = req.conversation;

        if (!content && !imgUrls?.length) {
            return res.status(400).json({ message: "content must not be empty!" })
        }

        const message = await Message.create({
            conversationId: conversation._id,
            content: content,
            senderId: senderId,
            imgUrls: imgUrls,
            type: imgUrls?.length ? 'image' : 'text'
        })

        await ConversationStats.updateOne({
            userId: senderId,
            conversationId: conversation._id,
        },
            {
                $inc: { messageCount: 1 },
                $set: { lastMessageAt: message.createdAt }
            },
            {
                upsert: true// cập nhật nếu tồn tại - nếu không => tạo mới
            })
        updateConversationAfterCreateMessage(conversation, message, senderId);
        emmitNewMessage(io, conversation, message, req.user);

        await conversation.save();

        return res.status(201).json({ message })
    } catch (error) {
        console.error("Error when calling senGroupMessage: " + error);
        return res.status(500).send();
    }
}