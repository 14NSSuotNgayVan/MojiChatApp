import moongose from 'mongoose';

const messageSchema = new moongose.Schema({
    conservationId: {
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
    content: {
        type: String
    },
    imgUrl: {
        type: String
    }
}, {
    timestamps: true
})

messageSchema.index({ conservationId: 1, createdAt: -1 })

const Message = moongose.model("Message", messageSchema)

export default Message;