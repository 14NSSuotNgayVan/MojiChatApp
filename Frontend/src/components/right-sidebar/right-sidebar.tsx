import { Avatar } from '@/components/avatars/avatar.tsx';
import { GroupAvatar } from '@/components/avatars/group-avatar.tsx';
import { OthersProfileDialog } from '@/components/dialogs/others-profile-dialog.tsx';
import { SidebarGallery } from '@/components/gallery/sidebar-gallery.tsx';
import ParticipantManagement from '@/components/right-sidebar/participant-management.tsx';
import { Button } from '@/components/ui/button.tsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { Input } from '@/components/ui/input.tsx';
import {
  SidebarContent,
  SidebarManagerTrigger,
  useSidebarManager,
} from '@/components/ui/sidebar.tsx';
import { cn } from '@/lib/utils.ts';
import { useChatStore } from '@/stores/useChatStore.ts';
import { useAuthStore } from '@/stores/useAuthStore.ts';
import { fileService } from '@/services/fileService.ts';
import { ChevronLeft, ChevronRight, Edit3, ImagePlay, LogOut, Trash2, Users } from 'lucide-react';
import { useState, type Dispatch, type SetStateAction } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip.tsx';

const RightSidebarHeader = () => {
  const { activeConversation, users, getDefaultGroupName, updateGroupProfile } = useChatStore();
  const { user } = useAuthStore();
  const [openProfileDialog, setOpenProfileDialog] = useState<boolean>(false);
  const [editOpen, setEditOpen] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>('');
  const [editAvatarUrl, setEditAvatarUrl] = useState<string>('');
  const [avatarUploading, setAvatarUploading] = useState<boolean>(false);

  if (activeConversation?.type === 'direct') {
    return (
      <>
        {activeConversation?.participants[0]?._id && (
          <OthersProfileDialog
            open={openProfileDialog}
            onOpenChange={(open) => setOpenProfileDialog(open)}
            userId={activeConversation?.participants[0]?._id}
          />
        )}
        <div
          className="flex flex-col gap-2 items-center justify-center cursor-pointer"
          onClick={() => setOpenProfileDialog(true)}
        >
          <Avatar
            name={users[activeConversation?.participants[0]?._id]?.displayName}
            avatarUrl={users[activeConversation?.participants[0]?._id]?.avtUrl}
            className="w-16 h-16"
          />
          <p className="font-semibold">
            {users[activeConversation?.participants[0]?._id]?.displayName}
          </p>
        </div>
      </>
    );
  }

  if (activeConversation?.type === 'group') {
    const { participants, group } = activeConversation;
    const currentParticipant = participants.find((p) => p._id === user?._id);
    const isActiveMember = currentParticipant?.status === 'ACTIVE';

    return (
      <>
        <div
          className="flex flex-col gap-2 items-center justify-center cursor-pointer"
          onClick={() => setOpenProfileDialog(true)}
        >
          <GroupAvatar avtUrl={group?.avtUrl} participants={participants} className="w-16 h-16" />
          <p className="font-semibold">{group?.name || getDefaultGroupName(participants)}</p>
        </div>

        {isActiveMember && (
          <>
            <div className="flex justify-center">
              <Tooltip>
                <TooltipTrigger>
                  <Button
                    variant="outline"
                    size="icon"
                    className="mt-3"
                    onClick={() => {
                      setEditName(group?.name || '');
                      setEditAvatarUrl(group?.avtUrl || '');
                      setEditOpen(true);
                    }}
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent align="center">Chỉnh sửa thông tin nhóm</TooltipContent>
              </Tooltip>
            </div>

            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogContent aria-describedby={undefined}>
                <DialogHeader>
                  <DialogTitle>Cập nhật thông tin nhóm</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-3">
                  <Input
                    className="h-9"
                    placeholder="Tên nhóm (không bắt buộc)"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id="group-edit-avatar-input"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        e.target.value = '';
                        if (!file) return;
                        try {
                          setAvatarUploading(true);
                          const res = await fileService.uploadAvatar(file);
                          if (res?.secure_url) setEditAvatarUrl(res.secure_url);
                        } catch (err) {
                          console.error(err);
                        } finally {
                          setAvatarUploading(false);
                        }
                      }}
                    />
                  </div>
                  <div className="flex flex-col justify-center items-center gap-4">
                    <GroupAvatar
                      className="w-20 h-20 shrink-0"
                      avtUrl={editAvatarUrl}
                      participants={participants}
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('group-edit-avatar-input')?.click()}
                        disabled={avatarUploading}
                      >
                        {avatarUploading ? 'Đang upload...' : 'Chọn avatar'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEditAvatarUrl('')}
                        disabled={avatarUploading}
                      >
                        Xóa avatar
                      </Button>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditOpen(false)}>
                    Hủy
                  </Button>
                  <Button
                    variant="primary"
                    disabled={avatarUploading}
                    onClick={async () => {
                      if (!activeConversation?._id) return;
                      await updateGroupProfile(activeConversation._id, {
                        name: editName.trim() || undefined,
                        // Allow clearing avatar by sending empty string
                        avtUrl: editAvatarUrl.trim(),
                      });
                      setEditOpen(false);
                    }}
                  >
                    Lưu
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </>
    );
  }
  return <></>;
};
type RightSidebarType = 'sidebar' | 'media' | 'participants';
type SideBarContentProps = {
  setSidebarTab: Dispatch<SetStateAction<RightSidebarType>>;
};

