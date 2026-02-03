import { useEffect, useMemo } from 'react';
import { useChatStore } from '../../stores/useChatStore.ts';
import type { MessageGroup } from '../../types/chat.ts';
import { ChatEmptyMessageWelcome } from './chat-empty-message-welcome.tsx';

import { OtherMessageGroup, OwnerMessageGroup } from './message.tsx';
import { useChatScroll } from '../../hooks/use-chat-scroll.ts';
import { useAuthStore } from '../../stores/useAuthStore.ts';
import { ArrowDown } from 'lucide-react';
import { Button } from '../ui/button.tsx';

export const ChatWindowInset = () => {
  const {
    messages,
    activeConversationId,
    messageLoading,
    activeConversation,
    getGroupMessages,
    getMessages,
    seenMessage,
    users,
  } = useChatStore();
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

  const messageGroups = useMemo(() => getGroupMessages(items), [items, getGroupMessages]);

  if (items?.length === 0)
    return (
      <ChatEmptyMessageWelcome
        friendName={users[activeConversation!.participants[0]._id].displayName!}
      />
    );

  return (
    <div className="h-full overflow-y-auto text-base select-none" ref={scrollRef}>
      <div className="flex flex-col gap-4 p-4" ref={scrollContentRef}>
        {messageLoading && (
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
        {messageGroups?.map((group: MessageGroup) =>
          group.isOwner ? (
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
                <div className="bg-red-500 text-xs px-1 rounded-full text-white">
                  {activeConversation.unreadCounts?.[user._id]}
                </div>
              </>
            )}
            <Button asChild variant="ghost" className="transition-colors size-6 p-1 rounded-full">
              <ArrowDown />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
