import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Session from "../models/Session.js";
import crypto from "crypto";
import { getNormalizeString } from "../utils/Utils.js";
import { OAuth2Client } from "google-auth-library";

const ACCESS_TOKEN_TTL = "30m";
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000; //14 ngày
const OAUTH_STATE_TTL = 10 * 60 * 1000;

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;
const FACEBOOK_REDIRECT_URI = process.env.FACEBOOK_REDIRECT_URI;

const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

const isValidEmail = (email) => {
    if (typeof email !== "string") return false;
    const trimmed = email.trim();
    if (!trimmed) return false;
    // simple RFC5322-like regex, good enough for basic validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(trimmed);
};

const isStrongPassword = (password) => {
    if (typeof password !== "string") return false;
    if (password.length < 8) return false;
    // at least one letter and one number
    const hasLetter = /[A-Za-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    return hasLetter && hasNumber;
};

const makeOauthState = (provider) =>
    Buffer.from(
        JSON.stringify({
            nonce: crypto.randomBytes(16).toString("hex"),
            provider,
            ts: Date.now(),
        })
    ).toString("base64url");

const setOauthStateCookie = (res, provider, state) => {
    res.cookie("oauthState", state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: OAUTH_STATE_TTL,
    });
    res.cookie("oauthProvider", provider, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: OAUTH_STATE_TTL,
    });
};

const validateOauthState = (req, provider) => {
    const queryState = req.query?.state;
    const cookieState = req.cookies?.oauthState;
    const cookieProvider = req.cookies?.oauthProvider;
    if (!queryState || !cookieState || queryState !== cookieState || cookieProvider !== provider) {
        return false;
    }
    return true;
};

const clearOauthStateCookies = (res) => {
    res.clearCookie("oauthState");
    res.clearCookie("oauthProvider");
};

const buildAccessToken = (user) =>
    jwt.sign(
        { id: user._id, username: user.username },
        process.env.ASSET_TOKEN_SECRET,
        { expiresIn: ACCESS_TOKEN_TTL }
    );

const createSessionAndSetCookie = async (res, userId) => {
    const refreshToken = crypto.randomBytes(64).toString("hex");
    await Session.create({
        userId,
        refreshToken,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
    });

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: REFRESH_TOKEN_TTL,
    });
};

const sanitizeUser = (user) => {
    const { __v, hashPassword, ...userData } = user.toObject();
    return userData;
};

const createUniqueUsername = async (base) => {
    const normalized = (base || "user").toLowerCase().replace(/[^a-z0-9._]/g, "").slice(0, 20) || "user";
    let candidate = normalized;
    let i = 0;

    while (await User.exists({ username: candidate })) {
        i += 1;
        candidate = `${normalized}${i}`;
    }
    return candidate;
};

const resolveAuthType = (user) => {
    if (user.hashPassword && (user.oauthProviders?.googleId || user.oauthProviders?.facebookId)) return "hybrid";
    if (user.hashPassword) return "local";
    return "oauth";
};

const upsertOAuthUser = async ({ provider, providerId, email, displayName, avatarUrl }) => {
    const providerField = provider === "google" ? "oauthProviders.googleId" : "oauthProviders.facebookId";
    let user = await User.findOne({ [providerField]: providerId });

    if (!user && email) {
        user = await User.findOne({ email: email.toLowerCase().trim() });
    }

    if (user) {
        user.set(providerField, providerId);
        if (!user.displayName && displayName) {
            user.displayName = displayName;
            user.searchName = getNormalizeString(displayName);
        }
        if (!user.avtUrl && avatarUrl) {
            user.avtUrl = avatarUrl;
        }
        user.authType = resolveAuthType(user);
        await user.save();
        return user;
    }

    const finalDisplayName = displayName || "OAuth User";
    const username = await createUniqueUsername(email?.split("@")[0] || finalDisplayName.replace(/\s+/g, "").toLowerCase());

    return await User.create({
        username,
        email: (email || `${username}@oauth.local`).toLowerCase(),
        displayName: finalDisplayName,
        searchName: getNormalizeString(finalDisplayName),
        avtUrl: avatarUrl,
        oauthProviders: provider === "google" ? { googleId: providerId } : { facebookId: providerId },
        authType: "oauth",
    });
};

const completeOAuthSignIn = async (res, user) => {
    const accessToken = buildAccessToken(user);
    await createSessionAndSetCookie(res, user._id);
    return accessToken;
};

