import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import Attachment from "../models/Attachment.js";
import { io, onlineUsers } from "../socket/index.js";
import { convertConversation } from "../utils/conversationHelper.js";
import { getNormalizeString } from "../utils/Utils.js";
import User from "../models/User.js";
import ConversationStats from "../models/ConversationStats.js";

export const createConversation = async (req, res) => {
    try {
        const { type, name, memberIds, avtUrl } = req.body;
        const { _id: userId, searchName } = req.user;

        if (!type) {
            return res.status(400).json({ message: "Conversation type must not be empty!" })
        }

        if (!memberIds?.length) {
            return res.status(400).json({ message: "Conversation memberIds must not be empty!" })
        }

        const participantUsers = await User.find({
            _id: {
                $in: memberIds,
                $ne: userId
            }
        }).select("searchName").lean();

        // Build participantNameNormsById map: { [userId]: searchName }
        const participantNameNormsById = participantUsers.reduce((acc, p) => {
            acc[p._id.toString()] = p.searchName;
            return acc;
        }, { [userId.toString()]: searchName });

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
                    participants: [{ userId, role: 'ADMIN' }, ...filteredMemberIds.values()],
                    participantNameNormsById,
                    lastMessageAt: new Date(),
                    group: {
                        name,
                        nameNorm: name ? getNormalizeString(name) : undefined,
                        createdBy: userId,
                        avtUrl: avtUrl || undefined
                    }
                })

                const groupCreatedMsg = await Message.create({
                    conversationId: conversation._id,
                    senderId: userId,
                    type: 'system',
                    systemType: 'GROUP_CREATED',
                    meta: { actorId: userId }
                });

                await Conversation.updateOne(
                    { _id: conversation._id },
                    {
                        $set: {
                            lastMessage: {
                                _id: groupCreatedMsg._id.toString(),
                                content: null,
                                senderId: userId,
                                type: 'system',
                                systemType: 'GROUP_CREATED',
                                createdAt: groupCreatedMsg.createdAt
                            },
                            lastMessageAt: groupCreatedMsg.createdAt
                        }
                    }
                );

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
                        participantNameNormsById,
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
        const userIdStr = userId?.toString?.() || String(userId);

        const { limit = 20, cursor } = req.query;

        const query = {
            participants: { $elemMatch: { userId, status: "ACTIVE" } },
            $or: [
                { [`hiddenFor.${userIdStr}`]: { $exists: false } },
                {
                    $expr: {
                        $gt: [
                            "$lastMessageAt",
                            { $getField: { field: userIdStr, input: "$hiddenFor" } }
                        ]
                    }
                }
            ]
        };

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

        const query = { participants: { $elemMatch: { userId, status: "ACTIVE" } } };
        let conversations;

        if (safeKeyword) {

            query.$or = [
                { "group.nameNorm": { $regex: safeKeyword, $options: "i" } },
                {
                    $expr: {
                        $gt: [
                            {
                                $size: {
                                    $filter: {
                                        input: { $objectToArray: "$participantNameNormsById" },
                                        as: "kv",
                                        cond: { $regexMatch: { input: "$$kv.v", regex: safeKeyword, options: "i" } }
                                    }
                                }
                            },
                            0
                        ]
                    }
                }
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

export const getHiddenConversations = async (req, res) => {
    try {
        const userId = req.user._id;
        const userIdStr = userId?.toString?.() || String(userId);

        const query = {
            participants: { $elemMatch: { userId, status: "ACTIVE" } },
            [`hiddenFor.${userIdStr}`]: { $exists: true },
            $expr: {
                $lte: [
                    "$lastMessageAt",
                    { $getField: { field: userIdStr, input: "$hiddenFor" } }
                ]
            }
        };

        const conversations = await Conversation.find(query)
            .sort({ lastMessageAt: -1, updateAt: -1 })
            .populate([
                {
                    path: 'participants.userId',
                    select: 'displayName avtUrl email bgUrl bio phone',
                    options: { lean: true }
                },
            ])
            .lean();

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

        return res.status(200).json({
            message: "Get hidden conversations success!",
            conversations: formattedConversation,
            users
        });
    } catch (error) {
        console.error("Error when calling getHiddenConversations: " + error);
        return res.status(500).send();
    }
}

export const getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { limit = 50, cursor } = req.query;
        const userIdObj = req.user._id;
        const userId = userIdObj?.toString?.() || String(userIdObj);

        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
            return res.status(400).json({ message: "Invalid conversationId!" });
        }

        const conv = await Conversation.findOne({
            _id: conversationId,
            "participants.userId": userIdObj
        }).select("type clearedAt participants").lean();

        if (!conv) {
            return res.status(404).json({ message: "Conversation not found!" });
        }

        const clearedAt =
            conv?.clearedAt?.get?.(userId) ??
            conv?.clearedAt?.[userId];

        const selfParticipant = conv?.participants?.find(
            (p) => p?.userId?.toString?.() === userIdObj?.toString?.()
        );

        const query = { conversationId };

        const createdAt = {};
        if (cursor) createdAt.$lt = new Date(cursor);
        if (conv?.type === "direct" && clearedAt) createdAt.$gte = new Date(clearedAt);
        if (conv?.type === "group" && selfParticipant?.status === "LEFT" && selfParticipant?.leftAt) {
            createdAt.$lte = new Date(selfParticipant.leftAt);
        }

        if (Object.keys(createdAt).length) {
            query.createdAt = createdAt;
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

const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const searchMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { keyword, limit = 20, cursor } = req.query;
        const userIdObj = req.user._id;
        const userId = userIdObj?.toString?.() || String(userIdObj);

        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
            return res.status(400).json({ message: "Invalid conversationId!" });
        }

        const kw = typeof keyword === "string" ? keyword.trim() : "";
        if (!kw) {
            return res.status(400).json({ message: "Keyword is required!" });
        }

        const conv = await Conversation.findOne({
            _id: conversationId,
            "participants.userId": userIdObj,
        })
            .select("type clearedAt participants")
            .lean();

        if (!conv) {
            return res.status(404).json({ message: "Conversation not found!" });
        }

        const selfParticipant = conv?.participants?.find(
            (p) => p?.userId?.toString?.() === userIdObj?.toString?.()
        );
        if (!selfParticipant) {
            return res.status(403).json({ message: "You are not a participant in this conversation." });
        }

        const clearedAt =
            conv?.clearedAt?.get?.(userId) ?? conv?.clearedAt?.[userId];

        const visibilityCreatedAt = {};
        if (conv?.type === "direct" && clearedAt) visibilityCreatedAt.$gte = new Date(clearedAt);
        if (conv?.type === "group" && selfParticipant?.status === "LEFT" && selfParticipant?.leftAt) {
            visibilityCreatedAt.$lte = new Date(selfParticipant.leftAt);
        }

        const createdAtFilter = { ...visibilityCreatedAt };
        if (cursor) createdAtFilter.$lt = new Date(cursor);

        const baseMatch = {
            conversationId: new mongoose.Types.ObjectId(conversationId),
            type: { $ne: "system" },
            isDeleted: { $ne: true },
            content: { $regex: escapeRegex(kw), $options: "i" },
        };

        const countQuery = { ...baseMatch };
        if (Object.keys(visibilityCreatedAt).length) {
            countQuery.createdAt = visibilityCreatedAt;
        }

        const findQuery = { ...baseMatch };
        if (Object.keys(createdAtFilter).length) {
            findQuery.createdAt = createdAtFilter;
        }

        const lim = Math.min(Math.max(Number(limit) || 20, 1), 50);

        const total = await Message.countDocuments(countQuery);

        let messages = await Message.find(findQuery)
            .sort({ createdAt: -1, _id: -1 })
            .limit(lim + 1)
            .populate([
                {
                    path: "replyTo",
                    select: "senderId type content createdAt",
                    options: { lean: true },
                },
                {
                    path: "mediaIds",
                    select: "type url isDeleted createdAt meta",
                    options: { lean: true },
                },
            ])
            .lean();

        let nextCursor;
        if (messages.length > lim) {
            nextCursor = messages[messages.length - 2].createdAt.toISOString();
            messages.pop();
        }

        const messageRes = messages.map((currentMsg) => {
            const medias = currentMsg.mediaIds;
            delete currentMsg.mediaIds;
            return {
                ...currentMsg,
                isOwner: currentMsg.senderId.toString() === userId,
                medias,
            };
        });

        return res.status(200).json({
            message: "Search messages success!",
            messages: messageRes,
            nextCursor,
            total,
        });
    } catch (error) {
        console.error("Error when calling searchMessages: " + error);
        return res.status(500).send();
    }
};

