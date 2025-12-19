import api from "../lib/axios.ts";
import type { ConversationResponse } from "../types/chat.ts";

export const chatService = {
  async fetchConversation(): Promise<ConversationResponse> {
    const res = await api.get("/conversations");
    return res.data;
  },

  async fetchMessage(
    conversationId: string,
    params: { limit: number; cursor: string | null | undefined }
  ) {
    const res = await api.get(`/conversations/${conversationId}`, { params });
    return res.data;
  },
  async sendDirectMessage(
    conversationId: string,
    recipientId: string,
    content: string = ""
  ) {
    const res = await api.post("/message/direct", {
      conversationId,
      recipientId,
      content,
    });
    return res.data.message;
  },
  async sendGroupMessage(conversationId: string, content: string = "") {
    const res = await api.post("/message/group", {
      conversationId,
      content,
    });
    return res.data.message;
  },
};
