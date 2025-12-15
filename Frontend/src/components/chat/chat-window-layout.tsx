import { useChatStore } from "../../stores/useChatStore.ts";
import { ChatWelcome } from "./chat-welcome.tsx";
import { ChatWindowFooter } from "./chat-window-footer.tsx";
import { ChatWindowHeader } from "./chat-window-header.tsx";
import { ChatWindowInset } from "./chat-window-inset.tsx";

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
      <ChatWindowInset />
      <ChatWindowFooter />
    </>
  );
};
