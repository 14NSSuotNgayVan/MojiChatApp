import { AppSidebar, RightSidebar } from '@/components/left-sidebar/app-sidebar.tsx';
import {
  SidebarInset,
  SidebarManager,
  SidebarManagerProvider,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { useChatStore } from '../stores/useChatStore.ts';
import { useEffect } from 'react';
import { ChatWindowLayout } from '../components/chat/chat-window-layout.tsx';
import { initNotificationAudio } from '@/lib/notificationSound.ts';

const ChatAppPage = () => {
  const { getConversations, activeConversationId } = useChatStore();

  useEffect(() => {
    getConversations();
  }, []);

  useEffect(() => {
    let initialized = false;

    const onFirstInteraction = () => {
      if (initialized) return;
      initialized = true;
      void initNotificationAudio();
      window.removeEventListener('pointerdown', onFirstInteraction);
      window.removeEventListener('keydown', onFirstInteraction);
      window.removeEventListener('touchstart', onFirstInteraction);
    };

    window.addEventListener('pointerdown', onFirstInteraction, { passive: true });
    window.addEventListener('keydown', onFirstInteraction);
    window.addEventListener('touchstart', onFirstInteraction, { passive: true });

    return () => {
      window.removeEventListener('pointerdown', onFirstInteraction);
      window.removeEventListener('keydown', onFirstInteraction);
      window.removeEventListener('touchstart', onFirstInteraction);
    };
  }, []);

  // multi sidebar manager https://github.com/shadcn-ui/ui/issues/5651
  return (
    <SidebarManagerProvider>
      <SidebarProvider>
        {/* Left sidebar */}
        <SidebarManager name="left">
          <AppSidebar />
        </SidebarManager>

        <SidebarInset>
          <SidebarProvider defaultOpen={false}>
            {/* main chat content */}
            <SidebarInset>
              <ChatWindowLayout />
            </SidebarInset>

            {/* right side bar */}
            {activeConversationId && (
              <SidebarManager name="right">
                <RightSidebar />
              </SidebarManager>
            )}
          </SidebarProvider>
        </SidebarInset>
      </SidebarProvider>
    </SidebarManagerProvider>
  );
};

export default ChatAppPage;
