import { useEffect, useRef, useState } from 'react';
import { SidebarManagerTrigger } from '../ui/sidebar.tsx';
import { Separator } from '../ui/separator.tsx';
import { useChatStore } from '../../stores/useChatStore.ts';
import { OnlineAvatar } from '../avatars/avatar.tsx';
import { GroupAvatar } from '../avatars/group-avatar.tsx';
import { ChevronDown, ChevronUp, Search, X } from 'lucide-react';
import { Input } from '../ui/input.tsx';
import { Button } from '../ui/button.tsx';

export const ChatWindowHeader = () => {
  const {
    activeConversation,
    getDefaultGroupName,
    users,
    searchMessagesInConversation,
    clearMessageSearch,
    navigateMessageSearchResult,
    messageSearchLoading,
    messageSearchTotal,
    currentSearchIndex,
    activeConversationId,
  } = useChatStore();

  const [searchOpen, setSearchOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) {
      inputRef.current?.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    if (!activeConversation) {
      setSearchOpen(false);
      setInputValue('');
    }
  }, [activeConversation]);

  useEffect(() => {
    if (!searchOpen || !activeConversationId) return;
    const t = window.setTimeout(() => {
      const q = inputValue.trim();
      if (q) {
        void searchMessagesInConversation(activeConversationId, q);
      } else {
        clearMessageSearch();
      }
    }, 500);
    return () => window.clearTimeout(t);
  }, [inputValue, searchOpen, activeConversationId, searchMessagesInConversation, clearMessageSearch]);

  const handleCloseSearch = () => {
    setSearchOpen(false);
    setInputValue('');
    clearMessageSearch();
  };

  if (!activeConversation)
    return (
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4">
          <SidebarManagerTrigger name="left" className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
        </div>
      </header>
    );

  return (
    <header className="flex min-h-16 shrink-0 items-center gap-2 border-b justify-between px-2 py-2 sm:px-4">
      {searchOpen ? (
        <div className="flex w-full min-w-0 items-center gap-1 sm:gap-2">
          <SidebarManagerTrigger name="left" className="-ml-1 shrink-0" />
          <Separator orientation="vertical" className="mr-1 data-[orientation=vertical]:h-4 shrink-0" />
          <Input
            ref={inputRef}
            className="h-9 min-w-0 flex-1"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Tìm trong cuộc trò chuyện..."
            aria-label="Tìm tin nhắn"
          />
          <span className="text-muted-foreground shrink-0 text-xs tabular-nums sm:text-sm">
            {messageSearchLoading && !messageSearchTotal ? (
              '…'
            ) : messageSearchTotal > 0 ? (
              `${currentSearchIndex + 1}/${messageSearchTotal}`
            ) : (
              '0/0'
            )}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 size-8"
            aria-label="Kết quả trước"
            disabled={messageSearchLoading || messageSearchTotal === 0}
            onClick={() => void navigateMessageSearchResult('prev')}
          >
            <ChevronUp className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 size-8"
            aria-label="Kết quả sau"
            disabled={messageSearchLoading || messageSearchTotal === 0}
            onClick={() => void navigateMessageSearchResult('next')}
          >
            <ChevronDown className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 size-8"
            aria-label="Đóng tìm kiếm"
            onClick={handleCloseSearch}
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : (
        <>
          <div className="flex min-w-0 flex-1 items-center gap-2 px-2">
            <SidebarManagerTrigger name="left" className="-ml-1 shrink-0" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4 shrink-0" />
            {activeConversation?.type === 'direct' ? (
              <OnlineAvatar
                name={users[activeConversation?.participants[0]._id]?.displayName || ''}
                avatarUrl={users[activeConversation?.participants[0]._id]?.avtUrl}
                userId={users[activeConversation?.participants[0]._id]?._id}
              />
            ) : (
              <GroupAvatar
                avtUrl={activeConversation?.group?.avtUrl}
                participants={activeConversation?.participants}
              />
            )}
            <div className="truncate font-medium">
              {activeConversation?.type === 'direct'
                ? users[activeConversation?.participants[0]._id]?.displayName
                : activeConversation?.group?.name ||
                  getDefaultGroupName(activeConversation.participants!)}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1 pr-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label="Tìm tin nhắn"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="size-4" />
            </Button>
            <SidebarManagerTrigger name="right" />
          </div>
        </>
      )}
    </header>
  );
};
