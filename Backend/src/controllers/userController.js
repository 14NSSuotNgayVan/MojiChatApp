import User from "../models/User.js";
import Friend from "../models/Friend.js";
import mongoose from "mongoose";
import FriendRequest from "../models/FriendRequest.js";
import { IMAGE_PRESETS } from "../utils/uploadFileHelper.js";
import { getConversationIds } from "./conversationController.js";
import { io } from "../socket/index.js";

export const getProfileHandler = (req, res) => {
  try {
    const { hashPassword, ...userData } = req.user;
    return res.status(200).json(userData);
  } catch (error) {
    console.error("Error when calling getProfileHandler: " + error);
    return res.status(500).send();
  }
};

export const findUserHandler = async (req, res) => {
  try {
    const { keyword } = req.query;
    if (!keyword)
      return res.status(200).json({
        message: "Fetch users success",
        data: [],
      });
    const safeKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const users = await User.find(
      {
        $or: [
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
      message: "Fetch users success",
      data: users || [],
    });
  } catch (error) {
    console.error("Error when calling findFriend: " + error);
    return res.status(500).send();
  }
};

export const getUser = async (req, res) => {
  try {
    const me = req.user;

    const userId = req.params.userId;

    if (!userId)
      return res.status(400).json({ message: "userId is required!" });

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId format!" });
    }

    const user = await User.findById(userId, {
      __v: 0,
      avtId: 0,
      hashPassword: 0,
      updatedAt: 0,
    }).lean();
    const isFriend = await Friend.findOne({
      $or: [
        {
          user: me._id,
          friend: user._id,
        },
        {
          user: user._id,
          friend: me._id,
        },
      ],
    });

    const receivedRequest = await FriendRequest.findOne({
      toUser: me._id,
      fromUser: user._id,
    }).lean();

    const sentRequest = await FriendRequest.findOne({
      fromUser: me._id,
      toUser: user._id,
    }).lean();

    return res.status(200).json({
      message: "get user success!",
      profile: {
        user,
        isFriend: !!isFriend,
        receivedRequest: receivedRequest?._id,
        sentRequest: sentRequest?._id,
      },
    });
  } catch (error) {
    console.error("Error when calling getUser: " + error);
    return res.status(500).send();
  }
};

export const updateProfile = async (req, res) => {
  try {
    const me = req.user;

    const { displayName, email, phone, bio, avtUrl, avtId, bgUrl, bgId } =
      req.body;

    console.log("update profile payload:", {
      displayName,
      email,
      phone,
      bio,
      avtUrl,
      avtId,
      bgUrl,
      bgId,
    });

    await User.updateOne(
      { _id: me._id },
      {
        displayName,
        email,
        phone,
        bio,
        avtUrl: avtId ? buildImageUrl(avtId, IMAGE_PRESETS.avatar) : avtUrl,
        avtId,
        bgUrl: bgId ? buildImageUrl(bgId, IMAGE_PRESETS.bgUser) : bgUrl,
        bgId,
      }
    );

    const user = {
      ...me,
      displayName: displayName ?? me.displayName,
      email: email ?? me.email,
      phone: phone ?? me.phone,
      bio: bio ?? me.bio,
      avtUrl: avtUrl ?? me.avtUrl,
      avtId: avtId ?? me.avtId,
      bgUrl: bgUrl ?? me.bgUrl,
      bgId: bgId ?? me.bgId,
    };
    const userConversationIds = await getConversationIds(me._id);

    io.to(userConversationIds).emit("updated-user", user);

    return res.status(200).json({
      message: "update user success!",
      user,
    });
  } catch (error) {
    console.error("Error when calling updateProfile: " + error);
    return res.status(500).send();
  }
};


export const getNotFriendsHandler = async (req, res) => {
  try {
    const userId = req.user._id;
    const { keyword } = req.query;

    if (!keyword)
      return res.status(200).json({
        message: "Fetch users success",
        data: [],
      });
    const safeKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Get all friend IDs
    const friendships = await Friend.find({
      $or: [
        { user: userId },
        { friend: userId }
      ]
    }).lean();

    const friendIds = friendships.map((item) =>
      item.user._id.toString() === userId.toString() ? item.friend._id.toString() : item.user._id.toString()
    );

    // Get all pending friend request IDs
    const friendRequests = await FriendRequest.find({
      $or: [
        { fromUser: userId },
        { toUser: userId }
      ]
    }).lean();

    const requestUserIds = friendRequests.map((request) =>
      request.fromUser._id.toString() === userId.toString() ? request.toUser._id.toString() : request.fromUser._id.toString()
    );

    // Get all users except current user, friends, and users with pending requests
    const notFriends = await User.find({
      _id: {
        $nin: [userId, ...friendIds, ...requestUserIds]
      },
      $or: [
        {
          displayName: { $regex: "^" + safeKeyword, $options: "i" },
        },
        {
          email: { $regex: "^" + safeKeyword, $options: "i" },
        },
        { phone: { $regex: "^" + safeKeyword, $options: "i" } },
      ],
    }, "displayName email avtUrl phone").lean();

    return res.status(200).json({
      message: "Get not friends list successfully!",
      users: notFriends || []
    })
  } catch (error) {
    console.error("Error when calling getNotFriendsHandler: " + error);
    return res.status(500).send();
  }
}