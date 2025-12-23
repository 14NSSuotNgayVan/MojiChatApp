import { updateSeenBy } from "../controllers/conversationController.js"

export const onSeenMessage = (socket) => {
    socket.on("seen-message-request", (data) => { updateSeenBy(data, socket) })
}