export const updateGroupProfile = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { conversationId } = req.params;
        const userId = req.user?._id;
        const { name, avtUrl } = req.body || {};

        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
            return res.status(400).json({ message: "Invalid conversationId!" });
        }

        if (name == null && avtUrl == null) {
            return res.status(400).json({ message: "Nothing to update!" });
        }

        const conversation = await Conversation.findById(conversationId).session(session);
        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found!" });
        }

        if (conversation.type !== "group") {
            return res.status(400).json({ message: "Only group conversations can be updated." });
        }

        const participant = conversation.participants?.find(
            (p) => p.userId?.toString?.() === userId?.toString?.()
        );
        if (!participant || participant.status !== "ACTIVE") {
            return res.status(403).json({ message: "You are not an active member of this conversation." });
        }

        const now = new Date();
        const systemMessages = [];

        const updates = {};
        const changedGroup = {};

        const prevName = (conversation.group?.name || "").trim();
        const prevAvtUrl = (conversation.group?.avtUrl || "").trim();

        const wantsName = typeof name === "string";
        const wantsAvt = typeof avtUrl === "string";

        const nextName = wantsName ? name.trim() : prevName;
        const nextAvtUrl = wantsAvt ? avtUrl.trim() : prevAvtUrl;

        const nameChanged = wantsName && nextName !== prevName;
        const avatarChanged = wantsAvt && nextAvtUrl !== prevAvtUrl;

        if (!nameChanged && !avatarChanged) {
            await session.abortTransaction();
            return res.status(200).json({
                message: "No changes",
                conversationId,
                group: {}
            });
        }

        if (nameChanged) {
            updates["group.name"] = nextName || undefined;
            updates["group.nameNorm"] = nextName ? getNormalizeString(nextName) : undefined;
            changedGroup.name = nextName;

            const msg = await Message.create([{
                conversationId,
                senderId: userId,
                type: "system",
                systemType: "GROUP_NAME_CHANGED",
                meta: { actorId: userId, oldValue: prevName, newValue: nextName },
                createdAt: now
            }], { session });
            systemMessages.push(msg[0]);
        }

        if (avatarChanged) {
            updates["group.avtUrl"] = nextAvtUrl || undefined;
            changedGroup.avtUrl = nextAvtUrl;

            const msg = await Message.create([{
                conversationId,
                senderId: userId,
                type: "system",
                systemType: "GROUP_AVATAR_CHANGED",
                meta: { actorId: userId, oldValue: prevAvtUrl, newValue: nextAvtUrl },
                createdAt: now
            }], { session });
            systemMessages.push(msg[0]);
        }

        if (Object.keys(updates).length) {
            await Conversation.updateOne(
                { _id: conversationId },
                { $set: updates },
                { session }
            );
        }

        const lastSystemMessage = systemMessages[systemMessages.length - 1];
        if (lastSystemMessage) {
            await Conversation.updateOne(
                { _id: conversationId },
                {
                    $set: {
                        lastMessage: {
                            _id: lastSystemMessage._id.toString(),
                            content: null,
                            senderId: userId,
                            type: "system",
                            systemType: lastSystemMessage.systemType,
                            createdAt: lastSystemMessage.createdAt
                        },
                        lastMessageAt: lastSystemMessage.createdAt
                    }
                },
                { session }
            );
        }

        await session.commitTransaction();

        const payload = {
            conversationId,
            group: changedGroup,
            systemMessages
        };

        if (Object.keys(changedGroup).length || systemMessages.length) {
            io.to(conversationId).emit("group-profile-updated", payload);
        }

        return res.status(200).json({ message: "Update group profile success!", ...payload });
    } catch (error) {
        await session.abortTransaction();
        console.error("Error when calling updateGroupProfile: " + error);
        return res.status(500).json({ message: "Internal server error" });
    } finally {
        session.endSession();
    }
}

