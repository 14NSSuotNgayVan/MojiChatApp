import { useChatStore } from '@/stores/useChatStore.ts';
import { ChatCardSkeleton } from '@/components/chat/chat-card-skeleton.tsx';
import { ChatCard } from '@/components/chat/chat-card.tsx';

export const ChatList = () => {
  const { conversations, loading, activeConversationId } = useChatStore();

  if (loading) {
    return (
      <>
        <ChatCardSkeleton />
        <ChatCardSkeleton />
        <ChatCardSkeleton />
        <ChatCardSkeleton />
        <ChatCardSkeleton />
        <ChatCardSkeleton />
        <ChatCardSkeleton />
        <ChatCardSkeleton />
        <ChatCardSkeleton />
      </>
    );
  }
  return (
    <div className="grow flex flex-col gap-1 overflow-y-auto w-full">
      {conversations?.length ? (
        conversations.map((conv) => (
          <ChatCard
            key={conv._id}
            isActive={conv._id === activeConversationId}
            conversation={conv}
          />
        ))
      ) : (
        <></>
      )}
    </div>
  );
};
