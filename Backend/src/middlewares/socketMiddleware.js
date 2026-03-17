import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const socketAuthMiddleware = async (socket, next) => {
    try {
        const token = socket.handshake.auth?.token;
        if (!token) {
            return next(new Error("NO_TOKEN"));
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.ASSET_TOKEN_SECRET);
        } catch (error) {
            return next(new Error("AUTH_ERROR"));
        }

        const user = await User.findById(decoded.id).select("-hashPassword");

        if (!user) {
            return next(new Error("AUTH_ERROR"));
        }

        socket.user = user;
        return next();
    } catch (error) {
        console.error("Error when calling socketAuthMiddleware: " + error);
        return next(new Error("AUTH_ERROR"));
    }
}