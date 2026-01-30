import moongose from 'mongoose';

const messageSchema = new moongose.Schema({
    conversationId: {
        type: moongose.Schema.Types.ObjectId,
        ref: 'Conversation',
        require: true,
        index: true
    },
    senderId: {
        type: moongose.Schema.Types.ObjectId,
        ref: 'User',
        require: true
    },
    type: {
        type: String,
        enum: ['text', 'image', 'system'],
        default: 'text'
    },
    content: {
        type: String
    },
    imgUrls: [String]
}, {
    timestamps: true
})

messageSchema.index({ conversationId: 1, createdAt: -1 })

const Message = moongose.model("Message", messageSchema)

export default Message;