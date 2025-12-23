import { create } from "zustand";
import type { SocketState } from "../types/store.ts";
import { useAuthStore } from "./useAuthStore.ts";
import { io, type Socket } from "socket.io-client";
import { useChatStore } from "./useChatStore.ts";

const baseUrl = import.meta.env.VITE_SOCKET_URL;

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  onlineUsers: [],

  connectSocket: () => {
    try {
      const accessToken = useAuthStore.getState().accessToken;
      const existingSocket = get().socket;
      if (existingSocket) return;

      const socket: Socket = io(baseUrl, {
        auth: { token: accessToken },
        transports: ["websocket"],
      });

      set({ socket });
      socket.on("connect", () => {
        console.log("Đã kết nối với socket!");
        const { getConversations, getMessages, activeConversationId } =
          useChatStore.getState();
        getConversations();
        activeConversationId && getMessages(activeConversationId);
      });

      socket.on("online-user", (userIds) => {
        set({
          onlineUsers: userIds,
        });
      });

      socket.on("new-message", useChatStore.getState().onNewMessage);
      socket.on("seen-message-updated", useChatStore.getState().onSeenMessage);

      socket.on("reconnect", () => {
        console.log("Đã kết nối lại với socket!");
        const { getConversations, getMessages, activeConversationId } =
          useChatStore.getState();
        getConversations();
        activeConversationId && getMessages(activeConversationId);
      });
    } catch (error) {
      console.error("Lỗi khi kết nối socket: " + error);
    }
  },
  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) socket.disconnect();
    console.log("Đã ngắt kết nối với socket!");
    set({ socket: null });
  },
}));
