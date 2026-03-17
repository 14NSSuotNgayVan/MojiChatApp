import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { io } from "../socket/index.js";
import { convertConversation } from "../utils/conversationHelper.js";
import { getNormalizeString } from "../utils/Utils.js";
import User from "../models/User.js";
import ConversationStats from "../models/ConversationStats.js";

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
                }).lean();

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
        ]).limit(limit + 1).lean()

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
                    ...p,
                    _id: p.userId?._id || p.userId,
                    userId: undefined
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
            ]).lean()

        } else {

            const mostFrequentlyChat = await ConversationStats.find({
                userId: userId,
            }).sort({
                messageCount: -1
            }).limit(20).lean()

            if (!mostFrequentlyChat?.length) return res.status(200).json({ message: "Get conversation success!", conversations: [], users: {} });

            const chatIds = mostFrequentlyChat?.map(c => c.conversationId);

            query._id = {
                $in: chatIds
            }

            conversations = await Conversation.find(
                query
            ).populate([
                {
                    path: 'participants.userId', select: 'displayName avtUrl email bgUrl bio phone',
                    options: { lean: true }
                },
            ]).lean()
        }


        const users = {};

        const formattedConversation = conversations.map(conv => ({
            ...conv,
            participants: conv.participants?.map(p => {
                if (!users?.[p.userId._id]) {
                    users[p.userId._id] = p.userId
                }
                return ({
                    ...p,
                    _id: p.userId?._id || p.userId,
                    userId: undefined
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

        let messages = await Message.find(query).sort({ createdAt: -1, _id: -1 }).limit(Number(limit) + 1)
            .populate([
                {
                    path: 'replyTo', select: 'senderId type content createdAt',
                    options: { lean: true }
                },
                {
                    path: 'mediaIds', select: 'type url isDeleted createdAt meta',
                    options: { lean: true }
                }
            ])
            .lean({
                transform: (doc) => {
                    doc.isOwner = doc.senderId.toString() === userId;
                    doc.medias = doc.mediaIds;
                    delete doc.mediaIds;
                    return doc;
                }
            });

        let nextCursor;

        if (messages.length > Number(limit)) {
            nextCursor = messages[messages.length - 2].createdAt.toISOString();
            messages.pop();
        }

        const messageRes = [];
        for (let i = messages.length - 1; i >= 0; i--) {
            const currentMsg = messages[i];
            const medias = currentMsg.mediaIds;
            delete currentMsg.mediaIds;
            messageRes.push({
                ...currentMsg,
                isOwner: currentMsg.senderId.toString() === userId,
                medias,
            });
        }

        return res
            .status(200)
            .json({
                message: "Get messages success!",
                messages: messageRes,
                nextCursor,
            });
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
        return [];
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

export const deleteParticipant = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { participantId } = req.query;
        const user = req.user;

        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
            return res.status(400).json({ message: "Invalid conversationId!" });
        }

        if (!participantId) {
            return res.status(400).json({ message: "participantId must not be null!" });
        }

        if (!mongoose.Types.ObjectId.isValid(participantId)) {
            return res.status(400).json({ message: "Invalid participantId!" });
        }

        const paritcipant = await User.findById(participantId).lean();

        if (!paritcipant) {
            return res.status(400).json({ message: "User not found!" })
        }

        const conversation = await Conversation.findById(conversationId).lean();

        if (!conversation) {
            return res.status(400).json({ message: "Conversation not found!" })
        }

        const isAdmin = conversation.participants.findIndex(p => p.userId.toString() === user._id.toString() && p.role === 'ADMIN')

        if (isAdmin === -1) return res.status(400).json({ message: "You are not allowed to do this!" })

        const updatedConv = await Conversation.findOneAndUpdate(
            {
                _id: conversationId,
                "participants.userId": participantId
            },
            {
                $set: {
                    "participants.$.status": "LEFT"
                },
                $unset: {
                    [`unreadCounts.${paritcipant._id.toString()}`]: 0
                },
                $pull: {
                    seenBy: { userId: participantId },
                    participantNameNorms: paritcipant.searchName,
                }
            }
        )
        return res.status(200).json({ messages: "Delete paricipant success!", conversation: updatedConv })
    } catch (error) {
        console.error("Error when calling deleteParticipant: " + error);
        return res.status(500).send();
    }
}

export const addParticipant = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { participantId } = req.query;
        const user = req.user;

        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
            return res.status(400).json({ message: "Invalid conversationId!" });
        }

        if (!participantId) {
            return res.status(400).json({ message: "participantId must not be null!" });
        }

        if (!mongoose.Types.ObjectId.isValid(participantId)) {
            return res.status(400).json({ message: "Invalid participantId!" });
        }

        const paritcipant = await User.findById(participantId).lean();

        if (!paritcipant) {
            return res.status(400).json({ message: "User not found!" })
        }

        const conversation = await Conversation.findById(conversationId).lean();

        if (!conversation) {
            return res.status(400).json({ message: "Conversation not found!" })
        }

        if (conversation.type !== "group") {
            return res.status(400).json({ message: "Conversation is not a group!" })
        }

        const existingParticipant = conversation.participants.find(p => p.userId.toString() === participantId);

        if (existingParticipant && existingParticipant.status === "ACTIVE") {
            return res.status(400).json({ message: "User is already in the conversation!" })
        }

        if (existingParticipant && existingParticipant.status === "LEFT") {
            await Conversation.updateOne(
                {
                    _id: conversationId,
                    "participants.userId": participantId
                },
                {
                    $set: {
                        "participants.$.status": "ACTIVE",
                        "participants.$.joinedAt": new Date(),
                        "participants.$.addedBy": user._id.toString(),
                    },
                    $push: {
                        participantNameNorms: paritcipant.searchName,
                        seenBy: {
                            userId: participantId,
                            lastSeenAt: new Date(),
                            messageId: conversation.lastMessage?._id?.toString()
                        }
                    }
                }
            )
        }
        else {
            await Conversation.updateOne(
                {
                    _id: conversationId
                },
                {
                    $push: {
                        participants: {
                            userId: participantId,
                            role: 'MEMBER',
                            status: 'ACTIVE',
                            addedBy: user._id.toString(),
                            addedAt: new Date()
                        },
                        participantNameNorms: paritcipant.searchName,
                        seenBy: { userId: participantId, lastSeenAt: new Date(), messageId: conversation.lastMessage?._id.toString() },
                    },
                    $set: {
                        [`unreadCounts.${paritcipant._id.toString()}`]: 0
                    }
                }
            )
        }
        return res.status(200).json({ messages: "Add paricipant success!" })
    } catch (error) {
        console.error("Error when calling addParticipant: " + error);
        return res.status(500).send();
    }
}

export const addParticipants = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const participantIds = req.query.participantIds.split(",");
        const user = req.user;

        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
            return res.status(400).json({ message: "Invalid conversationId!" });
        }

        const conversation = await Conversation.findById(conversationId).lean();

        if (!conversation) {
            return res.status(400).json({ message: "Conversation not found!" })
        }

        const isAdmin = conversation.participants.findIndex(p => p.userId.toString() === user._id.toString() && p.role === 'ADMIN')

        if (isAdmin === -1) return res.status(400).json({ message: "You are not allowed to do this!" })

        const participants = await User.find({
            _id: {
                $in: participantIds
            }
        }).select("searchName").lean();

        const existingMap = new Map();

        conversation.participants.forEach(p => {
            existingMap.set(p.userId.toString(), p.status);
        });

        const toReactivate = [];
        const toInsert = [];

        participants.forEach(participant => {
            const status = existingMap.get(participant._id.toString());

            if (!status) {
                toInsert.push(participant);
            } else if (status === "LEFT") {
                toReactivate.push(participant);
            }
        });

        const bulkOps = [];
        const now = new Date();

        toReactivate.forEach(participant => {
            bulkOps.push({
                updateOne: {
                    filter: {
                        _id: conversationId,
                        "participants.userId": participant?._id?.toString()
                    },
                    update: {
                        $set: {
                            "participants.$.status": "ACTIVE",
                            "participants.$.joinedAt": now,
                            "participants.$.leftAt": null
                        },
                        $setOnInsert: {
                            [`unreadCounts.${participant?._id?.toString()}`]: 0
                        },
                        $push: {
                            participantNameNorms: participant.searchName,
                            seenBy: { userId: participant?._id?.toString(), lastSeenAt: new Date(), messageId: conversation.lastMessage?._id?.toString() }
                        }
                    }
                }
            });
        });

        if (toInsert.length) {
            bulkOps.push({
                updateOne: {
                    filter: { _id: conversationId },
                    update: {
                        $push: {
                            participants: {
                                $each: toInsert.map(participant => ({
                                    userId: participant._id,
                                    role: "MEMBER",
                                    status: "ACTIVE",
                                    joinedAt: now,
                                    addedBy: user._id.toString()
                                }))
                            },
                            participantNameNorms: toInsert.map(participant => participant.searchName),
                            seenBy: toInsert.map(participant => ({ userId: participant._id.toString(), lastSeenAt: new Date(), messageId: conversation.lastMessage?._id.toString() }))
                        },
                        $set: toInsert.reduce((acc, participant) => {
                            acc[`unreadCounts.${participant._id.toString()}`] = 0;
                            return acc;
                        }, {})
                    }
                }
            });
        }
        if (bulkOps.length) {
            await Conversation.bulkWrite(bulkOps);
        }
        return res.status(200).json({ messages: "Add participants success!", conversation: await Conversation.findById(conversationId).lean() });
    } catch (error) {
        console.error("Error when calling addParticipants: " + error);
        return res.status(500).send();
    }
}