import { useChatStore } from '../../stores/useChatStore.ts';
import { ChatInsertSkeleton } from './chat-insert-skeleton.tsx';
import { ChatWelcome } from './chat-welcome.tsx';
import { ChatWindowFooter } from './chat-window-footer.tsx';
import { ChatWindowHeader } from './chat-window-header.tsx';
import { ChatWindowInset } from './chat-window-inset.tsx';

export const ChatWindowLayout = () => {
  const { messages, activeConversationId, messageLoading } = useChatStore();

  if (!activeConversationId)
    return (
      <>
        <ChatWindowHeader />
        <ChatWelcome />
      </>
    );

  const currentMessages = messages?.[activeConversationId];
  //Lần đầu fetch tin nhắn
  if (messageLoading && !currentMessages)
    return (
      <>
        <ChatWindowHeader />
        <ChatInsertSkeleton />;
      </>
    );

  return (
    <>
      <ChatWindowHeader />
      <div className="flex-1 overflow-hidden relative">
        <ChatWindowInset />
      </div>
      <ChatWindowFooter />
    </>
  );
};
