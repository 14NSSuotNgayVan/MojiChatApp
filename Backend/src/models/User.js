import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    hashpassword: {
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
    avtUrl: {
        type: String,
    },
    avtId: {
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
const User = mongoose.model('User', userSchema);

export default User;