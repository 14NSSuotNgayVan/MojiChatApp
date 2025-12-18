import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatState } from "../types/store.ts";
import { chatService } from "../services/chatService.ts";
import type { MessageGroup } from "../types/chat.ts";
import { diffMinutes } from "../lib/utils.ts";
import { toast } from "sonner";
import { useAuthStore } from "./useAuthStore.ts";

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      messages: {},
      activeConversationId: null,
      activeConversation: null,
      loading: false,
      messageLoading: false,
      setActiveConversation: (activeConversation) =>
        set({
          activeConversationId: activeConversation?._id,
          activeConversation,
        }),
      getConversations: async () => {
        try {
          set({ loading: true });
          const res = await chatService.fetchConversation();
          set({ conversations: res.conversations });
        } catch (error) {
          console.error("Lỗi khi gọi getConversations:", error);
        } finally {
          set({ loading: false });
        }
      },
      getMessages: async (conversationId) => {
        try {
          const { messages } = get();
          const currentMessage = messages?.[conversationId];

          if (currentMessage && !currentMessage?.nextCursor) return;

          set({ messageLoading: true });

          const res = await chatService.fetchMessage(conversationId, {
            limit: 50,
            cursor: currentMessage?.nextCursor || "",
          });

          set((prev) => {
            const prevItems = prev?.messages?.[conversationId]?.items || [];
            return {
              messages: {
                ...prev.messages,
                [conversationId]: {
                  items: prevItems?.length
                    ? [...prevItems, ...(res?.messages || [])]
                    : res?.messages || [],
                },
                nextCursor: res?.nextCursor,
                hasMore: !!res?.nextCursor,
              },
            };
          });
        } catch (error) {
          console.error("Lỗi khi gọi getMessages:", error);
        } finally {
          set({ messageLoading: false });
        }
      },
      getDefaultGroupName: (participants) => {
        return participants
          ? `${participants
              .slice(0, 2)
              .map((p) => p.displayName)
              .join(", ")
              .concat("")} ${
              participants.length > 2 ? "và những người khác" : ""
            }`
          : "";
      },
      getGroupMessages: (messages, timeThresholdMinutes = 5) => {
        const groupMessages: MessageGroup[] = [];
        messages.forEach((m) => {
          const lastGroup = groupMessages[groupMessages.length - 1];
          const canAppend =
            lastGroup &&
            lastGroup.senderId === m.senderId &&
            diffMinutes(lastGroup.endTime, new Date(m.createdAt)) <=
              timeThresholdMinutes;

          if (canAppend) {
            lastGroup.messages.push(m);
            lastGroup.endTime = new Date(m.createdAt);
          } else {
            groupMessages.push({
              messages: [m],
              senderId: m.senderId,
              startTime: new Date(m.createdAt),
              endTime: new Date(m.createdAt),
              isOwner: m.isOwner,
            });
          }
        });
        return groupMessages;
      },
      sendDirectMessage: async (conversationId, recipientId, content) => {
        try {
          await chatService.sendDirectMessage(
            conversationId,
            recipientId,
            content
          );
        } catch (error) {
          console.error(error);
          toast.error("Lỗi khi gửi tin nhắn!");
        }
      },
      sendGroupMessage: async (conversationId, content) => {
        try {
          await chatService.sendGroupMessage(conversationId, content);
        } catch (error) {
          console.error(error);
          toast.error("Lỗi khi gửi tin nhắn!");
        }
      },
      onNewMessage: (data) => {
        const { user } = useAuthStore.getState();
        const { conversation, message } = data;
        debugger;
        const {
          activeConversationId,
          activeConversation,
          conversations,
          messages,
        } = get();
        //update conversation
        const idx = conversations.findIndex((c) => c._id === conversation._id);

        const updatedConverSation = {
          ...conversations[idx],
          ...conversation,
        };

        //update messages
        const convMessages = messages?.[conversation._id];

        set({
          messages: convMessages
            ? {
                ...messages,
                [conversation._id]: {
                  hasMore: convMessages?.hasMore,
                  nextCursor: convMessages?.nextCursor,
                  items: [
                    ...convMessages.items,
                    { ...message, isOwner: message.senderId === user?._id },
                  ],
                },
              }
            : messages,
          activeConversation:
            activeConversationId === conversation._id
              ? updatedConverSation
              : activeConversation,
          conversations:
            idx !== -1
              ? [
                  updatedConverSation,
                  ...conversations.filter((_, i) => i !== idx),
                ]
              : conversations,
        });
      },
      updateConversation: (data) => {},
      reset: () => {
        set({
          conversations: [],
          activeConversation: null,
          messages: {},
          activeConversationId: null,
          loading: false,
        });
      },
    }),
    {
      name: "chat-storage",
      partialize: (state) => ({ conversations: state.conversations }),
    }
  )
);
