import type { FileRequest } from "@/types/store.ts";
import api from "../lib/axios.ts";
import type { Conversation, ConversationResponse, SearchMessagesResponse } from "../types/chat.ts";

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
  async updateGroupProfile(
    conversationId: string,
    payload: { name?: string; avtUrl?: string }
  ) {
    const res = await api.put(`/conversations/${conversationId}/group-profile`, payload);
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
  async searchMessages(
    conversationId: string,
    params: { keyword: string; cursor?: string; limit?: number }
  ): Promise<SearchMessagesResponse> {
    const res = await api.get(`/conversations/${conversationId}/messages/search`, { params });
    return res.data;
  },
  async sendDirectMessage(
    conversationId: string,
    recipientId: string,
    content: string = "",
    media?: FileRequest[],
    replyToId?: string
  ) {
    const res = await api.post("/message/direct", {
      conversationId,
      recipientId,
      content,
      media,
      replyTo: replyToId,
    });
    return res.data.message;
  },
  async sendGroupMessage(
    conversationId: string,
    content: string = "",
    media?: FileRequest[],
    replyToId?: string
  ) {
    const res = await api.post("/message/group", {
      conversationId,
      content,
      media,
      replyTo: replyToId,
    });
    return res.data.message;
  },

  async toggleMessageReaction(
    payload: { conversationId: string; messageId: string; emoji: string }
  ): Promise<{ conversationId: string; messageId: string; reactions: Array<{ emoji: string; userId: string }> }> {
    const res = await api.post("/message/reaction/toggle", payload);
    return res.data;
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
