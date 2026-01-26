import mongoose from 'mongoose';
import { IMAGE_PRESETS } from '../utils/uploadFileHelper.js';

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    hashPassword: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    displayName: {
        type: String,
        required: true,
        trim: true,
    },
    searchName: {
        type: String,
        required: true,
        trim: true,
    },
    avtUrl: {
        type: String,
    },
    avtId: {
        type: String
    },
    bgUrl: {
        type: String,
    },
    bgId: {
        type: String
    },
    bio: {
        type: String,
    },
    phone: {
        type: String,
        parse: true
    }
}, {
    timestamps: true
});

userSchema.virtual("transformedAvtUrl").get(function () {
    if (!this.avtId) return null;

    return buildImageUrl(
        this.avtId,
        IMAGE_PRESETS.avatar
    );
});

const User = mongoose.model('User', userSchema);

export default User;