export const unhideConversation = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user?._id;

        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
            return res.status(400).json({ message: "Invalid conversationId!" });
        }

        const conversation = await Conversation.findOne({
            _id: conversationId,
            "participants.userId": userId
        }).select("_id participants").lean();

        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found!" });
        }

        const participant = conversation.participants?.find(
            (p) => p.userId?.toString?.() === userId?.toString?.()
        );
        if (!participant || participant.status !== "ACTIVE") {
            return res.status(403).json({ message: "You are not an active member of this conversation." });
        }

        await Conversation.updateOne(
            { _id: conversationId },
            { $unset: { [`hiddenFor.${userId.toString()}`]: "" } }
        );

        return res.status(200).json({ message: "Unhide conversation success!" });
    } catch (error) {
        console.error("Error when calling unhideConversation: " + error);
        return res.status(500).send();
    }
}

export const hideConversation = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user?._id;

        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
            return res.status(400).json({ message: "Invalid conversationId!" });
        }

        const conversation = await Conversation.findOne({
            _id: conversationId,
            "participants.userId": userId
        }).select("_id lastMessageAt participants").lean();

        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found!" });
        }

        const participant = conversation.participants?.find(
            (p) => p.userId?.toString?.() === userId?.toString?.()
        );
        if (!participant || participant.status !== "ACTIVE") {
            return res.status(403).json({ message: "You are not an active member of this conversation." });
        }

        const lastMessageAt = conversation.lastMessageAt || new Date();

        await Conversation.updateOne(
            { _id: conversationId },
            { $set: { [`hiddenFor.${userId.toString()}`]: lastMessageAt } }
        );

        return res.status(200).json({ message: "Hide conversation success!" });
    } catch (error) {
        console.error("Error when calling hideConversation: " + error);
        return res.status(500).send();
    }
}

