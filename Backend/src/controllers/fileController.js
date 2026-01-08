import cloudinary from "cloudinary";
import {
    generateSignature
} from "../utils/uploadFileHelper.js";

cloudinary.v2.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
});

export const getAvatarSignature = async (req, res) => {
    try {
        const user = req.user;
        const folder = `user/${user._id.toString()}/avatar`;
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
        const folder = `user/${user._id.toString()}/bg`;
        const sig = generateSignature(folder);

        res.json({
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

export const deleteFile = async (req, res) => {
    try {
        const user = req.user;
        const { publicId } = req.query;

        if (!publicId) return res.status(400).json({ message: "publicId must not be empty!" })
        
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

        const res = await fetch(
            `https://api.cloudinary.com/v1_1/${process.env.CLOUD_NAME}/image/destroy`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: body.toString(),
            }
        );

    } catch (error) {
        console.error("Error when calling deleteFile: " + error);
        return res.status(500).send();
    }
}