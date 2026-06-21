import { useEffect, useMemo } from 'react';
import { useCanHover } from '../../hooks/use-can-hover.ts';
import { useChatStore } from '../../stores/useChatStore.ts';
import type { MessageGroup } from '../../types/chat.ts';
import { ChatEmptyMessageWelcome } from './chat-empty-message-welcome.tsx';

import { OtherMessageGroup, OwnerMessageGroup, SystemMessage } from './message.tsx';
import { MessageActionsOverlay } from './message-actions-overlay.tsx';
import { useChatScroll } from '../../hooks/use-chat-scroll.ts';
import { useAuthStore } from '../../stores/useAuthStore.ts';
import { ArrowDown } from 'lucide-react';
import { Button } from '../ui/button.tsx';
import { UnreadBadge } from '@/components/ui/unread-badge.tsx';

export const ChatWindowInset = () => {
  const {
    messages,
    activeConversationId,
    messageLoading,
    isFetchOldMessage,
    activeConversation,
    getGroupMessages,
    getMessages,
    seenMessage,
    users,
    getDefaultGroupName,
    highlightedMessageId,
    loadMessagesUntilMessageId,
    clearNewMessageFlags,
  } = useChatStore();
  const canHover = useCanHover();
  const currentMessages = messages?.[activeConversationId!]; // Đảm bảo luôn có vì đã check từ component cha
  const { user } = useAuthStore();
  const { items } = currentMessages;

  const { isAtBottom, scrollRef, scrollToBottom, scrollContentRef } = useChatScroll(
    items,
    () => getMessages(activeConversationId!, true),
    activeConversationId
  );

  useEffect(() => {
    if (isAtBottom) seenMessage();
  }, [isAtBottom, activeConversation?.lastMessage?._id, seenMessage]);

  useEffect(() => {
    if (!highlightedMessageId || !activeConversationId) return;
    void loadMessagesUntilMessageId(activeConversationId, highlightedMessageId);
  }, [highlightedMessageId, activeConversationId, loadMessagesUntilMessageId]);

  useEffect(() => {
    if (!highlightedMessageId) return;
    const id = requestAnimationFrame(() => {
      const el = document.querySelector(
        `[data-message-id="${highlightedMessageId}"]`
      ) as HTMLElement | null;
      el?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'center',
      });
    });
    return () => cancelAnimationFrame(id);
  }, [highlightedMessageId, items]);

  useEffect(() => {
    if (!activeConversationId) return;
    const hasNew = items?.some((m) => m.isNew);
    if (!hasNew) return;
    const timer = window.setTimeout(() => clearNewMessageFlags(activeConversationId), 320);
    return () => window.clearTimeout(timer);
  }, [items, activeConversationId, clearNewMessageFlags]);

  const messageGroups = useMemo(() => getGroupMessages(items), [items, getGroupMessages]);

  if (items?.length === 0)
    return (
      <ChatEmptyMessageWelcome
        friendName={
          activeConversation?.type === 'direct'
            ? users[activeConversation.participants[0]._id]?.displayName
            : activeConversation?.group?.name ||
              getDefaultGroupName(activeConversation?.participants || [])
        }
      />
    );

  return (
    <>
      {!canHover && <MessageActionsOverlay scrollContainerRef={scrollRef} />}
      <div
        className="h-full overflow-y-auto text-base"
        ref={scrollRef}
      role="log"
      aria-label="Tin nhắn"
      aria-live="polite"
      aria-relevant="additions"
    >
      <div className="flex flex-col gap-4 p-4" ref={scrollContentRef}>
        {messageLoading && isFetchOldMessage && (
          <>
            <div className="flex w-2/3 gap-2">
              <div className="bg-muted/50 aspect-video rounded-full w-12 h-12" />
              <div className="bg-muted/50 aspect-video rounded-xl grow h-20" />
            </div>
            {/* friend message */}
            <div className="flex w-2/3 gap-2 flex-row-reverse self-end">
              <div className="bg-muted/50 aspect-video rounded-xl grow h-20" />
            </div>
            <div className="flex w-1/3 gap-2 flex-row-reverse self-end">
              <div className="bg-muted/50 aspect-video rounded-xl grow h-12" />
            </div>
            <div className="flex w-2/3 gap-2 flex-row-reverse self-end">
              <div className="bg-muted/50 aspect-video rounded-xl grow h-12" />
            </div>

            <div className="flex w-2/3 gap-2">
              <div className="bg-muted/50 aspect-video rounded-full w-12 h-12" />
              <div className="bg-muted/50 aspect-video rounded-xl grow h-20" />
            </div>
          </>
        )}
        {!(messageLoading && isFetchOldMessage) && currentMessages.nextCursor && (
          <div
            className="text-primary/70 col-span-full text-center cursor-pointer touch-manipulation active:text-primary py-2"
            onClick={() => {
              if (activeConversationId) getMessages(activeConversationId!, true);
            }}
          >
            Xem thêm
          </div>
        )}
        {messageGroups?.map((group: MessageGroup) =>
          group.messages[0]?.type === 'system' ? (
            <SystemMessage message={group.messages[0]} key={group.messages[0]._id} />
          ) : group.isOwner ? (
            <OwnerMessageGroup group={group} key={group.senderId + group.startTime} />
          ) : (
            <OtherMessageGroup group={group} key={group.senderId + group.startTime} />
          )
        )}
        {!isAtBottom && (
          <div
            className="flex absolute gap-2 items-center p-2 bottom-4 rounded-full left-1/2 -translate-x-1/2 bg-accent cursor-pointer"
            onClick={scrollToBottom}
          >
            {user && !!activeConversation?.unreadCounts?.[user._id] && (
              <>
                <p className="truncate max-w-3xs pl-1">{activeConversation.lastMessage?.content}</p>
                <UnreadBadge count={activeConversation.unreadCounts[user._id]} />
              </>
            )}
            <Button asChild variant="ghost" className="transition-colors size-6 p-1 rounded-full">
              <ArrowDown />
            </Button>
          </div>
        )}
      </div>
    </div>
    </>
  );
};