export const clearDirectConversation = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user?._id;

        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
            return res.status(400).json({ message: "Invalid conversationId!" });
        }

        const conversation = await Conversation.findOne({
            _id: conversationId,
            "participants.userId": userId
        }).select("_id type lastMessageAt participants").lean();

        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found!" });
        }

        if (conversation.type !== "direct") {
            return res.status(400).json({ message: "Only direct conversations can be cleared." });
        }

        const participant = conversation.participants?.find(
            (p) => p.userId?.toString?.() === userId?.toString?.()
        );
        if (!participant || participant.status !== "ACTIVE") {
            return res.status(403).json({ message: "You are not an active member of this conversation." });
        }

        const now = new Date();
        const lastMessageAt = conversation.lastMessageAt || now;

        await Conversation.updateOne(
            { _id: conversationId },
            {
                $set: {
                    [`clearedAt.${userId.toString()}`]: now,
                    [`hiddenFor.${userId.toString()}`]: lastMessageAt
                }
            }
        );

        return res.status(200).json({ message: "Clear direct conversation success!" });
    } catch (error) {
        console.error("Error when calling clearDirectConversation: " + error);
        return res.status(500).send();
    }
}

export const deleteGroupConversation = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { conversationId } = req.params;
        const userId = req.user?._id;

        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
            return res.status(400).json({ message: "Invalid conversationId!" });
        }

        const conversation = await Conversation.findById(conversationId).session(session).lean();
        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found!" });
        }

        if (conversation.type !== "group") {
            return res.status(400).json({ message: "Only group conversations can be deleted." });
        }

        const caller = conversation.participants?.find(
            (p) => p.userId?.toString?.() === userId?.toString?.()
        );
        if (!caller || caller.status !== "ACTIVE" || caller.role !== "ADMIN") {
            return res.status(403).json({ message: "You are not allowed to do this!" });
        }

        await Message.deleteMany({ conversationId }, { session });
        await Attachment.deleteMany({ conversationId }, { session });
        await ConversationStats.deleteMany({ conversationId }, { session });
        await Conversation.deleteOne({ _id: conversationId }, { session });

        await session.commitTransaction();

        io.to(conversationId).emit("conversation-deleted", { conversationId });

        return res.status(200).json({ message: "Delete group conversation success!" });
    } catch (error) {
        await session.abortTransaction();
        console.error("Error when calling deleteGroupConversation: " + error);
        return res.status(500).json({ message: "Internal server error" });
    } finally {
        session.endSession();
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
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { conversationId } = req.params;
        const { participantId } = req.query;
        const user = req.user;

        // --- Input validation ---
        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
            return res.status(400).json({ message: "Invalid conversationId!" });
        }

        if (!participantId || !mongoose.Types.ObjectId.isValid(participantId)) {
            return res.status(400).json({ message: "Invalid participantId!" });
        }

        const targetUser = await User.findById(participantId).lean();

        if (!targetUser) {
            return res.status(404).json({ message: "User not found!" });
        }

        const conversation = await Conversation.findById(conversationId).session(session).lean();

        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found!" });
        }

        // --- Must be a group conversation ---
        if (conversation.type !== 'group') {
            return res.status(400).json({ message: "Cannot remove participants from a direct conversation!" });
        }

        // --- Caller must be an ACTIVE ADMIN ---
        const caller = conversation.participants.find(
            p => p.userId.toString() === user._id.toString()
        );

        if (!caller || caller.role !== 'ADMIN' || caller.status !== 'ACTIVE') {
            return res.status(403).json({ message: "You are not allowed to do this!" });
        }

        // --- Prevent self-removal via this endpoint ---
        if (participantId.toString() === user._id.toString()) {
            return res.status(400).json({ message: "Cannot remove yourself. Use the leave endpoint instead." });
        }

        // --- Target must exist and be ACTIVE ---
        const target = conversation.participants.find(
            p => p.userId.toString() === participantId.toString()
        );

        if (!target || target.status !== 'ACTIVE') {
            return res.status(400).json({ message: "Participant is not active in this group!" });
        }

        const now = new Date();

        // --- Atomic soft-delete + cleanup (with leftAt) ---
        const updatedConv = await Conversation.findOneAndUpdate(
            {
                _id: conversationId,
                "participants.userId": participantId
            },
            {
                $set: {
                    "participants.$.status": "LEFT",
                    "participants.$.leftAt": now
                },
                $unset: {
                    [`unreadCounts.${targetUser._id.toString()}`]: "",
                    [`participantNameNormsById.${targetUser._id.toString()}`]: ""
                },
                $pull: {
                    seenBy: { userId: targetUser._id },
                }
            },
            { new: true, session }
        );

        // --- System message (in same transaction) ---
        const [systemMessage] = await Message.create([{
            conversationId,
            senderId: user._id,
            type: 'system',
            systemType: 'USER_REMOVED',
            meta: { actorId: user._id, targetUserId: targetUser._id },
            createdAt: now
        }], { session });

        await Conversation.updateOne(
            { _id: conversationId },
            {
                $set: {
                    lastMessage: {
                        _id: systemMessage._id.toString(),
                        content: null,
                        senderId: user._id,
                        type: 'system',
                        systemType: 'USER_REMOVED',
                        createdAt: systemMessage.createdAt
                    },
                    lastMessageAt: systemMessage.createdAt
                }
            },
            { session }
        );

        await session.commitTransaction();

        // --- Socket: evict removed user from room ---
        const targetSocketIds = onlineUsers.get(participantId.toString());
        if (targetSocketIds?.size) {
            const sockets = await io.fetchSockets();
            for (const s of sockets) {
                if (targetSocketIds.has(s.id)) {
                    s.leave(conversationId);
                }
            }
        }

        // --- Socket: notify removed user (they no longer are in the room) ---
        if (targetSocketIds?.size) {
            for (const socketId of targetSocketIds) {
                io.to(socketId).emit("participant-removed", {
                    conversationId,
                    participantId,
                    removedBy: { _id: user._id, displayName: user.displayName },
                    systemMessage
                });
            }
        }

        // --- Socket: notify remaining members ---
        io.to(conversationId).emit("participant-removed", {
            conversationId,
            participantId,
            removedBy: { _id: user._id, displayName: user.displayName },
            systemMessage
        });

        return res.status(200).json({ message: "Participant removed successfully.", conversation: updatedConv });
    } catch (error) {
        await session.abortTransaction();
        console.error("Error when calling deleteParticipant: " + error);
        return res.status(500).json({ message: "Internal server error" });
    } finally {
        session.endSession();
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

        const callerParticipant = conversation.participants.find(
            p => p.userId.toString() === user._id.toString() && p.status === 'ACTIVE'
        );

        if (!callerParticipant || callerParticipant.role !== 'ADMIN') {
            return res.status(403).json({ message: "You are not allowed to do this!" });
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
                        [`participantNameNormsById.${paritcipant._id.toString()}`]: paritcipant.searchName
                    },
                    $push: {
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
                        seenBy: { userId: participantId, lastSeenAt: new Date(), messageId: conversation.lastMessage?._id.toString() },
                    },
                    $set: {
                        [`participantNameNormsById.${paritcipant._id.toString()}`]: paritcipant.searchName,
                        [`unreadCounts.${paritcipant._id.toString()}`]: 0
                    }
                }
            )
        }

        const systemMessage = await Message.create({
            conversationId,
            senderId: user._id,
            type: 'system',
            systemType: 'USER_ADDED',
            meta: { actorId: user._id, targetUserId: paritcipant._id }
        });

        await Conversation.updateOne(
            { _id: conversationId },
            {
                $set: {
                    lastMessage: {
                        _id: systemMessage._id.toString(),
                        content: null,
                        senderId: user._id,
                        type: 'system',
                        systemType: 'USER_ADDED',
                        createdAt: systemMessage.createdAt
                    },
                    lastMessageAt: systemMessage.createdAt
                }
            }
        );

        const updatedConv = await Conversation.findById(conversationId).lean();

        const participantSocketIds = onlineUsers.get(participantId?.toString());
        if (participantSocketIds?.size) {
            // Join only sockets belonging to the added user
            const sockets = await io.fetchSockets();
            for (const s of sockets) {
                if (participantSocketIds.has(s.id)) {
                    s.join(conversationId);
                }
            }
        }

        io.to(conversationId).emit("participant-added", {
            conversationId,
            participant: {
                _id: participantId,
                role: 'MEMBER',
                status: 'ACTIVE',
                addedBy: user._id.toString(),
                joinedAt: new Date()
            },
            addedBy: { _id: user._id, displayName: user.displayName },
            userInfo: {
                _id: paritcipant._id,
                displayName: paritcipant.displayName,
                avtUrl: paritcipant.avtUrl,
                email: paritcipant.email
            },
            systemMessage
        });

        return res.status(200).json({ messages: "Add participant success!", conversation: updatedConv })
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
                            "participants.$.leftAt": null,
                            [`participantNameNormsById.${participant?._id?.toString()}`]: participant.searchName,
                            [`unreadCounts.${participant?._id?.toString()}`]: 0
                        },
                        $push: {
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
                            seenBy: toInsert.map(participant => ({ userId: participant._id.toString(), lastSeenAt: new Date(), messageId: conversation.lastMessage?._id.toString() }))
                        },
                        $set: toInsert.reduce((acc, participant) => {
                            acc[`participantNameNormsById.${participant._id.toString()}`] = participant.searchName;
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

export const updateParticipantRole = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { participantId, role } = req.body;
        const user = req.user;

        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
            return res.status(400).json({ message: "Invalid conversationId!" });
        }

        if (!participantId || !mongoose.Types.ObjectId.isValid(participantId)) {
            return res.status(400).json({ message: "Invalid participantId!" });
        }

        if (role !== 'ADMIN' && role !== 'MEMBER') {
            return res.status(400).json({ message: "Invalid role!" });
        }

        const conversation = await Conversation.findById(conversationId).lean();
        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found!" });
        }

        if (conversation.type !== "group") {
            return res.status(400).json({ message: "Conversation is not a group!" });
        }

        const isAdmin = conversation.participants.findIndex(
            p => p.userId.toString() === user._id.toString() && p.role === 'ADMIN' && p.status === 'ACTIVE'
        );
        if (isAdmin === -1) {
            return res.status(403).json({ message: "You are not allowed to do this!" });
        }

        const target = conversation.participants.find(p => p.userId.toString() === participantId.toString());
        if (!target || target.status !== 'ACTIVE') {
            return res.status(400).json({ message: "Target participant not found or not active!" });
        }

        await Conversation.updateOne(
            { _id: conversationId, "participants.userId": participantId },
            { $set: { "participants.$.role": role } }
        );

        const targetUser = await User.findById(participantId).lean();

        const roleSystemType = role === 'ADMIN' ? 'ADMIN_PROMOTED' : 'ADMIN_REMOVED';
        const systemMessage = await Message.create({
            conversationId,
            senderId: user._id,
            type: 'system',
            systemType: roleSystemType,
            meta: { actorId: user._id, targetUserId: targetUser?._id }
        });

        await Conversation.updateOne(
            { _id: conversationId },
            {
                $set: {
                    lastMessage: {
                        _id: systemMessage._id.toString(),
                        content: null,
                        senderId: user._id,
                        type: 'system',
                        systemType: roleSystemType,
                        createdAt: systemMessage.createdAt
                    },
                    lastMessageAt: systemMessage.createdAt
                }
            }
        );

        io.to(conversationId).emit("participant-role-updated", {
            conversationId,
            participantId,
            newRole: role,
            updatedBy: { _id: user._id, displayName: user.displayName },
            systemMessage
        });

        return res.status(200).json({ messages: "Update participant role success!" });
    } catch (error) {
        console.error("Error when calling updateParticipantRole: " + error);
        return res.status(500).send();
    }
}

