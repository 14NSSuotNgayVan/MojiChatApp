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
        const { recipientId, content, media, conversationId, replyTo } = req.body;
        const senderId = req.user._id;

        let conversation;
        let repliedMessageId = undefined;

        if (!content && !media?.length) {
            return res.status(400).json({ message: "Content must not be empty!" })
        }

        if (conversationId) {
            if (!mongoose.Types.ObjectId.isValid(conversationId)) {
                return res.status(400).json({ message: "Invalid conversationId!" });
            }
            conversation = await Conversation.findById(conversationId).session(session);;
            if (!conversation) {
                return res.status(400).json({ message: "Conversation not found!" })
            }

            if (!conversation.participants.some(p => p.userId.toString() === senderId.toString())) {
                return res.status(403).json({ message: 'User does not belong to the conversation!' })
            }
        } else {
            if (!recipientId) {
                return res.status(400).json({ message: "recipientId must not be empty!" })
            }

            if (!mongoose.Types.ObjectId.isValid(recipientId)) {
                return res.status(400).json({ message: "Invalid recipientId!" });
            }

            conversation = await Conversation.findOne({
                type: "direct",
                "participants.userId": { $all: [senderId, recipientId] }
            })

            if (!conversation) {
                return res.status(400).json({ message: "Conversation not existed!" })
            }
        }

        if (replyTo != null) {
            if (!mongoose.Types.ObjectId.isValid(replyTo)) {
                return res.status(400).json({ message: "Invalid replyTo!" });
            }

            const repliedMessage = await Message.findOne({
                _id: replyTo,
                conversationId: conversation._id,
            }).session(session);

            if (!repliedMessage) {
                return res.status(400).json({ message: "replyTo message not found in this conversation!" });
            }

            repliedMessageId = repliedMessage._id;
        }

        const [message] = await Message.create([{
            conversationId: conversation._id,
            content: content,
            senderId: senderId,
            type: media?.length ? (content ? 'mixed' : 'media') : 'text',
            replyTo: repliedMessageId,
        }], { session })


        if (media?.length) {
            const attachments = await Attachment.insertMany(
                media.map(file => ({
                    conversationId: conversation._id,
                    messageId: message._id,
                    senderId,
                    type: file.type,
                    url: file.url,
                    meta: {
                        duration: file?.duration,
                        poster: file.poster
                    }
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
                    path: 'replyTo',
                    select: 'senderId type content createdAt',
                },
                {
                    path: 'mediaIds', select: 'type url isDeleted createdAt'
                }
            ])).toObject()

        const newMessage = {
            ...fullMessage,
            medias: fullMessage.mediaIds,
            mediaIds: undefined
        };

        updateConversationAfterCreateMessage(conversation, newMessage, senderId);

        await conversation.save();
        emmitNewMessage(io, conversation, newMessage, req.user)

        return res.status(201).json({ message: newMessage })

    } catch (error) {
        console.error("Error when calling sendDirectMessage: " + error);
        await session.abortTransaction();
        return res.status(500).send();
    } finally {
        session.endSession()
    }
}

