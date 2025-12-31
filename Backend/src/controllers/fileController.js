
import cloudinary from "cloudinary";
import { generateSignature } from "../utils/uploadFileHelper.js";

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

    }
}