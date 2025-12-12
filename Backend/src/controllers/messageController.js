import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { updateConversationAfterCreateMessage } from "../utils/messageHelper.js";

export const sendDirectMessage = async (req, res) => {
    try {
        const { recipientId, content, conversationId } = req.body;
        const senderId = req.user._id;

        let conversation;

        if (!content) {
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

            const conversationExisted = await Conversation.findOne({
                type: "direct",
                "participants.userId": { $all: [senderId, recipientId] }
            })

            conversation = conversationExisted ? conversationExisted : await Conversation.create({
                participants: [
                    {
                        userId: senderId, joinedAt: new Date(),
                    },
                    {
                        userId: recipientId, joinedAt: new Date(),
                    },
                ],
                type: "direct",
                lastMessageAt: new Date(),
                unreadCounts: new Map()
            })
        }

        const message = await Message.create({
            conversationId: conversation._id,
            content: content,
            senderId: senderId,
        })

        updateConversationAfterCreateMessage(conversation, message, senderId);

        await conversation.save();

        return res.status(201).json({ message })

    } catch (error) {
        console.error("Error when calling sendDirectMessage: " + error);
        return res.status(500).send();
    }
}
export const senGroupMessage = async (req, res) => {
    try {
        const { content } = req.body;
        const me = req.user._id;
        const conversation = req.conversation;

        if (!content) {
            return res.status(400).json({ message: "content must not be empty!" })
        }

        const message = await Message.create({
            conversationId: conversation._id,
            content: content,
            senderId: me,
        })

        updateConversationAfterCreateMessage(conversation, message, me);

        await conversation.save();

        return res.status(201).json({ message })
    } catch (error) {
        console.error("Error when calling senGroupMessage: " + error);
        return res.status(500).send();
    }
}