
import mongoose from 'mongoose';

const ConversationStatsSchema = new mongoose.Schema(
    {
        conversationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Conversation",
            index: true,
            required: true
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            index: true,
            required: true
        },
        messageCount: {
            type: Number,
            default: 0,
            index: true
        },
        lastMessageAt: Date
    },
    { timestamps: true }
);

ConversationStatsSchema.index(
    { conversationId: 1, userId: 1 },
    { unique: true }
);

const ConversationStats = mongoose.model("ConversationStats", ConversationStatsSchema)

export default ConversationStats;