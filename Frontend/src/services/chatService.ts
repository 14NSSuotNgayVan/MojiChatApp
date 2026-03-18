import type { FileRequest } from "@/types/store.ts";
import api from "../lib/axios.ts";
import type { Conversation, ConversationResponse } from "../types/chat.ts";

export const chatService = {
  //conversation
  async createConversation(payload: { type: "group" | "direct", name?: string, memberIds: string[], avtUrl?: string }): Promise<{ conversation: Conversation }> {
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
  async fetchHiddenConversations(): Promise<ConversationResponse> {
    const res = await api.get("/conversations/hidden");
    return res.data;
  },
  async hideConversation(conversationId: string) {
    const res = await api.post(`/conversations/${conversationId}/hide`);
    return res.data;
  },
  async unhideConversation(conversationId: string) {
    const res = await api.post(`/conversations/${conversationId}/unhide`);
    return res.data;
  },
  async clearDirectConversation(conversationId: string) {
    const res = await api.post(`/conversations/${conversationId}/clear`);
    return res.data;
  },
  async deleteGroupConversation(conversationId: string) {
    const res = await api.delete(`/conversations/${conversationId}`);
    return res.data;
  },
  async leaveConversation(conversationId: string) {
    const res = await api.post(`/conversations/${conversationId}/leave`);
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
    content: string = "",
    media?: FileRequest[]
  ) {
    const res = await api.post("/message/direct", {
      conversationId,
      recipientId,
      content,
      media
    });
    return res.data.message;
  },
  async sendGroupMessage(conversationId: string, content: string = "",
    media?: FileRequest[]) {
    const res = await api.post("/message/group", {
      conversationId,
      content,
      media
    });
    return res.data.message;
  },

  async addParticipant(conversationId: string, participantId: string) {
    const res = await api.post(`/conversations/${conversationId}/participant/add`, null, {
      params: { participantId }
    });
    return res.data;
  },

  async removeParticipant(conversationId: string, participantId: string) {
    const res = await api.delete(`/conversations/${conversationId}/participant/delete`, {
      params: { participantId }
    });
    return res.data;
  },

  async updateParticipantRole(
    conversationId: string,
    participantId: string,
    role: 'ADMIN' | 'MEMBER'
  ) {
    const res = await api.put(`/conversations/${conversationId}/participant/role`, {
      participantId,
      role
    });
    return res.data;
  },

};
