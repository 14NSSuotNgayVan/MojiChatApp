import { v2 as cloudinary } from "cloudinary"
import crypto from "crypto";

export const IMAGE_PRESETS = {
    avatar: {
        width: 128,
        height: 128,
        crop: "thumb",
        quality: "auto",
        fetch_format: 'auto',
        gravity:'auto'
    },

    avatarLarge: {
        quality: "auto",
        fetch_format: 'auto'
    },

    bgUser: {
        width: 800,
        quality: "auto",
        fetch_format:'auto'
    },

}

export function generateSignature(folder) {
    const timestamp = Math.round(Date.now() / 1000);

    const signature = crypto
        .createHash("sha1")
        .update(
            `folder=${folder}&timestamp=${timestamp}${process.env.CLOUD_API_SECRET}`
        )
        .digest("hex");

    return { timestamp, signature };
}

export function buildImageUrl(publicId, options) {
    return cloudinary.url(publicId, {
        secure: true,
        ...options
    })
}