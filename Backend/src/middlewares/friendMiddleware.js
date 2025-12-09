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