export const senGroupMessage = async (req, res) => {
    const session = await mongoose.startSession()
    session.startTransaction()
    try {
        const { content, media, replyTo } = req.body;
        const senderId = req.user._id;
        const conversation = req.conversation;
        let repliedMessageId = undefined;

        if (!content && !media?.length) {
            return res.status(400).json({ message: "content must not be empty!" })
        }

        if (replyTo != null) {
            if (!mongoose.Types.ObjectId.isValid(replyTo)) {
                return res.status(400).json({ message: "Invalid replyTo!" });
            }

            const repliedMessage = await Message.findOne({
                _id: replyTo,
                conversationId: conversation._id,
            }).session(session);

            if (!repliedMessage) {
                return res.status(400).json({ message: "replyTo message not found in this conversation!" });
            }

            repliedMessageId = repliedMessage._id;
        }

        const [message] = await Message.create([{
            conversationId: conversation._id,
            content: content,
            senderId: senderId,
            type: media?.length ? (content ? 'mixed' : 'media') : 'text',
            replyTo: repliedMessageId,
        }], { session })

        if (media?.length) {
            const attachments = await Attachment.insertMany(
                media.map(file => ({
                    conversationId: conversation._id,
                    messageId: message._id,
                    senderId,
                    type: file.type,
                    url: file.url,
                    meta: {
                        duration: file?.duration,
                        poster: file.poster
                    }
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
                upsert: true,// cập nhật nếu tồn tại - nếu không => tạo mới
                session
            })

        await session.commitTransaction()

        const fullMessage = (await Message.findById(message._id)
            .populate([
                {
                    path: 'replyTo',
                    select: 'senderId type content createdAt',
                },
                {
                    path: 'mediaIds', select: 'type url isDeleted createdAt'
                }
            ])).toObject()

        const newMessage = {
            ...fullMessage,
            medias: fullMessage.mediaIds,
            mediaIds: undefined
        };

        updateConversationAfterCreateMessage(conversation, newMessage, senderId);
        emmitNewMessage(io, conversation, newMessage, req.user);

        await conversation.save();

        return res.status(201).json({ message: newMessage })
    } catch (error) {
        console.error("Error when calling senGroupMessage: " + error);
        await session.abortTransaction();
        return res.status(500).send();
    } finally {
        session.endSession()
    }
}

export const toggleMessageReaction = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { conversationId, messageId, emoji } = req.body || {};
        const userId = req.user?._id;

        if (!userId) {
            await session.abortTransaction();
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (!conversationId || !messageId) {
            await session.abortTransaction();
            return res.status(400).json({ message: "conversationId and messageId are required!" });
        }

        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
            await session.abortTransaction();
            return res.status(400).json({ message: "Invalid conversationId!" });
        }

        if (!mongoose.Types.ObjectId.isValid(messageId)) {
            await session.abortTransaction();
            return res.status(400).json({ message: "Invalid messageId!" });
        }

        if (typeof emoji !== "string" || !emoji.trim()) {
            await session.abortTransaction();
            return res.status(400).json({ message: "emoji is required!" });
        }

        const trimmedEmoji = emoji.trim();
        if (trimmedEmoji.length > 32) {
            await session.abortTransaction();
            return res.status(400).json({ message: "emoji is too long!" });
        }

        const conversation = await Conversation.findOne({
            _id: conversationId,
            "participants.userId": userId,
        }).select("participants").session(session).lean();

        if (!conversation) {
            await session.abortTransaction();
            return res.status(404).json({ message: "Conversation not found!" });
        }

        const participant = conversation.participants?.find(
            (p) => p.userId?.toString?.() === userId?.toString?.() && p.status === "ACTIVE"
        );

        if (!participant) {
            await session.abortTransaction();
            return res.status(403).json({ message: "You are not an active participant in this conversation." });
        }

        const message = await Message.findOne({
            _id: messageId,
            conversationId,
        }).select("reactions").session(session).lean();

        if (!message) {
            await session.abortTransaction();
            return res.status(404).json({ message: "Message not found!" });
        }

        const existing = (message.reactions || []).find(
            (r) => r.userId?.toString?.() === userId.toString()
        );

        if (existing && existing.emoji === trimmedEmoji) {
            await Message.updateOne(
                { _id: messageId, conversationId },
                { $pull: { reactions: { userId } } },
                { session }
            );
        } else {
            // MongoDB doesn't allow updating the same array path with $pull and $push together.
            // Do it in two steps to preserve single_toggle semantics.
            await Message.updateOne(
                { _id: messageId, conversationId },
                { $pull: { reactions: { userId } } },
                { session }
            );

            await Message.updateOne(
                { _id: messageId, conversationId },
                { $push: { reactions: { emoji: trimmedEmoji, userId } } },
                { session }
            );
        }

        await session.commitTransaction();

        const updated = await Message.findOne({ _id: messageId, conversationId })
            .select("reactions")
            .lean();

        const normalizedReactions = (updated?.reactions || []).map((r) => ({
            emoji: r.emoji,
            userId: r.userId.toString(),
        }));

        io.to(conversationId.toString()).emit("message-reaction-updated", {
            conversationId: conversationId.toString(),
            messageId: messageId.toString(),
            reactions: normalizedReactions,
        });

        return res.status(200).json({
            conversationId: conversationId.toString(),
            messageId: messageId.toString(),
            reactions: normalizedReactions,
        });
    } catch (error) {
        await session.abortTransaction();
        console.error("Error when calling toggleMessageReaction: " + error);
        return res.status(500).send();
    } finally {
        session.endSession();
    }
};