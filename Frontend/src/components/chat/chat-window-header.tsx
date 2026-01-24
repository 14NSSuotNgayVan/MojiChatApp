import { SidebarManagerTrigger } from '../ui/sidebar.tsx';
import { Separator } from '../ui/separator.tsx';
import { useChatStore } from '../../stores/useChatStore.ts';
import { OnlineAvatar } from '../avatars/avatar.tsx';
import { GroupAvatar } from '../avatars/group-avatar.tsx';

export const ChatWindowHeader = () => {
  const { activeConversation, getDefaultGroupName, users } = useChatStore();

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
    <header className="flex h-16 shrink-0 items-center gap-2 border-b justify-between">
      <div className="flex items-center gap-2 px-4">
        <SidebarManagerTrigger name="left" className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
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
        <div className="font-medium truncate">
          {activeConversation?.type === 'direct'
            ? users[activeConversation?.participants[0]._id]?.displayName
            : activeConversation?.group?.name ||
              getDefaultGroupName(activeConversation.participants!)}
        </div>
      </div>

      <SidebarManagerTrigger name="right" className="mr-4 shrink-0" />
    </header>
  );
};
