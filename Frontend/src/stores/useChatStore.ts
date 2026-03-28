import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatState } from "@/types/store.ts";
import { chatService } from "../services/chatService.ts";
import type { MessageGroup } from "../types/chat.ts";
import { diffMinutes } from "../lib/utils.ts";
import { playIncomingMessageSound } from "../lib/notificationSound.ts";
import { toast } from "sonner";
import { useAuthStore } from "./useAuthStore.ts";
import { useSocketStore } from "./useSocketStore.ts";

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => {
      const removeConvFromStore = (conversationId: string) => {
        set((prev) => ({
          conversations: prev.conversations.filter((c) => c._id !== conversationId),
          activeConversation:
            prev.activeConversationId === conversationId ? null : prev.activeConversation,
          activeConversationId:
            prev.activeConversationId === conversationId ? null : prev.activeConversationId,
        }));
      };

      const mergeMessageReactions = (
        conversationId: string,
        messageId: string,
        reactions: Array<{ emoji: string; userId: string }>
      ) => {
        set((prev) => {
          const prevConv = prev.messages?.[conversationId];
          const nextItems = prevConv?.items?.map((m) =>
            m._id === messageId ? { ...m, reactions } : m
          );

          return {
            ...prev,
            messages: prevConv
              ? {
                  ...prev.messages,
                  [conversationId]: {
                    ...prevConv,
                    items: nextItems,
                  },
                }
              : prev.messages,
            messageSearchResults: prev.messageSearchResults?.map((m) =>
              m._id === messageId ? { ...m, reactions } : m
            ),
          };
        });
      };

      return ({
        isSearching: false,
        isFetchOldMessage: false,
        hiddenConversations: [],
        hiddenLoading: false,
        sidebarTab: 'inbox',
        setSidebarTab: (tab) => set({ sidebarTab: tab }),
        conversations: [],
        messages: {},
        medias: {},
        users: {},
        activeConversationId: null,
        activeConversation: null,
        replyingTo: null,
        loading: false,
        messageLoading: false,
        searchedConversations: [],
        messageSearchResults: [],
        messageSearchKeyword: "",
        messageSearchNextCursor: null,
        messageSearchTotal: 0,
        messageSearchLoading: false,
        highlightedMessageId: null,
        currentSearchIndex: 0,
        setActiveConversation: (activeConversation) =>
          set((prev) => {
            const nextId = activeConversation?._id ?? null;
            const switched = prev.activeConversationId !== nextId;
            return {
              activeConversationId: nextId,
              activeConversation,
              replyingTo: null,
              ...(switched
                ? {
                  messageSearchResults: [],
                  messageSearchKeyword: "",
                  messageSearchNextCursor: null,
                  messageSearchTotal: 0,
                  highlightedMessageId: null,
                  currentSearchIndex: 0,
                }
                : {}),
            };
          }),
        setReplyingTo: (message) => set({ replyingTo: message }),
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
        clearMessageSearch: () =>
          set({
            messageSearchResults: [],
            messageSearchKeyword: "",
            messageSearchNextCursor: null,
            messageSearchTotal: 0,
            messageSearchLoading: false,
            highlightedMessageId: null,
            currentSearchIndex: 0,
          }),
        searchMessagesInConversation: async (conversationId: string, keyword: string) => {
          const k = keyword.trim();
          if (!k) {
            get().clearMessageSearch();
            return;
          }
          set({
            messageSearchLoading: true,
            messageSearchResults: [],
            messageSearchTotal: 0,
            messageSearchNextCursor: null,
            currentSearchIndex: 0,
            highlightedMessageId: null,
          });
          try {
            const res = await chatService.searchMessages(conversationId, { keyword: k, limit: 20 });
            const list = res?.messages ?? [];
            set({
              messageSearchResults: list,
              messageSearchKeyword: k,
              messageSearchNextCursor: res?.nextCursor ?? null,
              messageSearchTotal: res?.total ?? 0,
              currentSearchIndex: 0,
              highlightedMessageId: list[0]?._id ?? null,
            });
          } catch (error) {
            console.error("Lỗi khi tìm tin nhắn:", error);
            toast.error("Không tìm kiếm được tin nhắn");
          } finally {
            set({ messageSearchLoading: false });
          }
        },
        loadMoreMessageSearchResults: async (conversationId: string) => {
          const { messageSearchNextCursor, messageSearchKeyword, messageSearchLoading } = get();
          if (!messageSearchNextCursor || !messageSearchKeyword || messageSearchLoading) return;
          set({ messageSearchLoading: true });
          try {
            const res = await chatService.searchMessages(conversationId, {
              keyword: messageSearchKeyword,
              cursor: messageSearchNextCursor,
              limit: 20,
            });
            set((prev) => ({
              messageSearchResults: [...prev.messageSearchResults, ...(res?.messages ?? [])],
              messageSearchNextCursor: res?.nextCursor ?? null,
              messageSearchTotal: res?.total ?? prev.messageSearchTotal,
            }));
          } catch (error) {
            console.error("Lỗi khi tải thêm kết quả tìm kiếm:", error);
            toast.error("Không tải thêm kết quả tìm kiếm");
          } finally {
            set({ messageSearchLoading: false });
          }
        },
        navigateMessageSearchResult: async (direction) => {
          const activeId = get().activeConversationId;
          if (!activeId) return;
          let { messageSearchResults, currentSearchIndex, messageSearchNextCursor, messageSearchKeyword } =
            get();
          const len = messageSearchResults.length;
          if (len === 0) return;

          if (direction === "prev") {
            if (currentSearchIndex < len - 1) {
              const ni = currentSearchIndex + 1;
              set({
                currentSearchIndex: ni,
                highlightedMessageId: messageSearchResults[ni]._id,
              });
              return;
            }
            if (messageSearchNextCursor && messageSearchKeyword) {
              await get().loadMoreMessageSearchResults(activeId);
              messageSearchResults = get().messageSearchResults;
              const newLen = messageSearchResults.length;
              if (newLen > currentSearchIndex + 1) {
                const ni = currentSearchIndex + 1;
                set({
                  currentSearchIndex: ni,
                  highlightedMessageId: messageSearchResults[ni]._id,
                });
                return;
              }
            }
            set({
              currentSearchIndex: 0,
              highlightedMessageId: messageSearchResults[0]._id,
            });
            return;
          }

          if (currentSearchIndex > 0) {
            const ni = currentSearchIndex - 1;
            set({
              currentSearchIndex: ni,
              highlightedMessageId: messageSearchResults[ni]._id,
            });
            return;
          }
          set({
            currentSearchIndex: len - 1,
            highlightedMessageId: messageSearchResults[len - 1]._id,
          });
        },
        setHighlightedMessageId: (messageId) => set({ highlightedMessageId: messageId }),
        loadMessagesUntilMessageId: async (conversationId: string, messageId: string) => {
          for (let attempt = 0; attempt < 100; attempt++) {
            const items = get().messages[conversationId]?.items ?? [];
            if (items.some((m) => m._id === messageId)) return true;
            const nextCursor = get().messages[conversationId]?.nextCursor;
            if (!nextCursor) return false;
            if (get().messageLoading) {
              await new Promise((r) => setTimeout(r, 50));
              continue;
            }
            const ok = await get().getMessages(conversationId, true);
            if (!ok) return false;
          }
          return false;
        },
        getHiddenConversations: async () => {
          try {
            set({ hiddenLoading: true });
            const res = await chatService.fetchHiddenConversations();
            set({
              hiddenConversations: res?.conversations || [],
              users: {
                ...get().users,
                ...(res?.users ?? {})
              }
            });
          } catch (error) {
            console.error("Lỗi khi gọi getHiddenConversations:", error);
          } finally {
            set({ hiddenLoading: false });
          }
        },
        unhideConversation: async (conversationId) => {
          try {
            await chatService.unhideConversation(conversationId);
            set((prev) => ({
              hiddenConversations: prev.hiddenConversations.filter((c) => c._id !== conversationId)
            }));
            await get().getConversations();
          } catch (error) {
            console.error(error);
            toast.error("Lỗi khi hiện lại cuộc trò chuyện!");
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
        sendDirectMessage: async (conversationId, recipientId, content, media, replyToId) => {
          try {
            await chatService.sendDirectMessage(
              conversationId,
              recipientId,
              content,
              media,
              replyToId
            );
            set({ replyingTo: null });
          } catch (error) {
            console.error(error);
            toast.error("Lỗi khi gửi tin nhắn!");
          }
        },
        sendGroupMessage: async (conversationId, content, media, replyToId) => {
          try {
            await chatService.sendGroupMessage(conversationId, content, media, replyToId);
            set({ replyingTo: null });
          } catch (error) {
            console.error(error);
            toast.error("Lỗi khi gửi tin nhắn!");
          }
        },
        toggleMessageReaction: async (conversationId, messageId, emoji) => {
          try {
            const res = await chatService.toggleMessageReaction({
              conversationId,
              messageId,
              emoji,
            });
            mergeMessageReactions(conversationId, messageId, res?.reactions ?? []);
          } catch (error) {
            console.error(error);
            toast.error("Lỗi khi thả cảm xúc!");
          }
        },
        onMessageReactionUpdated: (data) => {
          if (!data?.conversationId || !data?.messageId) return;
          mergeMessageReactions(data.conversationId, data.messageId, data.reactions ?? []);
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
          const updatedConverSation =
            idx !== -1
              ? {
                ...conversations[idx],
                ...conversation,
              }
              : null;

          //update messages
          const convMessages = messages?.[conversation._id];

          const convMedias = medias?.[conversation._id];

          const shouldPlayIncomingSound =
            !!user?._id &&
            message.senderId !== user._id;

          if (shouldPlayIncomingSound) {
            void playIncomingMessageSound();
          }

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
                ? (updatedConverSation || activeConversation)
                : activeConversation,
            conversations:
              idx !== -1 && updatedConverSation
                ? [updatedConverSation, ...conversations.filter((_, i) => i !== idx)]
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

          // If conversation isn't in list (likely hidden), refetch list to show it again
          if (idx === -1) {
            void get().getConversations();
          }
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

        hideConversation: async (conversationId) => {
          try {
            await chatService.hideConversation(conversationId);
            removeConvFromStore(conversationId);
          } catch (error) {
            console.error(error);
            toast.error("Lỗi khi ẩn cuộc trò chuyện!");
          }
        },

        clearDirectConversation: async (conversationId) => {
          try {
            await chatService.clearDirectConversation(conversationId);
            removeConvFromStore(conversationId);
          } catch (error) {
            console.error(error);
            toast.error("Lỗi khi xóa cuộc trò chuyện!");
          }
        },

        deleteGroupConversation: async (conversationId) => {
          try {
            await chatService.deleteGroupConversation(conversationId);
            removeConvFromStore(conversationId);
          } catch (error) {
            console.error(error);
            toast.error("Lỗi khi xóa nhóm!");
          }
        },

        leaveConversation: async (conversationId) => {
          try {
            await chatService.leaveConversation(conversationId);
            removeConvFromStore(conversationId);
          } catch (error) {
            console.error(error);
            toast.error("Lỗi khi rời nhóm!");
          }
        },

        updateGroupProfile: async (conversationId, payload) => {
          try {
            await chatService.updateGroupProfile(conversationId, payload);
          } catch (error) {
            console.error(error);
            toast.error("Lỗi khi cập nhật thông tin nhóm!");
          }
        },

        onConversationDeleted: (data) => {
          const conversationId = data?.conversationId;
          if (!conversationId) return;
          removeConvFromStore(conversationId);
        },

        onParticipantAdded: (data) => {
          const { conversationId, participant, userInfo, systemMessage } = data || {};
          if (!conversationId || !participant?._id) return;

          // Nếu conversation chưa có trong list (user vừa được add, hoặc trước đó bị filter),
          // thì refetch conversations để tự add vào đầu list theo sort của BE.
          const currentUserId = useAuthStore.getState().user?._id;
          if (currentUserId && participant._id === currentUserId) {
            const existsInList = get().conversations.some((c) => c._id === conversationId);
            if (!existsInList) {
              void get().getConversations();
              return;
            }
          }

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

          const currentUserId = useAuthStore.getState().user?._id;
          if (currentUserId && participantId === currentUserId) {
            // User bị kick: KHÔNG remove khỏi list (chỉ đóng băng + chặn thao tác). Refresh sẽ tự loại do BE filter.
            set((prev) => {
              const idx = prev.conversations.findIndex((c) => c._id === conversationId);
              if (idx === -1) return prev;

              const conv = prev.conversations[idx];
              const frozenLastMessage = systemMessage
                ? {
                  _id: systemMessage._id,
                  content: systemMessage.content ?? '',
                  senderId: systemMessage.senderId,
                  type: 'system' as const,
                  systemType: 'USER_REMOVED' as const,
                  createdAt: systemMessage.createdAt,
                }
                : (conv.lastMessage ? { ...conv.lastMessage, type: 'system' as const, systemType: 'USER_REMOVED' as const } : conv.lastMessage);

              const updatedParticipants = conv.participants.map((p) =>
                p._id === participantId ? { ...p, status: 'LEFT' as const } : p
              );

              const updatedConv = {
                ...conv,
                participants: updatedParticipants,
                lastMessage: frozenLastMessage,
                lastMessageAt: systemMessage?.createdAt ?? conv.lastMessageAt,
                unreadCounts: currentUserId && conv.unreadCounts
                  ? { ...conv.unreadCounts, [currentUserId]: 0 }
                  : conv.unreadCounts,
              };

              const convMessages = prev.messages?.[conversationId];
              const updatedMessages = systemMessage
                ? {
                  ...prev.messages,
                  [conversationId]: convMessages
                    ? {
                      ...convMessages,
                      items: [...convMessages.items, systemMessage],
                    }
                    : {
                      hasMore: false,
                      nextCursor: null,
                      items: [systemMessage],
                    },
                }
                : prev.messages;

              const updatedConversations = [
                updatedConv,
                ...prev.conversations.filter((_, i) => i !== idx),
              ];

              return {
                ...prev,
                messages: updatedMessages,
                conversations: updatedConversations,
                activeConversation:
                  prev.activeConversationId === conversationId ? updatedConv : prev.activeConversation,
              };
            });
            return;
          }

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

        onParticipantLeft: (data) => {
          const { conversationId, participantId, systemMessage } = data || {};
          if (!conversationId || !participantId) return;

          const currentUserId = useAuthStore.getState().user?._id;
          if (currentUserId && participantId === currentUserId) {
            removeConvFromStore(conversationId);
            return;
          }

          // Member khác rời nhóm: cập nhật status + append system message (tương tự removed)
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

        onGroupProfileUpdated: (data) => {
          const { conversationId, group, systemMessages } = data || {};
          if (!conversationId) return;

          set((prev) => {
            const idx = prev.conversations.findIndex((c) => c._id === conversationId);
            if (idx === -1) return prev;

            const conv = prev.conversations[idx];
            const updatedConv = {
              ...conv,
              group: {
                ...conv.group,
                ...(group ?? {}),
              },
            };

            const msgs = systemMessages?.filter(Boolean) ?? [];
            const last = msgs[msgs.length - 1];
            if (last) {
              updatedConv.lastMessage = {
                _id: last._id,
                content: last.content ?? '',
                senderId: last.senderId,
                type: last.type,
                systemType: last.systemType,
                createdAt: last.createdAt,
              };
              updatedConv.lastMessageAt = last.createdAt;
            }

            const prevConvMessages = prev.messages?.[conversationId];
            const updatedMessages =
              msgs.length
                ? {
                  ...prev.messages,
                  [conversationId]: prevConvMessages
                    ? {
                      ...prevConvMessages,
                      items: [...prevConvMessages.items, ...msgs],
                    }
                    : {
                      hasMore: false,
                      nextCursor: null,
                      items: msgs,
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
            replyingTo: null,
            loading: false,
            messageSearchResults: [],
            messageSearchKeyword: "",
            messageSearchNextCursor: null,
            messageSearchTotal: 0,
            messageSearchLoading: false,
            highlightedMessageId: null,
            currentSearchIndex: 0,
          });
        },
      });
    },
    {
      name: "chat-storage",
      partialize: (state) => ({
        conversations: state.conversations,
      }),
    }
  )
);
