import mongoose from 'mongoose';

const participantSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
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

const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        require: false,
        trim: true
    },
    nameNorm: String,
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        require: true
    },
    avtUrl: {
        type: String,
    },

}, {
    _id: false
})

const lastMessageSchema = new mongoose.Schema({
    _id: {
        type: String
    },
    content: {
        type: String,
        default: null,
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    type: {
        type: String,
        enum: ['text', 'media', 'mixed', 'system'],
        default: 'text'
    },
    lastMediaType: {
        type: String,
        enum: ['image', 'video']
    },
    createdAt: { type: Date, default: null }

},
    {
        _id: false
    })

const seenSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    lastSeenAt: {
        type: Date
    },
    messageId: {
        type: String
    }
})

const conversationSchema = new mongoose.Schema({
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
        type: groupSchema
    },
    lastMessageAt: {
        type: Date
    },
    seenBy: [seenSchema],
    lastMessage: {
        type: lastMessageSchema,
        default: null
    },
    //Số tin nhắn chưa đọc của mỗi người {[id1]: number,[id2]: number....}
    unreadCounts: {
        type: Map,
        of: Number,
        default: {}
    },
    //mảng tên đơn giản của thành viên (phục vụ tìm kiếm)
    participantNameNorms: [String]
}, {
    timestamps: true
})

conversationSchema.index({
    "participants.userId": 1,
    lastMessageAt: -1
})


const Conversation = mongoose.model("Conversation", conversationSchema)

export default Conversation;

