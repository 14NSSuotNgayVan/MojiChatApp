import type { Conversation } from '../../types/chat.ts';
import { OnlineAvatar } from '../avatars/avatar.tsx';
import { GroupAvatar } from '../avatars/group-avatar.tsx';
import { cn, fromNow } from '../../lib/utils.ts';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu.tsx';
import { BellOff, Check, MoreHorizontal } from 'lucide-react';
import { useIsMobile } from '../../hooks/use-mobile.ts';
import { useChatStore } from '../../stores/useChatStore.ts';
import { useAuthStore } from '../../stores/useAuthStore.ts';
import { useSidebar } from '../ui/sidebar.tsx';

interface ChatCardProps {
  conversation: Conversation;
  isActive: boolean;
}
export const ChatCard = ({ conversation, isActive }: ChatCardProps) => {
  const isMobile = useIsMobile();
  const { setOpenMobile } = useSidebar();
  const { setActiveConversation, getMessages, getDefaultGroupName, users, messageLoading } =
    useChatStore();
  const { user } = useAuthStore();
  const {
    _id: conversationId,
    type,
    participants,
    lastMessage,
    group,
    lastMessageAt,
    unreadCounts,
  } = conversation;

  const handleClickConversation = async () => {
    if (messageLoading) return;
    setOpenMobile(false);
    const success = await getMessages(conversationId);
    setActiveConversation(success ? conversation : null);
  };

  return (
    <div
      className={cn(
        'group/item flex items-center w-full gap-2 px-2 py-2 hover:bg-muted rounded-sm cursor-pointer',
        isActive && 'bg-accent hover:bg-accent'
      )}
      onClick={handleClickConversation}
    >
      {/* left-section */}
      {type === 'direct' ? (
        <div className="flex w-12 h-12 items-center justify-center shrink-0">
          <OnlineAvatar
            name={users[participants[0]._id]?.displayName || ''}
            avatarUrl={users[participants[0]._id]?.avtUrl}
            userId={participants[0]._id}
          />
        </div>
      ) : (
        <GroupAvatar avtUrl={group?.avtUrl} participants={participants} />
      )}

      {/* center-section */}
      <div className="space-y-1 flex-1">
        <div className="font-medium truncate text-sm">
          {type === 'direct'
            ? users[participants[0]._id]?.displayName
            : group?.name || getDefaultGroupName(participants)}
        </div>
        {!!lastMessage && user ? (
          <div
            className={cn(
              'text-muted-foreground text-xs',
              !!unreadCounts?.[user._id] && 'text-[unset]'
            )}
          >
            {lastMessage?.senderId === user?._id ? 'Bạn' : users[lastMessage.senderId]?.displayName}
            : {lastMessage?.content}
          </div>
        ) : (
          <div className="h-4"></div>
        )}
      </div>

      {/* right-section */}
      <div className="space-y-2 flex flex-col items-end flex-1">
        {!!lastMessageAt && (
          <div className="text-muted-foreground text-xs">{fromNow(lastMessageAt)}</div>
        )}
        <div className="h-4 relative">
          <div className="opacity-0 group-hover/item:opacity-100">
            <DropdownMenu>
              <DropdownMenuTrigger className="w-4 h-4 hover:bg-primary dark:hover:bg-neutral-700 rounded-sm">
                <MoreHorizontal className="size-full" />
                <span className="sr-only">More</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-48"
                side={isMobile ? 'bottom' : 'right'}
                align={isMobile ? 'end' : 'start'}
              >
                <DropdownMenuItem>
                  <BellOff />
                  <span>Tắt thông báo</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Check />
                  <span>Đánh dấu là đã đọc</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <span>Ẩn cuộc trò chuyện</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="block group-hover/item:hidden absolute top-0 right-0">
            <div className="bg-red-500 text-xs px-1 rounded-full text-white">
              {user && unreadCounts?.[user._id] ? unreadCounts?.[user._id] : ''}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
