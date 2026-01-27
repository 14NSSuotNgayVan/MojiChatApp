import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { io } from "../socket/index.js";
import { convertConversation } from "../utils/conversationHelper.js";
import { getNormalizeString } from "../utils/Utils.js";
import User from "../models/User.js";

export const createConversation = async (req, res) => {
    try {
        const { type, name, memberIds } = req.body;
        const { _id: userId, searchName } = req.user;

        if (!type) {
            return res.status(400).json({ message: "Conversation type must not be empty!" })
        }

        if (!memberIds?.length) {
            return res.status(400).json({ message: "Conversation memberIds must not be empty!" })
        }

        const participants = await User.find({
            _id: {
                $in: memberIds,
                $ne: userId
            }
        }).select("searchName").lean();

        const participantNameNorms = participants.map(p => p.searchName).concat(searchName);

        let conversation;

        switch (type) {
            case "group": {

                const filteredMemberIds = new Map();

                memberIds.forEach(i => {
                    if (i !== userId && !filteredMemberIds.has(i)) {
                        filteredMemberIds.set(i, { userId: i })
                    }

                })

                conversation = await Conversation.create({
                    type,
                    participants: [{ userId }, ...filteredMemberIds.values()],
                    participantNameNorms,
                    lastMessageAt: new Date(),
                    group: {
                        name,
                        nameNorm: name ? getNormalizeString(name) : undefined,
                        createdBy: userId
                    }
                })

                break;
            }

            case "direct": {
                const participantId = memberIds.find(id => id !== userId);

                conversation = await Conversation.findOne({
                    type: "direct",
                    "participants.userId": { $all: [userId, participantId] }
                }).populate([
                    {
                        path: 'participants.userId', select: 'displayName avtUrl email bgUrl bio phone'
                    }
                ]).lean();

                if (!conversation) {
                    conversation = await Conversation.create({
                        type,
                        participants: [{ userId }, { userId: participantId }],
                        participantNameNorms,
                        lastMessageAt: new Date()
                    })
                } else {
                    return res.status(201).json({ conversation: convertConversation(conversation, userId) });
                }

                break;
            }

            default: {
                return res.status(400).json({ message: "Invalid conversation type!" })
            }
        }

        await conversation.save();
        await conversation.populate([
            {
                path: 'participants.userId', select: 'displayName avtUrl email bgUrl bio phone'
            }
        ]);

        return res.status(201).json({
            conversation: convertConversation(conversation.toObject(), userId)
        });

    } catch (error) {
        console.error("Error when calling createConversation: " + error);
        return res.status(500).send();
    }
}

export const getConversations = async (req, res) => {
    try {
        const userId = req.user._id;

        const { limit = 20, cursor } = req.query;

        const query = { "participants.userId": userId };

        if (cursor) {
            query.lastMessageAt = {
                $lt: new Date(cursor)
            }
        }

        const conversations = await Conversation.find(
            query
        ).sort({
            lastMessageAt: -1, updateAt: -1
        }).populate([
            {
                path: 'participants.userId', select: 'displayName avtUrl email bgUrl bio phone',
                options: { lean: true }
            },
        ]).limit(limit + 1)

        const users = {};

        let nextCursor;

        if (conversations.length > Number(limit)) {
            nextCursor = conversations.pop().lastMessageAt;
        }

        const formattedConversation = conversations.map(conv => ({
            ...conv,
            participants: conv.participants?.map(p => {
                if (!users?.[p.userId._id]) {
                    users[p.userId._id] = p.userId
                }
                return ({
                    _id: p.userId?._id || p.userId,
                    joinedAt: p.joinedAt
                })
            }).sort((a, b) => {
                if (a._id.toString() === userId.toString()) return 1
                if (b._id.toString() === userId.toString()) return -1
                return 0
            }),
        }))

        return res.status(200).json({ message: "Get conversation success!", conversations: formattedConversation, users, nextCursor })
    } catch (error) {
        console.error("Error when calling getConversations: " + error);
        return res.status(500).send();
    }
}

