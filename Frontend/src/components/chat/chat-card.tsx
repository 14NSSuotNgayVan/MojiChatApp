import type { Conversation } from "../../types/chat.ts";
import { OnlineAvatar } from "../avatar.tsx";
import { GroupAvatar } from "../group-avatar.tsx";
import { cn, fromNow } from "../../lib/utils.ts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu.tsx";
import { BellOff, Check, MoreHorizontal } from "lucide-react";
import { useIsMobile } from "../../hooks/use-mobile.ts";
import { useChatStore } from "../../stores/useChatStore.ts";
import { useAuthStore } from "../../stores/useAuthStore.ts";

interface ChatCardProps {
  conversation: Conversation;
  isActive: boolean;
}
export const ChatCard = ({ conversation, isActive }: ChatCardProps) => {
  const isMobile = useIsMobile();
  const { setActiveConversation, getMessages, getDefaultGroupName } =
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

  const handleClickConversation = () => {
    getMessages(conversationId);
    setActiveConversation(conversation);
  };

  return (
    <div
      className={cn(
        "group/item flex items-center gap-2 px-2 py-1 hover:bg-muted rounded-sm cursor-pointer",
        isActive && "bg-accent hover:bg-accent"
      )}
      onClick={handleClickConversation}
    >
      {/* left-section */}
      {type === "direct" ? (
        <OnlineAvatar
          name={participants[0]?.displayName || ""}
          avatarUrl={participants[0]?.avtUrl}
          isOnline
        />
      ) : (
        <GroupAvatar avtUrl={group?.avtUrl} participants={participants} />
      )}

      {/* center-section */}
      <div className="space-y-1 w-full">
        <div className="font-medium truncate text-sm">
          {type === "direct"
            ? participants[0]?.displayName
            : group?.name || getDefaultGroupName(participants)}
        </div>
        {!!lastMessage ? (
          <div
            className={cn(
              "text-muted-foreground text-xs",
              !!unreadCounts?.[user?._id!] && "text-[unset]"
            )}
          >
            {lastMessage?.senderId === user?._id
              ? "Bạn"
              : lastMessage?.senderName}
            : {lastMessage?.content}
          </div>
        ) : (
          <div className="h-4"></div>
        )}
      </div>

      {/* right-section */}
      <div className="space-y-2 flex flex-col items-end shrink-0">
        {!!lastMessageAt && (
          <div className="text-muted-foreground text-xs">
            {fromNow(lastMessageAt)}
          </div>
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
                side={isMobile ? "bottom" : "right"}
                align={isMobile ? "end" : "start"}
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
              {unreadCounts?.[user?._id!] || ""}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
