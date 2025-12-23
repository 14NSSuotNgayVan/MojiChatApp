import mongoose from 'mongoose';
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
    avtUrl: {
        type: String,
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
    }
}, {
    timestamps: true
})

conversationSchema.index({
    "participants.userId": 1,
    lastMessageAt: -1
})
// conversationSchema.set("toJSON", {
//     virtuals: true,
//     versionKey: false,
//     transform: function (doc, ret) {
//         delete ret.__v;
//         ret.participants = doc.participants?.map(p => ({
//             _id: p.userId?._id || p.userId,
//             displayName: p?.userId?.displayName,
//             avtUrl: p?.userId?.avtUrl,
//             joinedAt: p.joinedAt
//         }))
//         if (ret.lastMessage)
//             ret.lastMessage = {
//                 ...ret.lastMessage,
//                 senderId: ret.lastMessage.senderId._id,
//                 senderName: ret.lastMessage.senderId.displayName
//             }
//         return ret;
//     }
// });
const Conversation = moongose.model("Conversation", conversationSchema)

export default Conversation;

