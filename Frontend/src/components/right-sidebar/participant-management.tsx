import { Avatar } from '@/components/avatars/avatar.tsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';
import { useSidebar } from '@/components/ui/sidebar.tsx';
import { cn } from '@/lib/utils.ts';
import { useAuthStore } from '@/stores/useAuthStore.ts';
import { useChatStore } from '@/stores/useChatStore.ts';
import { ChevronLeft, MoreHorizontal } from 'lucide-react';

type Props = {
  onReturn: () => void;
};
const ParticipantManagement = ({ onReturn }: Props) => {
  const { activeConversation, users } = useChatStore();
  const { user } = useAuthStore();
  const currentUserRole = activeConversation?.participants.find((p) => p._id === user?._id)?.role;
  const { isMobile } = useSidebar();
  const participants = activeConversation?.participants
    .filter((p) => p.status !== 'LEFT')
    .map((p) => ({
      ...p,
      ...users[p._id],
      addedBy: p?.addedBy ? users?.[p.addedBy] : undefined,
    }));

  return (
    <>
      <div className="flex flex-col h-full select-none">
        <div className="flex px-4 h-16 items-center select-none shrink-0">
          <button
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive cursor-pointer text-muted-foreground hover:bg-accent hover:text-foreground dark:text-foreground dark:hover:bg-accent/50 dark:hover:text-primary size-7"
            onClick={onReturn}
          >
            <ChevronLeft />
          </button>
          <p className="text-center text-lg font-semibold grow">Thành viên đoạn chat</p>
        </div>
        <div className="px-2 pb-2 grow overflow-y-auto">
          {participants?.map((p) => (
            <div
              className={cn(
                'group/item flex w-full gap-2 px-2 py-2 hover:bg-accent/50 rounded-sm cursor-pointer'
              )}
            >
              <Avatar name={p?.displayName || ''} avatarUrl={p?.avtUrl} />
              <div className="flex space-y-1 flex-1 border-b border-b-accent shrink-0 items-center">
                <div className="grow">
                  <div className="font-medium truncate text-sm">
                    {p?.displayName}
                    {p.role === 'ADMIN' ? (
                      <span className="text-muted-foreground text-xs">
                        {' • '}
                        <span className="font-semibold">Quản trị viên</span>
                      </span>
                    ) : (
                      ''
                    )}
                  </div>
                  <div className={cn('text-muted-foreground text-xs truncate mb-0.5 flex gap-0.5')}>
                    <div className={'truncate max-w-1/2'}>{p?.email}</div>
                    {p.addedBy?._id && p.role !== 'ADMIN' ? (
                      <span className="text-muted-foreground text-xs">
                        {' • '}
                        <span className="font-semibold">{p.addedBy.displayName}</span> đã thêm.
                      </span>
                    ) : (
                      ''
                    )}
                  </div>
                </div>
                {p._id !== user?._id && currentUserRole === 'ADMIN' && (
                  <DropdownMenu>
                    <DropdownMenuTrigger className="w-4 h-4 hover:bg-primary dark:hover:bg-neutral-700 rounded-sm">
                      <MoreHorizontal className="size-full" />
                      <span className="sr-only">More</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="w-48"
                      side={isMobile ? 'bottom' : 'left'}
                      align={isMobile ? 'end' : 'start'}
                    >
                      {p.role !== 'ADMIN' && (
                        <DropdownMenuItem>
                          <span>Trao quyền quản trị viên</span>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem>
                        <span>Xóa khỏi nhóm</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
export default ParticipantManagement;
