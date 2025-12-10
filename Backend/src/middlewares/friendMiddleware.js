import Conversation from "../models/Conversation.js";
import Friend from "../models/Friend.js";

export const checkFriendShips = async (req, res, next) => {
    try {
        const me = req.user._id;
        const recipientId = req.body.recipientId;

        if (!recipientId) {
            return res.status(400).json({ message: "recipientId must not be empty!" })
        }

        let userA = me.toString();
        let userB = recipientId;

        // if (userA === userB) return next();

        if (userA > userB) {
            [userA, userB] = [userB, userA]
        }

        const friendShips = await Friend.findOne({
            user: userA,
            friend: userB
        });

        if (!friendShips) {
            return res.status(400).json({ message: "You are not friends!" });
        }
        return next();
    } catch (error) {
        console.error("Error when calling checkFriendShips: " + error);
        return res.status(500).send();
    }
}

export const checkGroupMembership = async (req, res, next) => {
    try {
        const { conversationId } = req.body;
        const senderId = req.user._id;

        if (!conversationId) {
            return res.status(400).json({ message: "conversationId must not be empty!" })
        }
        const conversation = await Conversation.findById(conversationId);

        if (!conversation) {
            return res.status(400).json({ message: "Conversation not found!" })
        }

        const isMembership = conversation.participants.some(p => p.userId.toString() === senderId.toString());

        if (!isMembership) {
            return res.status(403).json({ message: "You are not a member of this conversation!" })
        }

        req.conversation = conversation;
        return next();
    } catch (error) {
        console.error("Error when calling checkGroupMembership: " + error);
        return res.status(500).send();
    }
}