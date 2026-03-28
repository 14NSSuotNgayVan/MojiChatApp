import { Avatar } from '@/components/avatars/avatar.tsx';
import { OthersProfileDialog } from '@/components/dialogs/others-profile-dialog.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog.tsx';
import { Input } from '@/components/ui/input.tsx';
import Loading from '@/components/ui/loading.tsx';
import { cn, debounce, getNormalizeString } from '@/lib/utils.ts';
import { chatService } from '@/services/chatService.ts';
import { fileService } from '@/services/fileService.ts';
import { friendService } from '@/services/friendService.ts';
import { useChatStore } from '@/stores/useChatStore.ts';
import { Check, ImagePlus, SearchIcon, Send, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

type NotUser = {
  _id: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  avtUrl: string | null;
};

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const AddChatDialog = ({ open, onOpenChange }: DialogProps) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [openProfileDialog, setOpenProfileDialog] = useState<boolean>(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [mode, setMode] = useState<'direct' | 'group'>('direct');
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
  const [groupName, setGroupName] = useState<string>('');
  const [groupAvatarUrl, setGroupAvatarUrl] = useState<string>('');
  const [groupAvatarUploading, setGroupAvatarUploading] = useState<boolean>(false);
  const [filter, setFilter] = useState({
    keyword: '',
    isMore: false,
    size: 10,
  });
  const [users, setUsers] = useState<NotUser[]>([]);

  const handleSearch = debounce((e) => {
    setFilter((prev) => ({ ...prev, keyword: getNormalizeString(e?.target?.value) }));
  }, 500);

  const handleGetFriends = async () => {
    setLoading(true);
    try {
      const res = await friendService.getFriends({ keyword: filter.keyword.trim() });
      setUsers(res?.friends);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      setUsers([]);
      setMode('direct');
      setSelectedMemberIds(new Set());
      setGroupName('');
      setGroupAvatarUrl('');
      setGroupAvatarUploading(false);
      setFilter({
        keyword: '',
        isMore: false,
        size: 10,
      });
    }
  };

  const handleChat = async (userId: string) => {
    try {
      const { setActiveConversation, getMessages, conversations } = useChatStore.getState();

      const res = await chatService.createConversation({
        type: 'direct',
        memberIds: [userId],
      });

      const convId = conversations.findIndex((item) => item?._id === res.conversation._id);
      if (convId == -1) {
        useChatStore.setState((state) => ({
          ...state,
          conversations: [res.conversation, ...state.conversations],
        }));
      }
      const success = await getMessages(res?.conversation._id);
      setActiveConversation(success ? res.conversation : null);
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    }
  };

  const toggleSelectMember = (userId: string) => {
    setSelectedMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleCreateGroup = async () => {
    try {
      const memberIds = Array.from(selectedMemberIds);
      if (memberIds.length < 2) return;
      if (groupAvatarUploading) return;

      const { setActiveConversation, getMessages, conversations } = useChatStore.getState();

      const res = await chatService.createConversation({
        type: 'group',
        name: groupName.trim() || undefined,
        memberIds,
        avtUrl: groupAvatarUrl.trim() || undefined,
      });

      const convIdx = conversations.findIndex((item) => item?._id === res.conversation._id);
      if (convIdx === -1) {
        useChatStore.setState((state) => ({
          ...state,
          conversations: [res.conversation, ...state.conversations],
        }));
      }

      const success = await getMessages(res.conversation._id);
      setActiveConversation(success ? res.conversation : null);
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handlePickGroupAvatar: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      setGroupAvatarUploading(true);
      const res = await fileService.uploadAvatar(file);
      if (res?.secure_url) {
        setGroupAvatarUrl(res.secure_url);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setGroupAvatarUploading(false);
    }
  };

  useEffect(() => {
    if (open) handleGetFriends();
  }, [filter.keyword, open]);

  return (
    <>
      {currentUserId && (
        <OthersProfileDialog
          open={openProfileDialog}
          onOpenChange={(open) => setOpenProfileDialog(open)}
          userId={currentUserId}
          closeParent={() => {
            onOpenChange(false);
          }}
        />
      )}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Cuộc trò chuyện mới</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="primary"
              className={cn(
                mode === 'direct' &&
                  'bg-secondary/50 text-primary dark:bg-accent/50 dark:text-primary',
                'hover:bg-secondary/50'
              )}
              size="sm"
              onClick={() => setMode('direct')}
            >
              Trực tiếp
            </Button>
            <Button
              variant="primary"
              className={cn(
                mode === 'group' &&
                  'bg-secondary/50 text-primary dark:bg-accent/50 dark:text-primary',
                'hover:bg-secondary/50'
              )}
              size="sm"
              onClick={() => setMode('group')}
            >
              Nhóm
            </Button>
          </div>

          {mode === 'group' && (
            <div className="flex flex-col gap-2">
              <Input
                className="h-8 text-sm"
                placeholder="Tên nhóm (không bắt buộc)"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="group-avatar-input"
                  onChange={handlePickGroupAvatar}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={groupAvatarUploading}
                  onClick={() => document.getElementById('group-avatar-input')?.click()}
                >
                  <ImagePlus className="w-4 h-4" />
                  {groupAvatarUploading ? 'Đang upload...' : 'Chọn avatar'}
                </Button>
                <Input
                  className="h-8 text-sm flex-1"
                  placeholder="Avatar URL (không bắt buộc)"
                  value={groupAvatarUrl}
                  onChange={(e) => setGroupAvatarUrl(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  Đã chọn: {selectedMemberIds.size}{' '}
                </p>
                <Button
                  size="sm"
                  variant="primary"
                  disabled={selectedMemberIds.size < 2 || groupAvatarUploading}
                  onClick={handleCreateGroup}
                >
                  Tạo nhóm
                </Button>
              </div>
              <span className="text-xs text-muted-foreground text-center">
                Cần ít nhất 2 thành viên để tạo nhóm
              </span>
            </div>
          )}
          <div className="relative grow">
            <Input
              id={`input-search`}
              className="peer h-8 ps-8 pe-2 text-sm"
              placeholder={'Tìm kiếm...'}
              type="search"
              onChange={handleSearch}
            />
            <div className="text-white pointer-events-none absolute flex h-full top-0 items-center justify-center ps-2 peer-disabled:opacity-50">
              <SearchIcon className="text-primary" size={16} />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            {loading ? (
              <div className="flex justify-center items-center">
                <div className="w-4">
                  <Loading />
                </div>
              </div>
            ) : (
              <>
                {filter?.keyword?.trim() ? (
                  <>
                    <p className="text-foreground text-sm">Kết quả</p>
                    {!users?.length ? (
                      <p className="text-primary text-center text-xs">
                        Không tìm thấy bạn bè phù hợp.
                      </p>
                    ) : (
                      users?.map((user) => (
                        <div
                          className="group flex p-2 items-center justify-between rounded-sm gap-2 hover:bg-muted"
                          onClick={() => {
                            if (mode === 'group') {
                              toggleSelectMember(user._id);
                              return;
                            }
                            setCurrentUserId(user._id);
                            setOpenProfileDialog(true);
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <Avatar name={user.displayName} avatarUrl={user?.avtUrl} />
                            <p className="">{user.displayName}</p>
                          </div>
                            <Check className={cn("size-4 hidden group-hover:block",(mode === 'group' && selectedMemberIds.has(user._id)) ? 'block':'')} />
                          {mode === 'direct' && (
                            <Button
                              variant="primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleChat(user._id);
                              }}
                            >
                              <Send />
                            </Button>
                          )}
                        </div>
                      ))
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-muted-foreground text-xs text-center">
                      Nhập tên, email hoặc số điện thoại của người bạn muốn nhắn tin...
                    </p>
                    <p className="text-foreground text-sm">Gợi ý</p>
                    {users?.map((user) => (
                      <div
                        className="group flex p-2 items-center justify-between rounded-sm gap-2 dark:hover:bg-muted hover:bg-secondary/50"
                        onClick={() => {
                          if (mode === 'group') {
                            toggleSelectMember(user._id);
                            return;
                          }
                          setCurrentUserId(user._id);
                          setOpenProfileDialog(true);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <Avatar name={user.displayName} avatarUrl={user?.avtUrl} />
                          <p className="">{user.displayName}</p>
                        </div>
                        <Check className={cn("size-4 hidden group-hover:block",(mode === 'group' && selectedMemberIds.has(user._id)) ? 'block':'')} />
                        {mode === 'direct' && (
                          <Button
                            variant="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleChat(user._id);
                            }}
                          >
                            <Send />
                          </Button>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
