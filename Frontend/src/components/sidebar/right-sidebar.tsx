import { Avatar } from '@/components/avatars/avatar.tsx';
import { GroupAvatar } from '@/components/avatars/group-avatar.tsx';
import { OthersProfileDialog } from '@/components/dialogs/others-profile-dialog.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { useChatStore } from '@/stores/useChatStore.ts';
import { LogOut, Trash2, Users } from 'lucide-react';
import { useState } from 'react';

export const RightSidebarHeader = () => {
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

export const RightSidebarContent = () => {
  const { activeConversation } = useChatStore();

  if (activeConversation?.type === 'direct') {
    return (
      <>
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
      <>
        <div className="flex gap-2 justify-between text-xs p-4 hover:bg-accent/50 rounded-sm cursor-pointer mx-1">
          <div className="flex gap-2">
            <Users className="w-4 h-4" />
            Thành viên nhóm
          </div>
          {participants?.length || 0} Thành viên
        </div>
        <Separator className="my-1" />
        <div className="flex gap-2 text-xs text-red-700 p-4 hover:bg-accent/50 rounded-sm cursor-pointer">
          <LogOut className="w-4 h-4" />
          Rời nhóm
        </div>
      </>
    );
  }
  return <></>;
};
