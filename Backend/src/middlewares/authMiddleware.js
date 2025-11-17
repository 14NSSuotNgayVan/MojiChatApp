import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protectedRoute = async (req, res, next) => {
    try {
        const header = req.headers?.['authorization'];
        const token = header?.split(' ')?.[1];
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' })
        }
        jwt.verify(token, process.env.ASSET_TOKEN_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(401).json({ message: 'Invalid access token or expired!' })
            }
            const user = await User.findById(decoded.id).select('-hashPassword');
            req.user = user;
            next();
        });
    } catch (error) {
        console.error("Error when calling getProfileHandler: " + error);
        return res.status(500).send();
    }
}