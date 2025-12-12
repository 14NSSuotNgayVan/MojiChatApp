import api from "../lib/axios.ts";
import type { ConversationResponse } from "../types/chat.ts";

export const chatService = {
  async fetchConversation(): Promise<ConversationResponse> {
    const res = await api.get("/conversations");
    return res.data;
  },

  async fetchMessage(
    conversationId: string,
    params: { limit: number; cursor: string }
  ) {
    const res = await api.get(`/conversations/${conversationId}`, { params });
    return res.data;
  },
};
