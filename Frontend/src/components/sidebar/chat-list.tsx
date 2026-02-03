import { useChatStore } from '@/stores/useChatStore.ts';
import { ChatCardSkeleton } from '@/components/chat/chat-card-skeleton.tsx';
import { ChatCard, ChatCardSearch } from '@/components/chat/chat-card.tsx';

export const ChatList = () => {
  const { conversations, loading, activeConversationId, searchedConversations, isSearching } =
    useChatStore();

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

  if (isSearching) {
    return (
      <div className="grow flex flex-col gap-1 overflow-y-auto w-full px-0.5">
        {searchedConversations?.length ? (
          searchedConversations.map((conv) => (
            <ChatCardSearch
              key={conv._id}
              isActive={conv._id === activeConversationId}
              conversation={conv}
            />
          ))
        ) : (
          <p className="text-center text-sm text-muted-foreground">Không có kết quả phù hợp.</p>
        )}
      </div>
    );
  }

  return (
    <div className="grow flex flex-col gap-1 overflow-y-auto w-full px-1">
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
