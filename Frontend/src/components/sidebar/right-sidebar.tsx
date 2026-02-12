import { Avatar } from '@/components/avatars/avatar.tsx';
import { GroupAvatar } from '@/components/avatars/group-avatar.tsx';
import { OthersProfileDialog } from '@/components/dialogs/others-profile-dialog.tsx';
import { SidebarGallery } from '@/components/gallery/sidebar-gallery.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import {
  SidebarContent,
  SidebarManagerTrigger,
  useSidebarManager,
} from '@/components/ui/sidebar.tsx';
import { cn } from '@/lib/utils.ts';
import { useChatStore } from '@/stores/useChatStore.ts';
import { ChevronLeft, ChevronRight, ImagePlay, LogOut, Trash2, Users } from 'lucide-react';
import { useState, type Dispatch, type SetStateAction } from 'react';

const RightSidebarHeader = () => {
  const { activeConversation, users, getDefaultGroupName } = useChatStore();
  const [openProfileDialog, setOpenProfileDialog] = useState<boolean>(false);

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

    return (
      <>
        <div
          className="flex flex-col gap-2 items-center justify-center cursor-pointer"
          onClick={() => setOpenProfileDialog(true)}
        >
          <GroupAvatar avtUrl={group?.avtUrl} participants={participants} className="w-16 h-16" />
          <p className="font-semibold">{group?.name || getDefaultGroupName(participants)}</p>
        </div>
      </>
    );
  }
  return <></>;
};

type SideBarContentProps = {
  setSidebarTab: Dispatch<SetStateAction<'sidebar' | 'media'>>;
};

const RightSidebarContent = ({ setSidebarTab }: SideBarContentProps) => {
  const { activeConversation } = useChatStore();

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
        <div className="flex gap-2 text-xs text-red-700 p-4 hover:bg-accent/50 rounded-sm cursor-pointer">
          <Trash2 className="w-4 h-4" />
          Xóa cuộc trò chuyện
        </div>
      </>
    );
  }

  if (activeConversation?.type === 'group') {
    const { participants } = activeConversation;

    return (
      <div className="mx-1">
        <div className="flex gap-2 justify-between text-xs p-4 hover:bg-accent/50 rounded-sm cursor-pointer">
          <div className="flex gap-2">
            <Users className="w-4 h-4" />
            Thành viên nhóm
          </div>
          <div className="flex gap-2">
            {participants?.length || 0} Thành viên
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
        <div className="flex gap-2 text-xs text-red-700 p-4 hover:bg-accent/50 rounded-sm cursor-pointer">
          <LogOut className="w-4 h-4" />
          Rời nhóm
        </div>
      </div>
    );
  }

  return <></>;
};

export const RightSidebarUI = () => {
  const manager = useSidebarManager();
  const sidebar = manager.use('right');
  const [sidebarTab, setSidebarTab] = useState<'sidebar' | 'media'>('sidebar');

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
        </div>
      </div>
    </div>
  );
};
