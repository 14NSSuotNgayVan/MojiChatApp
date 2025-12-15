import { useChatStore } from "../../stores/useChatStore.ts";
import type { Message } from "../../types/chat.ts";
import { ChatEmptyMessageWelcome } from "./chat-empty-message-welcome.tsx";
import { ChatInsertSkeleton } from "./chat-insert-skeleton.tsx";
import { FriendMessage } from "./friend-message.tsx";
import { OwnerMessage } from "./owner-message.tsx";

export const ChatWindowInset = () => {
  const { messages, activeConversationId, messageLoading, activeConversation } =
    useChatStore();
  const { hasMore, items, nextCursor } = messages[activeConversationId!];

  if (messageLoading) return <ChatInsertSkeleton />;
  if (items?.length === 0)
    return (
      <ChatEmptyMessageWelcome
        friendName={activeConversation?.participants[0]?.displayName!}
      />
    );
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 overflow-scroll text-lg">
      {items?.map((message: Message) =>
        message.isOwner ? <OwnerMessage message={message} /> : <FriendMessage />
      )}
    </div>
  );
};
