import { AppSidebar, RightSidebar } from '@/components/sidebar/app-sidebar.tsx';
import {
  SidebarInset,
  SidebarManager,
  SidebarManagerProvider,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { useChatStore } from '../stores/useChatStore.ts';
import { useEffect } from 'react';
import { ChatWindowLayout } from '../components/chat/chat-window-layout.tsx';

const ChatAppPage = () => {
  const { getConversations, activeConversationId } = useChatStore();

  useEffect(() => {
    getConversations();
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
          <SidebarProvider>
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
