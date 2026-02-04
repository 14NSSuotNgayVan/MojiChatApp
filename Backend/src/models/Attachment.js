import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        index: true
    },
    messageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
        index: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    type: {
        type: String,
        enum: ['image', 'video']
    },
    url: String,
    meta: {
        width: Number,
        height: Number,
        duration: Number,
        size: Number,
        poster: String
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true })

attachmentSchema.index({ conversationId: 1, messageId: 1, senderId: 1, createdAt: -1 })

const Attachment = mongoose.model("Attachment", attachmentSchema)

export default Attachment;