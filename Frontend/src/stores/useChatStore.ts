import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatState } from "@/types/store.ts";
import { chatService } from "../services/chatService.ts";
import type { MessageGroup } from "../types/chat.ts";
import { diffMinutes } from "../lib/utils.ts";
import { toast } from "sonner";
import { useAuthStore } from "./useAuthStore.ts";
import { useSocketStore } from "./useSocketStore.ts";

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      isSearching: false,
      isFetchOldMessage: false,
      conversations: [],
      messages: {},
      medias: {},
      users: {},
      activeConversationId: null,
      activeConversation: null,
      loading: false,
      messageLoading: false,
      searchedConversations: [],
      setActiveConversation: (activeConversation) =>
        set({
          activeConversationId: activeConversation?._id,
          activeConversation,
        }),
      setUser: (user) => {
        set((prev) => ({
          users: {
            ...prev.users,
            [user._id]: user
          }
        }))
      },
      setMedia: (id, fnc) => {
        set((prev) => ({
          medias: {
            ...prev.medias,
            [id]: prev.medias?.[id] ? fnc(prev.medias[id]) : fnc(undefined)
          }
        }))
      },
      getConversations: async () => {
        try {
          set({ loading: true });
          const res = await chatService.fetchConversation();
          set({ conversations: res.conversations, users: res.users });
        } catch (error) {
          console.error("Lỗi khi gọi getConversations:", error);
        } finally {
          set({ loading: false });
        }
      },
      searchConversations: async (keyword: string) => {
        try {
          set({ loading: true });
          const res = await chatService.searchConversation({ keyword });
          set({
            searchedConversations: res?.conversations || [],
            users: {
              ...get().users,
              ...(res?.users ?? {})
            }
          })
        } catch (error) {
          console.error("Lỗi khi gọi getMessages:", error);
        } finally {
          set({ loading: false });
        }
      },
      getMessages: async (conversationId, isFetchOldMessage = false) => {
        try {
          const { messages, messageLoading } = get();
          const currentMessage = messages?.[conversationId];

          if (isFetchOldMessage) set({ isFetchOldMessage })

          if (
            (currentMessage && !isFetchOldMessage) ||
            (isFetchOldMessage && !currentMessage.nextCursor) ||
            messageLoading
          )
            return true;
          set({ messageLoading: true });
          const res = await chatService.fetchMessage(conversationId, {
            limit: 50,
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
          set({ messageLoading: false, isFetchOldMessage: false });
        }
      },
      getDefaultGroupName: (participants) => {
        const users = get().users;
        return participants
          ? `Bạn, ${participants
            .slice(0, 2)
            .map((p) => users[p?._id]?.displayName)
            .join(", ")
            .concat("")} ${participants.length > 3 ? "và những người khác" : ""
          }`
          : "";
      },
      getGroupMessages: (messages, timeThresholdMinutes = 5) => {
        const groupMessages: MessageGroup[] = [];
        messages.forEach((m) => {
          if (m.type === 'system') {
            groupMessages.push({
              messages: [m],
              senderId: m.senderId,
              startTime: new Date(m.createdAt),
              endTime: new Date(m.createdAt),
              isOwner: false,
            });
            return;
          }

          const lastGroup = groupMessages[groupMessages.length - 1];
          const canAppend =
            lastGroup &&
            lastGroup.messages[0]?.type !== 'system' &&
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
      sendDirectMessage: async (conversationId, recipientId, content, media) => {
        try {
          await chatService.sendDirectMessage(
            conversationId,
            recipientId,
            content,
            media
          );
        } catch (error) {
          console.error(error);
          toast.error("Lỗi khi gửi tin nhắn!");
        }
      },
      sendGroupMessage: async (conversationId, content, media) => {
        try {
          await chatService.sendGroupMessage(conversationId, content, media);
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
          medias
        } = get();
        //update conversation
        const idx = conversations.findIndex((c) => c._id === conversation._id);

        const updatedConverSation = {
          ...conversations[idx],
          ...conversation,
        };

        //update messages
        const convMessages = messages?.[conversation._id];

        const convMedias = medias?.[conversation._id];

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
            : {
                ...messages,
                [conversation._id]: {
                  hasMore: false,
                  nextCursor: undefined,
                  items: [{ ...message, isOwner: message.senderId === user?._id }],
                },
              },
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
          medias: message.medias?.length
            ? {
                ...medias,
                [conversation._id]: {
                  items: [
                    ...(convMedias?.items || []),
                    ...message.medias,
                  ],
                  nextCursor: undefined,
                  prevCursor: convMedias?.prevCursor,
                  newestMediaId: message.medias[message.medias.length - 1]._id,
                },
              }
            : medias,
        });
      },
      updateConversation: (conversation) => {
        const { activeConversationId, activeConversation, conversations } = get();
        const idx = conversations.findIndex((c) => c._id === conversation._id);
        if (idx === -1) return;

        const updatedConverSation = {
          ...conversations[idx],
          ...conversation,
        };

        set({
          conversations: [
            updatedConverSation,
            ...conversations.filter((_, i) => i !== idx),
          ],
          activeConversation:
            activeConversationId === conversation._id
              ? updatedConverSation
              : activeConversation,
        });
      },
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
        const userId = useAuthStore.getState().user?._id;
        const socket = useSocketStore.getState().socket;

        if (
          !socket ||
          !currentConv ||
          !userId ||
          !currentConv.lastMessage ||
          !currentConv.unreadCounts
        ) {
          return;
        }

        if (
          currentConv.lastMessage.senderId === userId ||
          (currentConv.unreadCounts[userId] ?? 0) <= 0
        ) {
          return;
        }

        socket.emit("seen-message-request", {
          conversationId: currentConv._id,
          lastSeenAt: currentConv.lastMessageAt,
        });
      },

      addParticipant: async (conversationId, participantId) => {
        try {
          await chatService.addParticipant(conversationId, participantId);
        } catch (error) {
          console.error(error);
          toast.error("Lỗi khi thêm thành viên!");
        }
      },

      removeParticipant: async (conversationId, participantId) => {
        try {
          await chatService.removeParticipant(conversationId, participantId);
        } catch (error) {
          console.error(error);
          toast.error("Lỗi khi xóa thành viên!");
        }
      },

      updateParticipantRole: async (conversationId, participantId, role) => {
        try {
          await chatService.updateParticipantRole(conversationId, participantId, role);
        } catch (error) {
          console.error(error);
          toast.error("Lỗi khi cập nhật quyền!");
        }
      },

      onParticipantAdded: (data) => {
        const { conversationId, participant, userInfo, systemMessage } = data || {};
        if (!conversationId || !participant?._id) return;

        set((prev) => {
          const idx = prev.conversations.findIndex((c) => c._id === conversationId);
          if (idx === -1) return prev;

          const conv = prev.conversations[idx];
          const exists = conv.participants.some((p) => p._id === participant._id);

          const updatedParticipants = exists
            ? conv.participants.map((p) =>
              p._id === participant._id
                ? {
                  ...p,
                  role: participant.role ?? p.role,
                  status: participant.status ?? p.status,
                  addedBy: participant.addedBy ?? p.addedBy,
                  joinedAt:
                    typeof participant.joinedAt === 'string'
                      ? participant.joinedAt
                      : participant.joinedAt
                        ? participant.joinedAt.toISOString()
                        : p.joinedAt,
                }
                : p
            )
            : [
              ...conv.participants,
              {
                _id: participant._id,
                role: participant.role,
                status: participant.status,
                addedBy: participant.addedBy ?? '',
                joinedAt: typeof participant.joinedAt === 'string'
                  ? participant.joinedAt
                  : (participant.joinedAt ? participant.joinedAt.toISOString() : new Date().toISOString()),
              },
            ];

          const updatedConv = {
            ...conv,
            participants: updatedParticipants,
            ...(systemMessage ? {
              lastMessage: {
                _id: systemMessage._id,
                content: systemMessage.content ?? '',
                senderId: systemMessage.senderId,
                type: systemMessage.type,
                createdAt: systemMessage.createdAt,
              },
              lastMessageAt: systemMessage.createdAt,
            } : {}),
          };

          const convMessages = prev.messages?.[conversationId];
          const updatedMessages = systemMessage && convMessages
            ? {
              ...prev.messages,
              [conversationId]: {
                ...convMessages,
                items: [...convMessages.items, systemMessage],
              },
            }
            : prev.messages;

          return {
            ...prev,
            messages: updatedMessages,
            conversations: [
              updatedConv,
              ...prev.conversations.filter((_, i) => i !== idx),
            ],
            activeConversation:
              prev.activeConversationId === conversationId ? updatedConv : prev.activeConversation,
            users: userInfo?._id
              ? {
                ...prev.users,
                [userInfo._id]: userInfo,
              }
              : prev.users,
          };
        });
      },

      onParticipantRemoved: (data) => {
        const { conversationId, participantId, systemMessage } = data || {};
        if (!conversationId || !participantId) return;

        set((prev) => {
          const idx = prev.conversations.findIndex((c) => c._id === conversationId);
          if (idx === -1) return prev;

          const conv = prev.conversations[idx];
          const updatedParticipants = conv.participants.map((p) =>
            p._id === participantId ? { ...p, status: 'LEFT' as const } : p
          );
          const updatedConv = {
            ...conv,
            participants: updatedParticipants,
            ...(systemMessage ? {
              lastMessage: {
                _id: systemMessage._id,
                content: systemMessage.content ?? '',
                senderId: systemMessage.senderId,
                type: systemMessage.type,
                createdAt: systemMessage.createdAt,
              },
              lastMessageAt: systemMessage.createdAt,
            } : {}),
          };

          const convMessages = prev.messages?.[conversationId];
          const updatedMessages = systemMessage && convMessages
            ? {
              ...prev.messages,
              [conversationId]: {
                ...convMessages,
                items: [...convMessages.items, systemMessage],
              },
            }
            : prev.messages;

          return {
            ...prev,
            messages: updatedMessages,
            conversations: [
              updatedConv,
              ...prev.conversations.filter((_, i) => i !== idx),
            ],
            activeConversation:
              prev.activeConversationId === conversationId ? updatedConv : prev.activeConversation,
          };
        });
      },

      onParticipantRoleUpdated: (data) => {
        const { conversationId, participantId, newRole, systemMessage } = data || {};
        if (!conversationId || !participantId || !newRole) return;

        set((prev) => {
          const idx = prev.conversations.findIndex((c) => c._id === conversationId);
          if (idx === -1) return prev;

          const conv = prev.conversations[idx];
          const updatedParticipants = conv.participants.map((p) =>
            p._id === participantId ? { ...p, role: newRole } : p
          );
          const updatedConv = {
            ...conv,
            participants: updatedParticipants,
            ...(systemMessage ? {
              lastMessage: {
                _id: systemMessage._id,
                content: systemMessage.content ?? '',
                senderId: systemMessage.senderId,
                type: systemMessage.type,
                createdAt: systemMessage.createdAt,
              },
              lastMessageAt: systemMessage.createdAt,
            } : {}),
          };

          const convMessages = prev.messages?.[conversationId];
          const updatedMessages = systemMessage && convMessages
            ? {
              ...prev.messages,
              [conversationId]: {
                ...convMessages,
                items: [...convMessages.items, systemMessage],
              },
            }
            : prev.messages;

          return {
            ...prev,
            messages: updatedMessages,
            conversations: [
              updatedConv,
              ...prev.conversations.filter((_, i) => i !== idx),
            ],
            activeConversation:
              prev.activeConversationId === conversationId ? updatedConv : prev.activeConversation,
          };
        });
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
