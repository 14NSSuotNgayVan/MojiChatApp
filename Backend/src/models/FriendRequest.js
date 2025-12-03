import mongoose from 'mongoose';

const friendRequestSchema = new mongoose.Schema({
    fromUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        require: true
    },
    toUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        require: true
    },

}, {
    timestamps: true
});

friendRequestSchema.index({ fromUser: 1, toUser: 1 }, { unique: true });
friendRequestSchema.index({ fromUser: 1 });
friendRequestSchema.index({ toUser: 1 });

const FriendRequest = mongoose.model('FriendRequest', friendRequestSchema);

export default FriendRequest;