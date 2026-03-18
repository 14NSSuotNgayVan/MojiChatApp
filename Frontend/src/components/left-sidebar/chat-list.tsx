import { useChatStore } from '@/stores/useChatStore.ts';
import { ChatCardSkeleton } from '@/components/chat/chat-card-skeleton.tsx';
import { ChatCard, ChatCardSearch } from '@/components/left-sidebar/chat-card';
import { useEffect } from 'react';

export const ChatList = () => {
  const { conversations, loading, activeConversationId, searchedConversations, isSearching, sidebarTab, hiddenConversations, hiddenLoading, getHiddenConversations } =
    useChatStore();

  useEffect(() => {
    if (sidebarTab === 'hidden' && !isSearching) {
      void getHiddenConversations();
    }
  }, [getHiddenConversations, isSearching, sidebarTab]);

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

  if (sidebarTab === 'hidden') {
    if (hiddenLoading) {
      return (
        <>
          <ChatCardSkeleton />
          <ChatCardSkeleton />
          <ChatCardSkeleton />
          <ChatCardSkeleton />
        </>
      );
    }

    return (
      <div className="grow flex flex-col gap-1 overflow-y-auto w-full px-1">
        {hiddenConversations?.length ? (
          hiddenConversations.map((conv) => (
            <ChatCard
              key={conv._id}
              isActive={conv._id === activeConversationId}
              conversation={conv}
              mode="hidden"
            />
          ))
        ) : (
          <p className="text-center text-sm text-muted-foreground">Không có cuộc trò chuyện nào đã ẩn.</p>
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