export const signUpHandler = async (req, res) => {
    try {
        const { username, email, password, displayName } = req.body;

        if (!username || !email || !password || !displayName) {
            return res
                .status(400)
                .json({ message: "Username, email, password, displayName are required!" });
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({ message: "Email is invalid!" });
        }

        if (!isStrongPassword(password)) {
            return res.status(400).json({
                message:
                    "Password must be at least 8 characters and contain both letters and numbers!",
            });
        }

        const duplicate = await User.findOne({ username });
        if (duplicate) {
            return res.status(409).json({ message: "Username already exits!" });
        }

        const hashPassword = await bcrypt.hash(password, 10);

        await User.create({
            username,
            email,
            displayName,
            hashPassword,
            searchName: getNormalizeString(displayName),
        })

        return res.status(201).json({ message: "User created successfully!" });
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
            return res
                .status(400)
                .json({ message: "Username and password are required!" });
        }

        //Kiểm tra username có tồn tại không
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: "Invalid username or password!" });
        }

        if (!user.hashPassword) {
            return res.status(400).json({ message: "Account uses social login. Please continue with Google/Facebook." });
        }

        //Kiểm tra password có đúng không
        const isMatch = await bcrypt.compare(password, user.hashPassword);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid username or password!" });
        }

        //Tạo token và trả về
        const accessToken = buildAccessToken(user);
        await createSessionAndSetCookie(res, user._id);
        const userData = sanitizeUser(user);
        return res
            .status(200)
            .json({ message: "Sign in successfully!", accessToken, user: userData });

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
            return res.status(400).json({ message: "No refresh token in cookie" });
        }
        //xóa refresh token trong db
        const deleted = await Session.findOneAndDelete({ refreshToken });

        if (!deleted) {
            return res.status(400).json({ message: "Invalid refresh token" });
        }
        // xóa refresh token trong cookie
        res.clearCookie("refreshToken");
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
            return res.status(400).json({ message: "No refresh token in cookie" });
        }

        const session = await Session.findOne({ refreshToken });
        if (!session || session.expiresAt < new Date()) {
            return res.status(400).json({ message: "Invalid refresh token!" });
        }

        const user = await User.findById(session.userId);
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }

        const accessToken = buildAccessToken(user);

        return res
            .status(200)
            .json({ message: "Token refreshed successfuly!", accessToken });
    } catch (error) {
        console.error("Error when calling refreshToken: " + error);
        return res.status(500).send();
    }
}

export const googleOAuthStartHandler = async (_req, res) => {
    try {
        if (!GOOGLE_CLIENT_ID || !GOOGLE_REDIRECT_URI) {
            return res.status(500).json({ message: "Google OAuth is not configured!" });
        }

        const state = makeOauthState("google");
        setOauthStateCookie(res, "google", state);
        const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
        url.searchParams.set("client_id", GOOGLE_CLIENT_ID);
        url.searchParams.set("redirect_uri", GOOGLE_REDIRECT_URI);
        url.searchParams.set("response_type", "code");
        url.searchParams.set("scope", "openid email profile");
        url.searchParams.set("state", state);
        url.searchParams.set("prompt", "select_account");

        return res.redirect(url.toString());
    } catch (error) {
        console.error("Error when calling googleOAuthStartHandler: " + error);
        return res.status(500).send();
    }
};

export const googleOAuthCallbackHandler = async (req, res) => {
    try {
        if (!validateOauthState(req, "google")) {
            clearOauthStateCookies(res);
            return res.redirect(`${FRONTEND_URL}/signin?oauth=error&provider=google&reason=invalid_state`);
        }
        clearOauthStateCookies(res);

        const { code } = req.query;
        if (!code || !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI || !googleClient) {
            return res.redirect(`${FRONTEND_URL}/signin?oauth=error&provider=google&reason=bad_request`);
        }

        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                code: String(code),
                client_id: GOOGLE_CLIENT_ID,
                client_secret: GOOGLE_CLIENT_SECRET,
                redirect_uri: GOOGLE_REDIRECT_URI,
                grant_type: "authorization_code",
            }),
        });

        if (!tokenRes.ok) {
            return res.redirect(`${FRONTEND_URL}/signin?oauth=error&provider=google&reason=token_exchange_failed`);
        }

        const tokenData = await tokenRes.json();
        const idToken = tokenData?.id_token;
        if (!idToken) {
            return res.redirect(`${FRONTEND_URL}/signin?oauth=error&provider=google&reason=missing_id_token`);
        }

        const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload?.sub) {
            return res.redirect(`${FRONTEND_URL}/signin?oauth=error&provider=google&reason=invalid_payload`);
        }

        const user = await upsertOAuthUser({
            provider: "google",
            providerId: payload.sub,
            email: payload.email,
            displayName: payload.name,
            avatarUrl: payload.picture,
        });

        const accessToken = await completeOAuthSignIn(res, user);
        return res.redirect(
            `${FRONTEND_URL}/signin?oauth=success&provider=google&accessToken=${encodeURIComponent(accessToken)}`
        );
    } catch (error) {
        console.error("Error when calling googleOAuthCallbackHandler: " + error);
        return res.redirect(`${FRONTEND_URL}/signin?oauth=error&provider=google&reason=internal_error`);
    }
};

