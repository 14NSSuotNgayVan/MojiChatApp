import moongose from 'mongoose';

const participantSchema = new moongose.Schema({
    userId: {
        type: moongose.Schema.Types.ObjectId,
        ref: "User",
        require: true
    },
    joinedAt: {
        type: Date,
        default: Date.now
    }
}, {
    _id: false
})

const groupSchema = new moongose.Schema({
    name: {
        type: String,
        require: false,
        trim: true
    },
    createdBy: {
        type: moongose.Schema.Types.ObjectId,
        ref: "User",
        require: true
    },

}, {
    _id: false
})

const lastMessageSchema = new moongose.Schema({
    _id: {
        type: String
    },
    content: {
        type: String,
        default: null,
    },
    senderId: {
        type: moongose.Schema.Types.ObjectId,
        ref: "User"
    },
    createdAt: { type: Date, default: null }
},
    {
        _id: false
    })
const conversationSchema = new moongose.Schema({
    type: {
        type: String,
        enum: ["direct", "group"],
        require: true
    },
    participants: {
        type: [participantSchema],
        requie: true
    },
    group: {
        type: [groupSchema]
    },
    lastMessageAt: {
        type: Date
    },
    lastMessage: {
        type: [lastMessageSchema],
        default: null
    },
    unreadCounts: {
        type: Map,
        of: Number,
        default: {}
    }
}, {
    timestamps: true
})

conversationSchema.index({
    "participant.userId": 1,
    lastMessageAt: -1
})

const Conversation = moongose.model("Conversation", conversationSchema)

export default Conversation;

