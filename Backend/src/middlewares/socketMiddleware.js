import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const socketAuthMiddleware = async (socket, next) => {
    try {
        const token = socket.handshake.auth?.token;
        if (!token) {
            return next(new Error("Unauthoried - token not found!"))
        }

        jwt.verify(token, process.env.ASSET_TOKEN_SECRET, async (err, decoded) => {
            if (err) {
                return next(new Error("Invalid access token or expired!"))
            }
            const user = await User.findById(decoded.id).select('-hashPassword');

            if (!user) return next(new Error("User not found!"));
            socket.user = user;
            next();
        });

    } catch (error) {
        console.error("Error when calling socketAuthMiddleware: " + error);
    }
}