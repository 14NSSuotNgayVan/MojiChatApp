import mongoose from "mongoose";
import Friend from "../models/Friend.js";
import FriendRequest from "../models/FriendRequest.js";
import User from "../models/User.js";

export const addFriendHandler = async (req, res) => {
    try {
        const { toUserId } = req.body;
        const from = req.user._id;

        if (!toUserId) {
            return res.status(404).json({ message: "'toUserId' is required!" })
        }

        const toUser = await User.findById(toUserId);

        if (!toUser) {
            return res.status(404).json({ message: "User not exits!" })
        }

        let userA = from.toString();
        let userB = toUser._id.toString();

        if (userA === userB) {
            return res.status(400).json({ message: "Can not send request to yourself!" })
        }

        if (userA > userB) {
            [userA, userB] = [userB, userA]
        }

        const [isFriendExists, isFriendRequestExists] = await Promise.all([
            Friend.findOne({ user: userA, friend: userB }),
            FriendRequest.findOne({
                $or: [
                    { fromUser: userA, toUser: userB },
                    { toUser: userA, fromUser: userB },

                ]
            })
        ]);

        if (isFriendExists) {
            return res.status(404).json({ message: "You are already friends!" })
        }

        if (isFriendRequestExists) {
            return res.status(404).json({ message: "The friend request already exists!" })
        }

        await FriendRequest.create({
            fromUser: from.toString(),
            toUser: toUser._id.toString()
        })
        return res.status(200).json({ message: "Request sent successfully!" })

    } catch (error) {
        console.error("Error when calling addFriend: " + error);
        return res.status(500).send();
    }
}

export const acceptFriendRequestHandler = async (req, res) => {
    try {
        const { requestId } = req.params;
        const userId = req.user._id.toString();

        if (!mongoose.Types.ObjectId.isValid(requestId)) {
            return res.status(400).json({ message: "Invalid requestId format!" });
        }

        const request = await FriendRequest.findById(requestId);

        if (!request) {
            return res.status(404).json({ message: "The friend request do not exists!" })
        }

        if (request.fromUser.toString() === userId.toString()) {
            return res.status(403).json({ message: "You are requester!" })
        }

        await FriendRequest.deleteOne({ _id: requestId });

        await Friend.create({
            user: request.fromUser.toString(),
            friend: request.toUser.toString()
        })

        return res.status(200).json({ message: "Request accepted successfully!" })

    } catch (error) {
        console.error("Error when calling acceptFriendRequest: " + error);
        return res.status(500).send();
    }
}

export const deleteFriendRequestHandler = async (req, res) => {
    try {
        const { requestId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(requestId)) {
        }

        const request = await FriendRequest.findOne({ _id: requestId });

        if (!request) {
            return res.status(404).json({ message: "The friend request do not exists!" })
        }

        await FriendRequest.deleteOne({ _id: requestId });

        return res.status(200).json({ message: "Request declined successfully!" })
    } catch (error) {
        console.error("Error when calling deleteFriendRequestHandler: " + error);
        return res.status(500).send();
    }
}

export const getFriendsHandler = async (req, res) => {
    try {
        const userId = req.user._id;
        const { keyword } = req.query;

        const safeKeyword = keyword?.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") || '';

        const friendShips = await Friend.find({
            $or: [
                {
                    user: userId
                },
                {
                    friend: userId
                }
            ]
        }).lean();

        const friendIds = friendShips?.map((item) =>
            (item?.user._id.toString() === userId.toString() ? item.friend._id : item.user._id)) || [];

        const users = await User.find(
            {
                _id: {
                    $in: friendIds
                },
                $or: [
                    {
                        searchName: { $regex: "^" + safeKeyword, $options: "i" },
                    },
                    {
                        displayName: { $regex: "^" + safeKeyword, $options: "i" },
                    },
                    {
                        email: { $regex: "^" + safeKeyword, $options: "i" },
                    },
                    { phone: { $regex: "^" + safeKeyword, $options: "i" } },
                ],
            },
            { __v: 0, bio: 0, avtId: 0, createdAt: 0, hashPassword: 0, updatedAt: 0 }
        ).lean();

        return res.status(200).json({
            message: "Get friend list successfully!",
            friends: users
        })

    } catch (error) {
        console.error("Error when calling getFriends: " + error);
        return res.status(500).send();
    }
}

export const getFriendRequestsHandler = async (req, res) => {
    try {
        const userId = req.user._id;

        const received = await FriendRequest.find({
            toUser: userId
        }, {
            toUser: 0, __v: 0
        })
            .populate("fromUser", "username displayName email avtUrl")
            .lean();

        const sent = await FriendRequest.find({
            fromUser: userId
        }, {
            fromUser: 0, __v: 0
        })
            .populate("toUser", "username displayName email avtUrl")
            .lean();


        return res.status(200).json({
            message: "Get friend requests list successfully!",
            received,
            sent
        })
    } catch (error) {
        console.error("Error when calling getFriendRequests: " + error);
        return res.status(500).send();
    }
}

export const unFriendsHandler = async (req, res) => {
    try {
        const { friendId } = req.params;
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(friendId)) {
            return res.status(400).json({ message: "Invalid friendId format!" });
        }

        let userA = userId.toString();
        let userB = friendId;

        if (userA > userB) {
            [userA, userB] = [userB, userA]
        }

        const friendShips = await Friend.findOneAndDelete({
            user: userA,
            friend: userB
        });

        if (!friendShips) {
            return res.status(400).json({ message: "You are not friends!" });
        }

        return res.status(200).json({
            message: "Unfriends successfully!",
        })

    } catch (error) {
        console.error("Error when calling getFriends: " + error);
        return res.status(500).send();
    }
}