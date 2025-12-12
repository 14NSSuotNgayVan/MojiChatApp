import { useChatStore } from "../../stores/useChatStore.ts";
import { ChatWelcome } from "./chat-welcome.tsx";
import { ChatWindowHeader } from "./chat-window-header.tsx";

export const ChatWindowLayout = () => {
  const { activeConversationId, messageLoading } = useChatStore();

  if (!activeConversationId)
    return (
      <>
        <ChatWindowHeader />
        <ChatWelcome />
      </>
    );
  if (messageLoading) return "Đang tải";

  return (
    <>
      <ChatWindowHeader />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          <div className="bg-muted/50 aspect-video rounded-xl" />
          <div className="bg-muted/50 aspect-video rounded-xl" />
          <div className="bg-muted/50 aspect-video rounded-xl" />
        </div>
        <div className="bg-muted/50 min-h-screen flex-1 rounded-xl md:min-h-min" />
      </div>
    </>
  );
};
