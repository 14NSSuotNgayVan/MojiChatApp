import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protectedRoute = async (req, res, next) => {
    try {
        const header = req.headers?.["authorization"];
        const token = header?.split(" ")?.[1];

        if (!token) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.ASSET_TOKEN_SECRET);
        } catch (error) {
            return res
                .status(401)
                .json({ message: "Invalid access token or expired!" });
        }

        const user = await User.findById(decoded.id).select("-hashPassword");
        if (!user) {
            return res.status(401).json({ message: "User not found!" });
        }

        req.user = user.toObject();
        return next();
    } catch (error) {
        console.error("Error when calling protectedRoute: " + error);
        return res.status(500).send();
    }
}