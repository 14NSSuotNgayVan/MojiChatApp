import cloudinary from "cloudinary";
import {
    generateSignature
} from "../utils/uploadFileHelper.js";
import crypto from "crypto";

cloudinary.v2.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
});

export const getAvatarSignature = async (req, res) => {
    try {
        const user = req.user;
        const folder = `${user._id.toString()}/avatar`;
        const sig = generateSignature(folder);

        res.json({
            cloudName: process.env.CLOUD_NAME,
            apiKey: process.env.CLOUD_API_KEY,
            folder,
            ...sig,
        });

    } catch (error) {
        console.error("Error when calling getAvatarSignature: " + error);
        return res.status(500).send();
    }
}

export const getBgSignature = async (req, res) => {
    try {
        const user = req.user;
        const folder = `${user._id.toString()}/bg`;
        const sig = generateSignature(folder);

        res.status(200).json({
            cloudName: process.env.CLOUD_NAME,
            apiKey: process.env.CLOUD_API_KEY,
            folder,
            ...sig,
        });

    } catch (error) {
        console.error("Error when calling getBgSignature: " + error);
        return res.status(500).send();
    }
}

export const getImageSignature = async (req, res) => {
    try {
        const user = req.user;
        const { conversationId } = req.query;
        const folder = `conv/${conversationId}/${user._id.toString()}/`;
        const sig = generateSignature(folder);

        res.status(200).json({
            cloudName: process.env.CLOUD_NAME,
            apiKey: process.env.CLOUD_API_KEY,
            folder,
            ...sig,
        });

    } catch (error) {
        console.error("Error when calling getImageSignature: " + error);
        return res.status(500).send();
    }
}

export const deleteFile = async (req, res) => {
    try {
        const user = req.user;
        const { publicId } = req.query;

        if (!publicId) return res.status(400).json({ message: "publicId must not be empty!" })

        const timestamp = Math.round(Date.now() / 1000);
        const signature = crypto
            .createHash("sha1")
            .update(
                `public_id=${publicId}&timestamp=${timestamp}${process.env.CLOUD_API_SECRET}`
            )
            .digest("hex");

        const body = new URLSearchParams({
            public_id: publicId,
            api_key: process.env.CLOUD_API_KEY,
            timestamp: timestamp.toString(),
            signature,
        });

        const deleteRes = await fetch(
            `https://api.cloudinary.com/v1_1/${process.env.CLOUD_NAME}/image/destroy`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: body.toString(),
            }
        );
        console.log(`Delete file: ${publicId}`);
        res.status(200).json({
            message: "Delete file success!"
        })
    } catch (error) {
        console.error("Error when calling deleteFile: " + error);
        return res.status(500).send();
    }
}