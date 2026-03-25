import { create } from "zustand";
import type { SocketState } from "@/types/store.ts";
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

      if (!accessToken) {
        return;
      }

      const socket: Socket = io(baseUrl, {
        auth: { token: accessToken },
        transports: ["websocket"],
      });

      set({ socket });
      socket.on("connect", () => {
        console.log("Đã kết nối với socket!");
      });

      socket.on("online-user", (userIds) => {
        set({
          onlineUsers: userIds,
        });
      });

      socket.on("new-message", useChatStore.getState().onNewMessage);
      socket.on("seen-message-updated", useChatStore.getState().onSeenMessage);
      socket.on(
        "message-reaction-updated",
        useChatStore.getState().onMessageReactionUpdated
      );
      socket.on("participant-added", useChatStore.getState().onParticipantAdded);
      socket.on("participant-removed", useChatStore.getState().onParticipantRemoved);
      socket.on("participant-role-updated", useChatStore.getState().onParticipantRoleUpdated);
      socket.on("conversation-deleted", useChatStore.getState().onConversationDeleted);
      socket.on("participant-left", useChatStore.getState().onParticipantLeft);
      socket.on("group-profile-updated", useChatStore.getState().onGroupProfileUpdated);

      socket.io.on("reconnect", () => {
        console.log("Đã kết nối lại với socket!");
        const { getConversations, getMessages, activeConversationId } =
          useChatStore.getState();
        getConversations();
        if (activeConversationId) getMessages(activeConversationId);
      });

      socket.on("updated-user", get().onUpdateUser)

      socket.on("connect_error", async (err) => {
        console.log("Lỗi khi kết nối socket: ", err.message);

        if (err.message === "AUTH_ERROR" || err.message === "NO_TOKEN") {
          try {
            await useAuthStore.getState().refreshToken();
          } catch(e) {
            console.error("Làm mới token khi lỗi socket thất bại:", e);
          }
        }
      });
    } catch (error) {
      console.error("Lỗi khi kết nối socket: " + error);
    }
  },
  onUpdateUser: (user) => {
    const _id = useAuthStore.getState().user?._id;
    useChatStore.getState().setUser(user);
    if (_id === user._id) {
      useAuthStore.setState((prev) => ({
        ...prev,
        user
      }))
    }
  },
  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      socket.off("new-message");
      socket.off("seen-message-updated");
      socket.off("message-reaction-updated");
      socket.off("participant-added");
      socket.off("participant-removed");
      socket.off("participant-role-updated");
      socket.off("conversation-deleted");
      socket.off("participant-left");
      socket.off("group-profile-updated");
      socket.disconnect();
    }
    console.log("Đã ngắt kết nối với socket!");
    set({ socket: null });
  },
}));
