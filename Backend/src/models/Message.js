import mongoose from 'mongoose';

const metaSchema = new mongoose.Schema({
    actorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    targetUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    oldValue: { type: String },
    newValue: { type: String },
}, { _id: false });

const reactionSchema = new mongoose.Schema(
    {
        emoji: { type: String, required: true, trim: true, maxlength: 32 },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    },
    { _id: false }
);

const messageSchema = new mongoose.Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        require: true,
        index: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        require: true
    },
    type: {
        type: String,
        enum: ['text', 'media', 'mixed', 'system'],
        default: 'text'
    },
    systemType: {
        type: String,
        enum: [
            'USER_ADDED',
            'USER_LEFT',
            'USER_REMOVED',
            'GROUP_CREATED',
            'GROUP_NAME_CHANGED',
            'GROUP_AVATAR_CHANGED',
            'ADMIN_PROMOTED',
            'ADMIN_REMOVED',
            'UNKNOWN'
        ]
    },
    meta: {
        type: metaSchema
    },
    content: {
        type: String
    },
    mediaIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Attachment"
    }],
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message"
    },
    // Reactions are stored per message; each user can toggle one emoji.
    reactions: {
        type: [reactionSchema],
        default: [],
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedFor: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }]
}, {
    timestamps: true
})

messageSchema.pre('validate', function (next) {
    if (this.type === 'system' && !this.systemType) {
        this.invalidate('systemType', 'systemType is required when type is system');
    }
    next();
});

messageSchema.index({ conversationId: 1, createdAt: -1 })

const Message = mongoose.model("Message", messageSchema)

export default Message;
