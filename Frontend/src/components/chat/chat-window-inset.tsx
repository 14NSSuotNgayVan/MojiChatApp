import { useEffect, useMemo } from "react";
import { useChatStore } from "../../stores/useChatStore.ts";
import type { MessageGroup } from "../../types/chat.ts";
import { ChatEmptyMessageWelcome } from "./chat-empty-message-welcome.tsx";

import { FriendMessageGroup, OwnerMessageGroup } from "./message.tsx";
import { useChatScroll } from "../../hooks/use-chat-scroll.ts";
import Loading from "../ui/loading.tsx";
import { useAuthStore } from "../../stores/useAuthStore.ts";
import { ArrowDown } from "lucide-react";
import { Button } from "../ui/button.tsx";

export const ChatWindowInset = () => {
  const {
    messages,
    activeConversationId,
    messageLoading,
    activeConversation,
    getGroupMessages,
    getMessages,
    seenMessage,
  } = useChatStore();
  const currentMessages = messages?.[activeConversationId!]; // Đảm bảo luôn có vì đã check từ component cha
  const { user } = useAuthStore();
  const { items } = currentMessages;

  const { isAtBottom, scrollRef, scrollToBottom } = useChatScroll(
    items,
    () => getMessages(activeConversationId!, true),
    activeConversationId
  );

  useEffect(() => {
    if (isAtBottom) seenMessage();
  }, [isAtBottom, activeConversation?.lastMessage?._id]);

  const messageGroups = useMemo(() => getGroupMessages(items), [items]);

  if (items?.length === 0)
    return (
      <ChatEmptyMessageWelcome
        friendName={activeConversation?.participants[0]?.displayName!}
      />
    );

  return (
    <div
      className="flex flex-1 flex-col gap-4 p-4 overflow-y-auto text-base select-none"
      ref={scrollRef}
    >
      {messageLoading && (
        <div className="flex justify-center">
          <Loading />
        </div>
      )}
      {messageGroups?.map((group: MessageGroup) =>
        group.isOwner ? (
          <OwnerMessageGroup
            group={group}
            key={group.senderId + group.startTime}
          />
        ) : (
          <FriendMessageGroup
            group={group}
            key={group.senderId + group.startTime}
          />
        )
      )}
      {!isAtBottom && (
        <div
          className="flex absolute gap-2 items-center p-2 bottom-16 rounded-full left-1/2 -translate-x-1/2 bg-accent cursor-pointer"
          onClick={scrollToBottom}
        >
          {!!activeConversation?.unreadCounts?.[user?._id!] && (
            <>
              <p className="truncate max-w-3xs pl-1">
                {activeConversation.lastMessage?.content}
              </p>
              <div className="bg-red-500 text-xs px-1 rounded-full text-white">
                {activeConversation.unreadCounts?.[user?._id!]}
              </div>
            </>
          )}
          <Button
            asChild
            variant="ghost"
            className="bg-background transition-colors size-10 p-2 rounded-full"
          >
            <ArrowDown />
          </Button>
        </div>
      )}
    </div>
  );
};
