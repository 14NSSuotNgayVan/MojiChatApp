export const updateConversationAfterCreateMessage = (conversation, message, senderId) => {
    conversation.set({
        lastMessageAt: message.createdAt,
        lastMessage: {
            _id: message._id,
            content: message.content,
            senderId: senderId,
            createdAt: message.createdAt,
            type: message.type
        }
    })

    conversation.participants.forEach((item) => {
        const memberId = item.userId.toString();
        const isSender = memberId === senderId.toString();
        const prevCount = conversation.unreadCounts.get(memberId) || 0;
        conversation.unreadCounts.set(memberId, isSender ? 0 : prevCount + 1);
    })
}

export const emmitNewMessage = (io, conversation, message, sender) => {

    io.to(conversation._id.toString()).emit("new-message", {
        message,
        conversation: {
            _id: conversation._id,
            lastMessageAt: conversation.lastMessageAt,
            lastMessage: {
                _id: message._id,
                content: message.content,
                senderId: message.senderId,
                senderName: sender.displayName,
                createdAt: message.createdAt,
                type: message.type
            },
            unreadCounts: conversation.unreadCounts,
        },
    })
}