import Conversation from "../models/Conversation.js";
import ConversationStats from "../models/ConversationStats.js";
import Message from "../models/Message.js";
import { io } from "../socket/index.js";
import { emmitNewMessage, updateConversationAfterCreateMessage } from "../utils/messageHelper.js";

export const sendDirectMessage = async (req, res) => {
    try {
        const { recipientId, content, imgUrls, conversationId } = req.body;
        const senderId = req.user._id;

        let conversation;

        if (!content && !imgUrls?.length) {
            return res.status(400).json({ message: "Content must not be empty!" })
        }

        if (conversationId) {
            conversation = await Conversation.findById(conversationId);
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

        emmitNewMessage(io, conversation, message, req.user)
        await conversation.save();

        return res.status(201).json({ message })

    } catch (error) {
        console.error("Error when calling sendDirectMessage: " + error);
        return res.status(500).send();
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