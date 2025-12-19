import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";

export const createConversation = async (req, res) => {
    try {
        const { type, name, memberIds } = req.body;
        const userId = req.user._id;

        if (!type) {
            return res.status(400).json({ message: "Conversation type must not be empty!" })
        }

        if (!memberIds?.length) {
            return res.status(400).json({ message: "Conversation memberIds must not be empty!" })
        }
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
                    lastMessageAt: new Date(),
                    group: {
                        name,
                        createdBy: userId
                    }
                })

                break;
            }

            case "direct": {
                const participantId = memberIds[0];

                conversation = await Conversation.findOne({
                    type: "direct",
                    "participants.userId": { $all: [userId, participantId] }
                })

                if (!conversation) {
                    conversation = await Conversation.create({
                        type,
                        participants: [{ userId }, { userId: participantId }],
                        lastMessageAt: new Date()
                    })
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
                path: 'participants.userId', select: 'displayName avtUrl'
            },
            {
                path: 'seenBy', select: "displayName avtUrl"
            },
            {
                path: 'lastMessage.senderId', select: "displayName avtUrl"
            },

        ])

        return res.status(201).json({ conversation });

    } catch (error) {
        console.error("Error when calling createConversation: " + error);
        return res.status(500).send();
    }
}

export const getConversations = async (req, res) => {
    try {
        const userId = req.user._id;

        const conversations = await Conversation.find({
            "participants.userId": userId
        }).sort({
            lastMessageAt: -1, updateAt: -1
        }).populate([
            {
                path: 'participants.userId', select: 'displayName avtUrl',
                options: { lean: true }
            },
            {
                path: 'seenBy', select: "displayName avtUrl",
                options: { lean: true }
            },
            {
                path: 'lastMessage.senderId', select: "displayName avtUrl",
                options: { lean: true }
            },
        ]).lean()

        const formattedConversation = conversations.map(conv => ({
            ...conv,
            participants: conv.participants?.map(p => ({
                _id: p.userId?._id || p.userId,
                displayName: p?.userId?.displayName,
                avtUrl: p?.userId?.avtUrl,
                joinedAt: p.joinedAt
            })).sort((a, b) => {
                if (a._id.toString() === userId.toString()) return 1
                if (b._id.toString() === userId.toString()) return -1
                return 0
            }),
            lastMessage: conv.lastMessage ? {
                ...conv.lastMessage,
                senderId: conv.lastMessage.senderId._id,
                senderName: conv.lastMessage.senderId.displayName
            } : null,
        }))
        return res.status(200).json({ message: "Get conversation success!", conversations: formattedConversation })
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