export const getConversationsByKeyword = async (req, res) => {
    try {
        const userId = req.user._id;

        const { keyword } = req.query;

        const safeKeyword = keyword?.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

        const query = { "participants.userId": userId };
        let conversations;
        if (safeKeyword) {

            query.$or = [
                { "group.nameNorm": { $regex: safeKeyword, $options: "i" } },
                { participantNameNorms: { $regex: safeKeyword, $options: "i" } }
            ]

            conversations = await Conversation.find(
                query
            ).sort({
                lastMessageAt: -1, updateAt: -1
            }).populate([
                {
                    path: 'participants.userId', select: 'displayName avtUrl email bgUrl bio phone',
                    options: { lean: true }
                },
            ])
        } else {
            conversations = await Conversation.find(
                query
            ).sort({
                messageCount: -1
            }).limit(20).populate([
                {
                    path: 'participants.userId', select: 'displayName avtUrl email bgUrl bio phone',
                    options: { lean: true }
                },
            ])
        }


        const users = {};

        const formattedConversation = conversations.map(conv => ({
            ...conv,
            participants: conv.participants?.map(p => {
                if (!users?.[p.userId._id]) {
                    users[p.userId._id] = p.userId
                }
                return ({
                    _id: p.userId?._id || p.userId,
                    joinedAt: p.joinedAt
                })
            }).sort((a, b) => {
                if (a._id.toString() === userId.toString()) return 1
                if (b._id.toString() === userId.toString()) return -1
                return 0
            }),
        }))

        return res.status(200).json({ message: "Get conversation success!", conversations: formattedConversation, users })
    } catch (error) {
        console.error("Error when calling getConversations: " + error);
        return res.status(500).send();
    }
}

export const getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { limit = 50, cursor } = req.query;
        const userId = req.user._id.toString();

        const query = { conversationId };

        if (cursor) {
            query.createdAt = { $lt: new Date(cursor) };
        }

        let messages = await Message.find(query).sort({ createdAt: -1 }).limit(Number(limit) + 1).lean({
            transform: (doc) => {
                doc.isOwner = doc.senderId.toString() === userId;
                return doc;
            }
        });

        let nextCursor;

        if (messages.length > Number(limit)) {
            nextCursor = messages[messages.length - 2].createdAt.toISOString();
            messages.pop();
        }

        messages.reverse();

        return res.status(200).json({ messages: "Get messages success!", messages, nextCursor })
    } catch (error) {
        console.error("Error when calling getMessages: " + error);
        return res.status(500).send();
    }
}

export const getConversationIds = async (userId) => {
    try {
        const conversationIds = await Conversation.find({
            "participants.userId": userId
        }, { _id: 1 })

        return conversationIds.map(i => i._id.toString());
    } catch (error) {
        console.error("Error when calling getConversationIds: " + error);
        return res.status(500).send();
    }
}

export const updateSeenBy = async (data, socket) => {
    try {
        const userId = socket.user?._id
        const { conversationId } = data

        if (!mongoose.Types.ObjectId.isValid(conversationId)) return
        if (!userId) return

        const conversation = await Conversation.findOne({
            _id: conversationId,
            "participants.userId": userId
        }).select("_id seenBy unreadCounts lastMessage")

        if (!conversation) return

        const seenIndex = conversation.seenBy.findIndex(
            (s) => s.userId.toString() === userId.toString()
        )

        if (conversation.lastMessage.senderId.toString() === userId.toString()) return;

        let conversationUpdated;

        const now = new Date();

        if (seenIndex !== -1) {
            conversationUpdated = await Conversation.findOneAndUpdate(
                {
                    _id: conversationId,
                    "seenBy.userId": userId
                },
                {
                    $set: {
                        "seenBy.$.lastSeenAt": now,
                        "seenBy.$.messageId": conversation.lastMessage._id.toString(),
                        [`unreadCounts.${userId.toString()}`]: 0
                    }
                }
            )
        } else {
            conversationUpdated = await Conversation.findOneAndUpdate(
                {
                    _id: conversationId,
                    "seenBy.userId": { $ne: userId }
                },
                {
                    $push: {
                        seenBy: {
                            userId,
                            lastSeenAt: now,
                            messageId: conversation.lastMessage._id.toString()
                        }
                    },
                    $set: {
                        [`unreadCounts.${userId.toString()}`]: 0
                    }
                }
            )
        }

        io.to(conversationId).emit("seen-message-updated", {
            conversationId,
            lastSeenAt: now,
            user: socket.user,
            messageId: conversationUpdated.lastMessage._id.toString(),
            unreadCounts: conversationUpdated.unreadCounts
        })
    } catch (error) {
        console.error("Error when calling updateSeenBy: " + error);
    }
}