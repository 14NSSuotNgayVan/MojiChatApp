import User from "../models/User.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Session from "../models/Session.js";
import crypto from 'crypto';

const ASSET_TOKEN_TTL = '1m';
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000; //14 ngày

export const signUpHandler = async (req, res) => {
    try {
        const { username, email, password, displayName } = req.body;

        if (!username || !email || !password || !displayName) {
            return res.status(400).json({ message: 'Username, email, password, displayName are required!' })
        }

        const duplicate = await User.findOne({ username });
        if (duplicate) {
            res.status(409).json({ message: 'Username already exits!' })
        }

        const hashPassword = await bcrypt.hash(password, 10);

        await User.create({
            username, email, displayName, hashPassword
        })

        return res.status(201).json({ message: 'User created successfully!' })
    } catch (error) {
        console.error("Error when calling signup: " + error);
        return res.status(500).send();
    }
}

export const signInhandler = async (req, res) => {
    try {
        const { username, password } = req.body;

        //Kiểm tra dữ liệu đầu vào
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required!' })
        }

        //Kiểm tra username có tồn tại không
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: 'Invalid username or password!' });
        }

        //Kiểm tra password có đúng không
        const isMatch = await bcrypt.compare(password, user.hashPassword);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid username or password!' });
        }

        //Tạo token và trả về
        const accessToken = jwt.sign({ id: user._id, username: user.username }, process.env.ASSET_TOKEN_SECRET, { expiresIn: ASSET_TOKEN_TTL });

        //Tạo refresh token 
        const refreshToken = crypto.randomBytes(64).toString('hex');

        //lưu refresh token vào db
        await Session.create({
            userId: user._id,
            refreshToken,
            expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL)
        })

        //Trả refresh token vào cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,//khong truy cap tu js
            secure: true,//chi truyen qua https
            sameSite: 'none',
            maxAge: REFRESH_TOKEN_TTL
        });
        const { __v, hashPassword, ...userData } = user.toObject();
        return res.status(200).json({ message: 'Sign in successfully!', accessToken, user: userData });

    } catch (error) {
        console.error("Error when calling signin: " + error);
        return res.status(500).send();
    }
}

export const signOutHandler = async (req, res) => {
    try {
        //lấy refresh token từ cookie
        const { refreshToken } = req.cookies;
        if (!refreshToken) {
            return res.status(400).json({ message: 'No refresh token in cookie' });
        }
        //xóa refresh token trong db
        const deleted = await Session.findOneAndDelete({ refreshToken });

        if (!deleted) {
            return res.status(400).json({ message: 'Invalid refresh token' });
        }
        // xóa refresh token trong cookie
        res.clearCookie('refreshToken');
        return res.status(204).send();
    } catch (error) {
        console.error("Error when calling signOut: " + error);
        return res.status(500).send();
    }
}

export const refreshTokenHander = async (req, res) => {
    try {
        const { refreshToken } = req.cookies;
        if (!refreshToken) {
            return res.status(400).json({ message: 'No refresh token in cookie' })
        }

        const session = await Session.findOne({ refreshToken });
        if (!session || session.expiresAt < new Date()) {
            return res.status(400).json({ message: 'Invalid refresh token!' })
        }

        const user = await User.findById(session.userId);
        if (!user) {
            return res.status(400).json({ message: 'User not found!' })
        }

        const accessToken = jwt.sign({ id: user._id, username: user.username }, process.env.ASSET_TOKEN_SECRET, { expiresIn: ASSET_TOKEN_TTL });

        return res.status(200).json({ message: 'Token refreshed successfuly!', accessToken })
    } catch (error) {
        console.error("Error when calling refreshToken: " + error);
        return res.status(500).send();
    }
}