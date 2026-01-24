import { Avatar } from '@/components/avatars/avatar.tsx';
import { OthersProfileDialog } from '@/components/dialogs/others-profile-dialog.tsx';
import { useChatStore } from '@/stores/useChatStore.ts';
import { useState } from 'react';

export const SidebarAvatarHeader = () => {
  const { activeConversation, users } = useChatStore();
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
};
