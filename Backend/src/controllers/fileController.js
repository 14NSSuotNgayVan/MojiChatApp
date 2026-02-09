import cloudinary from 'cloudinary';
import { generateSignature } from '../utils/uploadFileHelper.js';
import crypto from 'crypto';
import Attachment from '../models/Attachment.js';

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
        console.error('Error when calling getAvatarSignature: ' + error);
        return res.status(500).send();
    }
};

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
        console.error('Error when calling getBgSignature: ' + error);
        return res.status(500).send();
    }
};

export const getMediaSignature = async (req, res) => {
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
        console.error('Error when calling getMediaSignature: ' + error);
        return res.status(500).send();
    }
};

export const deleteFile = async (req, res) => {
    try {
        const {
            publicId,
            resourceType = 'image', // image | video
            type = 'upload', // upload | private | authenticated
        } = req.query;

        if (!publicId) {
            return res.status(400).json({ message: 'publicId must not be empty!' });
        }

        const timestamp = Math.round(Date.now() / 1000);

        const signature = crypto
            .createHash('sha1')
            .update(
                `public_id=${publicId}&timestamp=${timestamp}&type=${type}${process.env.CLOUD_API_SECRET}`
            )
            .digest('hex');

        const body = new URLSearchParams({
            public_id: publicId,
            api_key: process.env.CLOUD_API_KEY,
            timestamp: timestamp.toString(),
            type,
            signature,
        });

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${process.env.CLOUD_NAME}/${resourceType}/destroy`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: body.toString(),
            }
        );

        const result = await response.json();

        if (result.result !== 'ok') {
            return res.status(400).json({
                message: 'Delete failed',
                cloudinary: result,
            });
        }

        res.status(200).json({
            message: 'Delete file success!',
        });
    } catch (error) {
        console.error('Error when calling deleteFile:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getConversationMediasByDirection = async (req, res) => {
    try {
        const { conversationId } = req.params;

        const {
            mediaId,
            limit = 20,
            direction = 'next' // 'prev' | 'next'
        } = req.query;
        const userId = req.user._id.toString();

        if (!conversationId)
            return res.status(400).json({ message: 'conversationId must not be empty!' });

        if (!mediaId) return res.status(400).json({ message: 'mediaId must not be empty!' });

        if (direction !== 'next' || direction !== 'prev') return res.status(400).json({ message: 'direction must be "prev" or "next"!' });

        const media = await Attachment.findById(mediaId).populate(
            {
                path: "senderId", select: 'displayName avtUrl',
            },
        );

        const query = {
            conversationId,
        };

        if (media.createdAt) {
            if (direction === 'next') {
                query.$or = [
                    { createdAt: { $gt: new Date(media.createdAt) } },
                    {
                        createdAt: new Date(media.createdAt),
                        _id: { $gt: mediaId }
                    }
                ]
            }
            if (direction === 'prev') {
                query.$or = [
                    { createdAt: { $lt: new Date(media.createdAt) } },
                    {
                        createdAt: new Date(media.createdAt),
                        _id: { $lt: mediaId }
                    }
                ]
            }
        }

        const medias = await Attachment.find(query)
            .sort({ createdAt: direction === 'next' ? 1 : -1 })
            .limit(Number(limit) + 1)
            .populate([
                {
                    path: "senderId", select: 'displayName avtUrl',
                    options: { lean: true }
                }
            ])
            .lean().then(docs => docs.map(doc => ({
                ...doc,
                isOwner: doc.senderId?._id?.toString() === userId
            })))


        let nextCursor;
        let prevCursor;
        if (medias?.length > Number(limit)) {
            medias.pop();
            if (direction === 'next') nextCursor = medias[medias.length - 1]._id;
            if (direction === 'prev') prevCursor = medias[medias.length - 1]._id;
        }

        return res.status(200).json({
            message: 'Get medias success!',
            medias: direction === 'next' ? medias : medias.reverse(),
            nextCursor,
            prevCursor
        });
    } catch (error) {
        console.error('Error when calling getConversationMedias:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getMediasGalleryById = async (req, res) => {
    try {
        const { mediaId } = req.params;
        const { limit = 10, begining, end } = req.query;
        const userId = req.user._id.toString();
        if (!mediaId) return res.status(400).json({ message: 'mediaId must not be empty!' });

        const media = await Attachment.findById(mediaId).populate(
            {
                path: "senderId", select: 'displayName avtUrl',
            },
        );

        const query = {
            conversationId: media.conversationId
        };

        let cursor = media.createdAt;

        const nextMedias = await Attachment.find({
            ...query,
            $or: [
                { createdAt: { $gt: new Date(cursor) } },
                {
                    createdAt: new Date(cursor),
                    _id: { $gt: mediaId }
                }
            ]
        })
            .sort({ createdAt: 1 })
            .limit(Number(limit) + 1)
            .populate([
                {
                    path: "senderId", select: 'displayName avtUrl',
                    options: { lean: true }
                }
            ])
            .lean()
            .then(docs => docs.map(doc => ({
                ...doc,
                isOwner: doc.senderId?._id?.toString() === userId
            })))

        const prevMedias = await Attachment.find({
            ...query,
            $or: [
                { createdAt: { $lt: new Date(cursor) } },
                {
                    createdAt: new Date(cursor),
                    _id: { $lt: mediaId }
                }
            ]
        })
            .sort({ createdAt: -1 })
            .limit(Number(limit) + 1)
            .populate([
                {
                    path: "senderId", select: 'displayName avtUrl',
                    options: { lean: true }
                }
            ])
            .lean()
            .then(docs => docs.map(doc => ({
                ...doc,
                isOwner: doc.senderId?._id?.toString() === userId
            })))

        let nextCursor;
        let prevCursor;

        if (nextMedias?.length > Number(limit)) {
            nextMedias.pop();
            nextCursor = nextMedias[nextMedias.length - 1].createdAt.toISOString();
        }

        if (prevMedias?.length > Number(limit)) {
            prevMedias.pop();
            prevCursor = prevMedias[prevMedias.length - 1].createdAt.toISOString();
        }
        const middleMedia = media.toObject();

        middleMedia.isOwner = middleMedia.senderId?._id?.toString() === userId

        return res.status(200).json({
            message: 'Get medias success!',
            medias: [
                ...prevMedias.reverse(),
                middleMedia,
                ...nextMedias
            ],
            nextCursor,
            prevCursor
        });
    } catch (error) {
        console.error('Error when calling getConversationMedias:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
