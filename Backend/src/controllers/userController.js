import User from "../models/User.js";
import Friend from "../models/Friend.js"
import mongoose from "mongoose";
import FriendRequest from "../models/FriendRequest.js";

export const getProfileHandler = (req, res) => {
    try {
        const { hashPassword, ...userData } = req.user;
        return res.status(200).json(userData);
    } catch (error) {
        console.error("Error when calling getProfileHandler: " + error);
        return res.status(500).send();
    }
}

export const findUserHandler = async (req, res) => {
    try {
        const { keyword } = req.query;
        if (!keyword) return res.status(200).json({
            message: "Fetch users success",
            data: []
        });
        const safeKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const users = await User.find({
            $or: [
                {
                    displayName: { $regex: "^" + safeKeyword, $options: "i" }
                },
                {
                    email: { $regex: "^" + safeKeyword, $options: "i" }
                },
                { phone: { $regex: "^" + safeKeyword, $options: "i" } }
            ]
        }, { __v: 0, bio: 0, avtId: 0, createdAt: 0, hashPassword: 0, updatedAt: 0 }).lean();

        return res.status(200).json({
            message: "Fetch users success",
            data: users || []
        });
    } catch (error) {
        console.error("Error when calling findFriend: " + error);
        return res.status(500).send();

    }
}

export const getUser = async (req, res) => {
    try {
        const me = req.user;

        const userId = req.params.userId;

        if (!userId) return res.status(400).json({ message: "userId is required!" })

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid userId format!" });
        }

        const user = await User.findById(userId, { __v: 0, avtId: 0, hashPassword: 0, updatedAt: 0 }).lean();
        const isFriend = await Friend.findOne({
            $or: [{
                user: me._id,
                friend: user._id
            }, {
                user: user._id,
                friend: me._id
            }]
        })

        const receivedRequest = await FriendRequest.findOne({
            toUser: me._id,
            fromUser: user._id
        }).lean()

        const sentRequest = await FriendRequest.findOne({
            fromUser: me._id,
            toUser: user._id
        }).lean()

        return res.status(200).json({
            message: "get user success!",
            profile: { user, isFriend: !!isFriend, receivedRequest: receivedRequest?._id, sentRequest: sentRequest?._id }
        })
    } catch (error) {
        console.error("Error when calling getUser: " + error);
        return res.status(500).send();

    }
}