import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatState } from "../types/store.ts";
import { chatService } from "../services/chatService.ts";
import type { MessageGroup } from "../types/chat.ts";
import { diffMinutes } from "../lib/utils.ts";
import { toast } from "sonner";
import { useAuthStore } from "./useAuthStore.ts";
import { useSocketStore } from "./useSocketStore.ts";

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
      getMessages: async (conversationId, isFetchOldMessage = false) => {
        try {
          const { messages, messageLoading } = get();
          const currentMessage = messages?.[conversationId];

          if (
            (currentMessage && !isFetchOldMessage) ||
            (isFetchOldMessage && !currentMessage.nextCursor) ||
            messageLoading
          )
            return true;
          set({ messageLoading: true });
          const res = await chatService.fetchMessage(conversationId, {
            limit: 20,
            cursor: isFetchOldMessage ? currentMessage.nextCursor : undefined,
          });

          set((prev) => {
            const prevItems = prev?.messages?.[conversationId]?.items || [];
            return {
              messages: {
                ...prev.messages,
                [conversationId]: {
                  items: prevItems?.length
                    ? [...(res?.messages || []), ...prevItems]
                    : res?.messages || [],
                  nextCursor: res?.nextCursor,
                  hasMore: !!res?.nextCursor,
                },
              },
            };
          });
          return true;
        } catch (error) {
          console.error("Lỗi khi gọi getMessages:", error);
          return false;
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
      updateConversation: (conversation) => {},
      onSeenMessage: (data) => {
        try {
          const { conversationId, lastSeenAt, user, unreadCounts, messageId } =
            data;
          const { conversations, activeConversationId, activeConversation } =
            get();
          const index = conversations.findIndex(
            (c) => c._id === conversationId
          );

          if (index === -1) return;

          const isActive = activeConversationId === conversationId;
          const userSeenByIndex = conversations[index].seenBy.findIndex(
            (i) => i.userId === user._id
          );

          const updatedConv = {
            ...conversations[index],
            seenBy:
              userSeenByIndex !== -1 // Nếu người này đã tồn tại trong seenBy ? cập nhật : thêm vào seenBy
                ? conversations[index].seenBy.map((item) =>
                    item?.userId === user._id
                      ? {
                          ...item,
                          lastSeenAt: new Date(lastSeenAt),
                          messageId,
                        }
                      : item
                  )
                : [
                    ...conversations[index].seenBy,
                    {
                      userId: user._id,
                      lastSeenAt: new Date(lastSeenAt),
                      messageId,
                      avtUrl: user.avtUrl,
                      displayName: user.displayName,
                    },
                  ],
            unreadCounts,
          };
          const updatedConvs = [...conversations];

          updatedConvs[index] = updatedConv;

          set({
            conversations: updatedConvs,
            activeConversation: isActive ? updatedConv : activeConversation,
          });
        } catch (error) {
          console.log(error);
        }
      },
      seenMessage: () => {
        const currentConv = get().activeConversation;

        const socket = useSocketStore.getState().socket;

        if (
          socket &&
          currentConv &&
          currentConv.lastMessage?.senderId !==
            useAuthStore.getState().user?._id
        ) {
          socket.emit("seen-message-request", {
            conversationId: currentConv._id,
            lastSeenAt: currentConv.lastMessageAt,
          });
        }
      },
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
      partialize: (state) => ({
        conversations: state.conversations,
      }),
    }
  )
);