export const facebookOAuthStartHandler = async (_req, res) => {
    try {
        if (!FACEBOOK_APP_ID || !FACEBOOK_REDIRECT_URI) {
            return res.status(500).json({ message: "Facebook OAuth is not configured!" });
        }

        const state = makeOauthState("facebook");
        setOauthStateCookie(res, "facebook", state);
        const url = new URL("https://www.facebook.com/v20.0/dialog/oauth");
        url.searchParams.set("client_id", FACEBOOK_APP_ID);
        url.searchParams.set("redirect_uri", FACEBOOK_REDIRECT_URI);
        url.searchParams.set("state", state);
        url.searchParams.set("scope", "email,public_profile");
        url.searchParams.set("response_type", "code");

        return res.redirect(url.toString());
    } catch (error) {
        console.error("Error when calling facebookOAuthStartHandler: " + error);
        return res.status(500).send();
    }
};

export const facebookOAuthCallbackHandler = async (req, res) => {
    try {
        if (!validateOauthState(req, "facebook")) {
            clearOauthStateCookies(res);
            return res.redirect(`${FRONTEND_URL}/signin?oauth=error&provider=facebook&reason=invalid_state`);
        }
        clearOauthStateCookies(res);

        const { code } = req.query;
        if (!code || !FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET || !FACEBOOK_REDIRECT_URI) {
            return res.redirect(`${FRONTEND_URL}/signin?oauth=error&provider=facebook&reason=bad_request`);
        }

        const tokenUrl = new URL("https://graph.facebook.com/v20.0/oauth/access_token");
        tokenUrl.searchParams.set("client_id", FACEBOOK_APP_ID);
        tokenUrl.searchParams.set("client_secret", FACEBOOK_APP_SECRET);
        tokenUrl.searchParams.set("redirect_uri", FACEBOOK_REDIRECT_URI);
        tokenUrl.searchParams.set("code", String(code));

        const tokenRes = await fetch(tokenUrl.toString());
        if (!tokenRes.ok) {
            return res.redirect(`${FRONTEND_URL}/signin?oauth=error&provider=facebook&reason=token_exchange_failed`);
        }
        const tokenData = await tokenRes.json();
        const fbAccessToken = tokenData?.access_token;
        if (!fbAccessToken) {
            return res.redirect(`${FRONTEND_URL}/signin?oauth=error&provider=facebook&reason=missing_access_token`);
        }

        const profileUrl = new URL("https://graph.facebook.com/me");
        profileUrl.searchParams.set("fields", "id,name,email,picture.type(large)");
        profileUrl.searchParams.set("access_token", fbAccessToken);
        const profileRes = await fetch(profileUrl.toString());
        if (!profileRes.ok) {
            return res.redirect(`${FRONTEND_URL}/signin?oauth=error&provider=facebook&reason=profile_fetch_failed`);
        }
        const profile = await profileRes.json();
        if (!profile?.id) {
            return res.redirect(`${FRONTEND_URL}/signin?oauth=error&provider=facebook&reason=invalid_payload`);
        }

        const user = await upsertOAuthUser({
            provider: "facebook",
            providerId: profile.id,
            email: profile.email,
            displayName: profile.name,
            avatarUrl: profile?.picture?.data?.url,
        });

        const accessToken = await completeOAuthSignIn(res, user);
        return res.redirect(
            `${FRONTEND_URL}/signin?oauth=success&provider=facebook&accessToken=${encodeURIComponent(accessToken)}`
        );
    } catch (error) {
        console.error("Error when calling facebookOAuthCallbackHandler: " + error);
        return res.redirect(`${FRONTEND_URL}/signin?oauth=error&provider=facebook&reason=internal_error`);
    }
};