export const leaveConversation = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { conversationId } = req.params;
        const user = req.user;
        const userId = user._id;

        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
            return res.status(400).json({ message: "Invalid conversationId!" });
        }

        const conversation = await Conversation.findById(conversationId).session(session).lean();

        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found!" });
        }

        if (conversation.type !== "group") {
            return res.status(400).json({ message: "Only group conversations can be left." });
        }

        const participant = conversation.participants.find(
            p => p.userId.toString() === userId.toString()
        );

        if (!participant || participant.status !== 'ACTIVE') {
            return res.status(400).json({ message: "You are not an active member of this conversation." });
        }

        // Prevent the last admin from leaving without transferring ownership
        const activeAdmins = conversation.participants.filter(
            p => p.role === 'ADMIN' && p.status === 'ACTIVE'
        );
        const activeMembers = conversation.participants.filter(p => p.status === 'ACTIVE');

        if (
            participant.role === 'ADMIN' &&
            activeAdmins.length === 1 &&
            activeMembers.length > 1
        ) {
            return res.status(400).json({
                message: "You are the only admin. Transfer admin rights before leaving."
            });
        }

        const now = new Date();

        await Conversation.findOneAndUpdate(
            { _id: conversationId, "participants.userId": userId },
            {
                $set: {
                    "participants.$.status": "LEFT",
                    "participants.$.leftAt": now,
                },
                $unset: {
                    [`unreadCounts.${userId.toString()}`]: "",
                    [`participantNameNormsById.${userId.toString()}`]: ""
                },
                $pull: {
                    seenBy: { userId },
                }
            },
            { session }
        );

        const systemMessage = await Message.create([{
            conversationId,
            senderId: userId,
            type: 'system',
            systemType: 'USER_LEFT',
            meta: { actorId: userId },
            createdAt: now
        }], { session });

        await Conversation.updateOne(
            { _id: conversationId },
            {
                $set: {
                    lastMessage: {
                        _id: systemMessage[0]._id.toString(),
                        content: null,
                        senderId: userId,
                        type: 'system',
                        systemType: 'USER_LEFT',
                        createdAt: systemMessage[0].createdAt
                    },
                    lastMessageAt: systemMessage[0].createdAt
                }
            },
            { session }
        );

        await session.commitTransaction();

        // Remove user's sockets from the conversation room
        const userSocketIds = onlineUsers.get(userId.toString());
        if (userSocketIds?.size) {
            const sockets = await io.fetchSockets();
            for (const s of sockets) {
                if (userSocketIds.has(s.id)) {
                    s.leave(conversationId);
                }
            }
        }

        // Notify remaining members
        io.to(conversationId).emit("participant-left", {
            conversationId,
            participantId: userId,
            systemMessage: systemMessage[0]
        });

        return res.status(200).json({ message: "Left conversation successfully." });
    } catch (error) {
        await session.abortTransaction();
        console.error("Error when calling leaveConversation: " + error);
        return res.status(500).json({ message: "Internal server error" });
    } finally {
        session.endSession();
    }
}