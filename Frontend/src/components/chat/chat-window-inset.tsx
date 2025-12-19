import { useMemo } from "react";
import { useChatStore } from "../../stores/useChatStore.ts";
import type { MessageGroup } from "../../types/chat.ts";
import { ChatEmptyMessageWelcome } from "./chat-empty-message-welcome.tsx";

import { FriendMessageGroup, OwnerMessageGroup } from "./message.tsx";
import { useChatScroll } from "../../hooks/use-chat-scroll.ts";
import Loading from "../ui/loading.tsx";

export const ChatWindowInset = () => {
  const {
    messages,
    activeConversationId,
    messageLoading,
    activeConversation,
    getGroupMessages,
    getMessages,
  } = useChatStore();
  const currentMessages = messages?.[activeConversationId!]; // Đảm bảo luôn có vì đã check từ component cha

  const { items, hasMore } = currentMessages;

  const { isAtBottom, scrollRef, scrollToBottom } = useChatScroll(items, () =>
    getMessages(activeConversationId!, true)
  );

  const messageGroups = useMemo(() => getGroupMessages(items), [items]);

  if (items?.length === 0)
    return (
      <ChatEmptyMessageWelcome
        friendName={activeConversation?.participants[0]?.displayName!}
      />
    );

  return (
    <div
      className="flex flex-1 flex-col gap-4 p-4 overflow-y-auto text-lg select-none"
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
    </div>
  );
};
