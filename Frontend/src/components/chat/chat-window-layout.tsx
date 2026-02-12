import Loading from '@/components/ui/loading.tsx';
import { useChatStore } from '../../stores/useChatStore.ts';
import { ChatInsertSkeleton } from './chat-insert-skeleton.tsx';
import { ChatWelcome } from './chat-welcome.tsx';
import { ChatWindowFooter } from './chat-window-footer.tsx';
import { ChatWindowHeader } from './chat-window-header.tsx';
import { ChatWindowInset } from './chat-window-inset.tsx';

export const ChatWindowLayout = () => {
  const { messages, activeConversationId, messageLoading, isFetchOldMessage } = useChatStore();

  if (!activeConversationId)
    return (
      <>
        {messageLoading && !isFetchOldMessage && (
          <div className="absolute inset-0 flex justify-center items-center bg-accent">
            <Loading />
          </div>
        )}
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
      {messageLoading && !isFetchOldMessage && (
        <div className="absolute inset-0 flex justify-center items-center bg-accent">
          <Loading />
        </div>
      )}
      <ChatWindowHeader />
      <div className="flex-1 overflow-hidden relative">
        <ChatWindowInset />
      </div>
      <ChatWindowFooter />
    </>
  );
};
