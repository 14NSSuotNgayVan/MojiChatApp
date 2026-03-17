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
import { Button } from '@/components/ui/button.tsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog.tsx';
import { Input } from '@/components/ui/input.tsx';
import Loading from '@/components/ui/loading.tsx';
import { debounce, getNormalizeString } from '@/lib/utils.ts';
import { ChevronLeft, MoreHorizontal, SearchIcon, UserPlus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { friendService } from '@/services/friendService.ts';
import type { User } from '@/types/user.ts';

type Props = {
  onReturn: () => void;
};
const ParticipantManagement = ({ onReturn }: Props) => {
  const { activeConversation, users, addParticipant, removeParticipant, updateParticipantRole } =
    useChatStore();
  const { user } = useAuthStore();
  const currentUserRole = activeConversation?.participants.find((p) => p._id === user?._id)?.role;
  const { isMobile } = useSidebar();
  const participants = useMemo(
    () =>
      activeConversation?.participants
        .filter((p) => p.status !== 'LEFT')
        .map((p) => ({
          ...p,
          ...users[p._id],
          addedBy: p?.addedBy ? users?.[p.addedBy] : undefined,
        })),
    [activeConversation, users]
  );

  const participantIds = useMemo(
    () => new Set((participants ?? []).map((p) => p._id)),
    [participants]
  );

  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [searchUsers, setSearchUsers] = useState<User[]>([]);

  const handleSearch = debounce((e) => {
    setKeyword(getNormalizeString(e?.target?.value));
  }, 400);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!openAddDialog || !keyword?.trim()) return;
      setLoading(true);
      try {
        const res = await friendService.getFriends({ keyword });
        const items = (res?.friends ?? []).filter((u: User) => !participantIds.has(u._id));
        setSearchUsers(items);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [keyword, openAddDialog, participantIds]);

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
          {currentUserRole === 'ADMIN' && (
            <Button
              variant="ghost"
              size="icon"
              className="ml-2"
              onClick={() => setOpenAddDialog(true)}
              aria-label="Thêm thành viên"
            >
              <UserPlus className="size-4" />
            </Button>
          )}
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
                        <DropdownMenuItem
                          onClick={() => {
                            if (!activeConversation?._id) return;
                            updateParticipantRole(activeConversation._id, p._id, 'ADMIN');
                          }}
                        >
                          <span>Trao quyền quản trị viên</span>
                        </DropdownMenuItem>
                      )}
                      {p.role === 'ADMIN' && (
                        <DropdownMenuItem
                          onClick={() => {
                            if (!activeConversation?._id) return;
                            updateParticipantRole(activeConversation._id, p._id, 'MEMBER');
                          }}
                        >
                          <span>Xóa quyền quản trị viên</span>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem>
                        <span
                          onClick={() => {
                            if (!activeConversation?._id) return;
                            removeParticipant(activeConversation._id, p._id);
                          }}
                        >
                          Xóa khỏi nhóm
                        </span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog
        open={openAddDialog}
        onOpenChange={(open) => {
          setOpenAddDialog(open);
          if (!open) {
            setKeyword('');
            setSearchUsers([]);
          }
        }}
      >
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Thêm thành viên</DialogTitle>
          </DialogHeader>
          <div className="relative grow">
            <Input
              className="peer h-8 ps-8 pe-2 text-sm"
              placeholder={'Tìm kiếm...'}
              type="search"
              onChange={handleSearch}
            />
            <div className="text-white pointer-events-none absolute flex h-full top-0 items-center justify-center ps-2 peer-disabled:opacity-50">
              <SearchIcon className="text-primary" size={16} />
            </div>
          </div>

          {!keyword?.trim() ? (
            <p className="text-muted-foreground text-xs text-center">
              Nhập tên hoặc email để tìm người dùng rồi thêm vào nhóm...
            </p>
          ) : loading ? (
            <div className="flex justify-center items-center">
              <div className="w-4">
                <Loading />
              </div>
            </div>
          ) : !searchUsers.length ? (
            <p className="text-primary text-center text-xs">Không tìm thấy người phù hợp.</p>
          ) : (
            <div className="max-h-[50vh] overflow-y-auto">
              {searchUsers.map((u) => (
                <div
                  key={u._id}
                  className="group flex p-2 items-center justify-between rounded-sm gap-2 hover:bg-muted"
                >
                  <div className="flex items-center gap-2">
                    <Avatar name={u.displayName} avatarUrl={u.avtUrl} />
                    <div className="flex flex-col">
                      <p className="text-sm">{u.displayName}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      if (!activeConversation?._id) return;
                      addParticipant(activeConversation._id, u._id);
                    }}
                  >
                    Thêm
                  </Button>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
export default ParticipantManagement;
