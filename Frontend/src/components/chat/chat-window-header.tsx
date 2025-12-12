import { SidebarTrigger } from "../ui/sidebar.tsx";
import { Separator } from "../ui/separator.tsx";
import { useChatStore } from "../../stores/useChatStore.ts";
import { Avatar } from "../avatar.tsx";
import { GroupAvatar } from "../group-avatar.tsx";

export const ChatWindowHeader = () => {
  const { activeConversation, getDefaultGroupName } = useChatStore();

  if (!activeConversation)
    return (
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
        </div>
      </header>
    );

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        {activeConversation?.type === "direct" ? (
          <Avatar
            name={activeConversation?.participants[0]?.displayName || ""}
            avatarUrl={activeConversation?.participants[0]?.avtUrl}
          />
        ) : (
          <GroupAvatar
            avtUrl={activeConversation?.group?.avtUrl}
            participants={activeConversation?.participants}
          />
        )}
        <div className="font-medium truncate">
          {activeConversation?.type === "direct"
            ? activeConversation?.participants[0]?.displayName
            : activeConversation?.group?.name ||
              getDefaultGroupName(activeConversation.participants!)}
        </div>
      </div>
    </header>
  );
};
