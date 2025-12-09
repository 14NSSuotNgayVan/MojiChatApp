import Conversation from "../models/Conversation.js";

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
                if (!name) {
                    return res.status(400).json({ message: "Conversation name must not be empty!" })
                }

                conversation = await Conversation.create({
                    type,
                    participants: [{ userId }, ...memberIds?.map(i => ({ userId: i }))],
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
        ])
        return res.status(200).json({ message: "Get conversation success!", conversations })
    } catch (error) {

    }
}

export const getMessages = async (req, res) => {
    try {

    } catch (error) {

    }
}