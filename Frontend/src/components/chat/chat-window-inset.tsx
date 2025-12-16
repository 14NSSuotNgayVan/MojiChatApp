import { useEffect, useRef } from "react";
import { useChatStore } from "../../stores/useChatStore.ts";
import type { Message, MessageGroup } from "../../types/chat.ts";
import { ChatEmptyMessageWelcome } from "./chat-empty-message-welcome.tsx";
import { ChatInsertSkeleton } from "./chat-insert-skeleton.tsx";
import { FriendMessageGroup, OwnerMessageGroup } from "./message.tsx";

export const ChatWindowInset = () => {
  const {
    messages,
    activeConversationId,
    messageLoading,
    activeConversation,
    getGroupMessages,
  } = useChatStore();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const { hasMore, items, nextCursor } = messages[activeConversationId!];
  const messageGroups = getGroupMessages(items);

  useEffect(() => {
    const scrollBox = scrollRef.current;
    if (activeConversationId && scrollBox && items?.length) {
      scrollBox.scrollTop = scrollBox.scrollHeight;
    }
  }, [activeConversationId]);

  if (messageLoading) return <ChatInsertSkeleton />;

  if (items?.length === 0)
    return (
      <ChatEmptyMessageWelcome
        friendName={activeConversation?.participants[0]?.displayName!}
      />
    );

  return (
    <div
      className="flex flex-1 flex-col gap-4 p-4 overflow-scroll text-lg select-none"
      ref={scrollRef}
    >
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
    </div>
  );
};
