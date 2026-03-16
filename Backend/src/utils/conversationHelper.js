export const convertConversation = (conv, userId) => {
    return {
        ...conv,
        participants: conv.participants?.map(p => {
            return ({
                ...p,
                _id: p.userId?._id || p.userId,
                userId: undefined
            })
        }).sort((a, b) => {
            if (a._id.toString() === userId.toString()) return 1
            if (b._id.toString() === userId.toString()) return -1
            return 0
        })
    }
}