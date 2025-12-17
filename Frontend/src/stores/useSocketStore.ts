import { create } from "zustand";
import type { SocketState } from "../types/store.ts";
import { useAuthStore } from "./useAuthStore.ts";
import { io, type Socket } from "socket.io-client";

const baseUrl = import.meta.env.VITE_SOCKET_URL;

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  connectSocket: () => {
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
    });
  },
  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) socket.disconnect();
    set({ socket: null });
  },
}));