const RightSidebarContent = ({ setSidebarTab }: SideBarContentProps) => {
  const {
    activeConversation,
    clearDirectConversation,
    leaveConversation,
    deleteGroupConversation,
  } = useChatStore();
  const { user } = useAuthStore();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    | { type: 'clearDirect'; conversationId: string }
    | { type: 'leaveGroup'; conversationId: string }
    | { type: 'deleteGroup'; conversationId: string }
    | null
  >(null);

  const openConfirm = (action: NonNullable<typeof pendingAction>) => {
    setPendingAction(action);
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    setConfirmOpen(false);
    setPendingAction(null);
  };

  const handleConfirm = async () => {
    if (!pendingAction) return;
    const { conversationId } = pendingAction;

    if (pendingAction.type === 'clearDirect') await clearDirectConversation(conversationId);
    if (pendingAction.type === 'leaveGroup') await leaveConversation(conversationId);
    if (pendingAction.type === 'deleteGroup') await deleteGroupConversation(conversationId);

    closeConfirm();
  };

  if (activeConversation?.type === 'direct') {
    return (
      <>
        <div
          className="flex gap-2 justify-between text-xs p-4 hover:bg-accent/50 rounded-sm cursor-pointer"
          onClick={() => {
            setSidebarTab('media');
          }}
        >
          <div className="flex gap-2">
            <ImagePlay className="w-4 h-4" />
            Ảnh và phương tiện
          </div>
          <ChevronRight className="w-4 h-4" />
        </div>
        <Separator className="my-1" />
        <div
          className="flex gap-2 text-xs text-red-700 p-4 hover:bg-accent/50 rounded-sm cursor-pointer"
          onClick={() =>
            openConfirm({ type: 'clearDirect', conversationId: activeConversation._id })
          }
        >
          <Trash2 className="w-4 h-4" />
          Xóa cuộc trò chuyện
        </div>

        <Dialog
          open={confirmOpen}
          onOpenChange={(open) => {
            if (!open) closeConfirm();
          }}
        >
          <DialogContent showCloseButton={false} aria-describedby="confirm-direct-action-desc">
            <DialogHeader>
              <DialogTitle>Xóa cuộc trò chuyện?</DialogTitle>
              <DialogDescription id="confirm-direct-action-desc">
                Bạn có chắc muốn xóa cuộc trò chuyện này không? Cuộc trò chuyện sẽ được ẩn cho tới
                khi có tin nhắn mới, và bạn chỉ xem được tin nhắn từ thời điểm xóa trở đi.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={closeConfirm}>
                Hủy
              </Button>
              <Button variant="destructive" onClick={handleConfirm}>
                Xóa
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  if (activeConversation?.type === 'group') {
    const { participants } = activeConversation;
    const currentUserRole = activeConversation?.participants.find((p) => p._id === user?._id)?.role;
    const currentUserStatus = activeConversation?.participants.find(
      (p) => p._id === user?._id
    )?.status;
    const isCurrentUserActive = currentUserStatus === 'ACTIVE';

    return (
      <div className="mx-1">
        <div
          className="flex gap-2 justify-between text-xs p-4 hover:bg-accent/50 rounded-sm cursor-pointer"
          onClick={() => {
            setSidebarTab('participants');
          }}
        >
          <div className="flex gap-2">
            <Users className="w-4 h-4" />
            Thành viên nhóm ({participants?.filter((p) => p.status === 'ACTIVE')?.length || 0})
          </div>
          <div className="flex gap-2">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
        <Separator className="my-1" />
        <div
          className="flex gap-2 justify-between text-xs p-4 hover:bg-accent/50 rounded-sm cursor-pointer"
          onClick={() => {
            setSidebarTab('media');
          }}
        >
          <div className="flex gap-2">
            <ImagePlay className="w-4 h-4" />
            Ảnh và phương tiện
          </div>
          <ChevronRight className="w-4 h-4" />
        </div>
        <Separator className="my-1" />
        {isCurrentUserActive && (
          <div
            className="flex gap-2 text-xs text-red-700 p-4 hover:bg-accent/50 rounded-sm cursor-pointer"
            onClick={() =>
              openConfirm({ type: 'leaveGroup', conversationId: activeConversation._id })
            }
          >
            <LogOut className="w-4 h-4" />
            Rời nhóm
          </div>
        )}

        {isCurrentUserActive && currentUserRole === 'ADMIN' && (
          <div
            className="flex gap-2 text-xs text-red-700 p-4 hover:bg-accent/50 rounded-sm cursor-pointer"
            onClick={() =>
              openConfirm({ type: 'deleteGroup', conversationId: activeConversation._id })
            }
          >
            <Trash2 className="w-4 h-4" />
            Xóa nhóm
          </div>
        )}

        <Dialog
          open={confirmOpen}
          onOpenChange={(open) => {
            if (!open) closeConfirm();
          }}
        >
          <DialogContent showCloseButton={false} aria-describedby="confirm-group-action-desc">
            <DialogHeader>
              <DialogTitle>
                {pendingAction?.type === 'deleteGroup' ? 'Xóa nhóm?' : 'Rời nhóm?'}
              </DialogTitle>
              <DialogDescription id="confirm-group-action-desc">
                {pendingAction?.type === 'deleteGroup'
                  ? 'Bạn có chắc muốn xóa nhóm này không? Hành động này sẽ xóa toàn bộ cuộc trò chuyện và không thể hoàn tác.'
                  : 'Bạn có chắc muốn rời nhóm này không?'}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={closeConfirm}>
                Hủy
              </Button>
              <Button variant="destructive" onClick={handleConfirm}>
                {pendingAction?.type === 'deleteGroup' ? 'Xóa nhóm' : 'Rời nhóm'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return <></>;
};

export const RightSidebarUI = () => {
  const manager = useSidebarManager();
  const sidebar = manager.use('right');
  const [sidebarTab, setSidebarTab] = useState<RightSidebarType>('sidebar');

  const handleReturnToSidebar = () => {
    setSidebarTab('sidebar');
  };

  return (
    <div className="h-full w-full overflow-hidden">
      <div
        className={cn(
          'w-[200%] flex transition-all h-full',
          sidebarTab !== 'sidebar' ? '-translate-x-1/2' : 'translate-x-0'
        )}
      >
        <div className="w-1/2">
          <div className="flex px-4 h-16 items-center select-none">
            {sidebar?.isMobile && <SidebarManagerTrigger name="right" icon={<ChevronLeft />} />}
            <p className="text-center text-lg font-semibold grow">Thông tin hội thoại</p>
          </div>
          <SidebarContent className="gap-1 select-none">
            <RightSidebarHeader />
            <Separator className="mt-6 mb-1" />
            <RightSidebarContent setSidebarTab={setSidebarTab} />
          </SidebarContent>
        </div>
        <div className="w-1/2 h-full">
          {sidebarTab === 'media' && <SidebarGallery onReturn={handleReturnToSidebar} />}
          {sidebarTab === 'participants' && (
            <ParticipantManagement onReturn={handleReturnToSidebar} />
          )}
        </div>
      </div>
    </div>
  );
};
