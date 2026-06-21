import { useChatStore } from '@/stores/useChatStore.ts';
import { useFriendStore } from '@/stores/useFriendStore.ts';
import { ChatCardSkeleton } from '@/components/chat/chat-card-skeleton.tsx';
import { ChatCard, ChatCardSearch } from '@/components/left-sidebar/chat-card';
import { SidebarEmptyState } from '@/components/left-sidebar/sidebar-empty-state';
import { useEffect, useState } from 'react';
import { MessageCirclePlus, SearchX, UserPlus, EyeOff } from 'lucide-react';
import { AddFriendDialog } from '@/components/dialogs/add-friend-dialog.tsx';
import { AddChatDialog } from '@/components/dialogs/add-chat-dialog.tsx';

export const ChatList = () => {
  const {
    conversations,
    loading,
    activeConversationId,
    searchedConversations,
    isSearching,
    sidebarTab,
    hiddenConversations,
    hiddenLoading,
    getHiddenConversations,
  } = useChatStore();
  const { friendsCount } = useFriendStore();
  const [openAddFriendDialog, setOpenAddFriendDialog] = useState(false);
  const [openAddChatDialog, setOpenAddChatDialog] = useState(false);

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
      <>
        <AddFriendDialog open={openAddFriendDialog} onOpenChange={setOpenAddFriendDialog} />
        <AddChatDialog open={openAddChatDialog} onOpenChange={setOpenAddChatDialog} />
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
            <SidebarEmptyState
              icon={SearchX}
              title="Không có kết quả"
              description="Thử tìm với tên khác hoặc bỏ dấu tiếng Việt."
            />
          )}
        </div>
      </>
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
          <SidebarEmptyState
            icon={EyeOff}
            title="Chưa có cuộc trò chuyện ẩn"
            description="Các cuộc trò chuyện bạn ẩn sẽ xuất hiện ở đây. Bạn có thể hiện lại bất cứ lúc nào."
          />
        )}
      </div>
    );
  }

  return (
    <>
      <AddFriendDialog open={openAddFriendDialog} onOpenChange={setOpenAddFriendDialog} />
      <AddChatDialog open={openAddChatDialog} onOpenChange={setOpenAddChatDialog} />
      <div className="grow flex flex-col gap-1 overflow-y-auto w-full px-1">
        {conversations?.length ? (
          conversations.map((conv) => (
            <ChatCard
              key={conv._id}
              isActive={conv._id === activeConversationId}
              conversation={conv}
            />
          ))
        ) : friendsCount === 0 ? (
          <SidebarEmptyState
            icon={UserPlus}
            title="Chưa có cuộc trò chuyện"
            description="Thêm bạn bè trước để bắt đầu nhắn tin."
            actionLabel="Thêm bạn bè"
            onAction={() => setOpenAddFriendDialog(true)}
          />
        ) : (
          <SidebarEmptyState
            icon={MessageCirclePlus}
            title="Chưa có cuộc trò chuyện"
            description="Bạn đã có bạn bè — hãy tạo cuộc trò chuyện mới."
            actionLabel="Tạo cuộc trò chuyện"
            onAction={() => setOpenAddChatDialog(true)}
          />
        )}
      </div>
    </>
  );
};
