import User from "../models/User.js";

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