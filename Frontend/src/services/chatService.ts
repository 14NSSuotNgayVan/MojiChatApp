import api from "../lib/axios.ts";
import type { Conversation, ConversationResponse } from "../types/chat.ts";

export const chatService = {
  //conversation
  async createConversation(payload: { type: "group" | "direct", name?: string, memberIds: string[] }): Promise<{ conversation: Conversation }> {
    const res = await api.post("/conversations", payload);
    return res.data;
  },
  async fetchConversation(): Promise<ConversationResponse> {
    const res = await api.get("/conversations");
    return res.data;
  },
  async searchConversation(params: { keyword: string }): Promise<ConversationResponse> {
    const res = await api.get("/conversations/search", { params });
    return res.data;
  },
  //message
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
