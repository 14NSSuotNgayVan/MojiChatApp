import { AppSidebar } from "@/components/sidebar/app-sidebar.tsx";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useChatStore } from "../stores/useChatStore.ts";
import { useEffect } from "react";
import { ChatWindowLayout } from "../components/chat/chat-window-layout.tsx";

const ChatAppPage = () => {
  const { getConversations } = useChatStore();

  useEffect(() => {
    getConversations();
  }, []);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <ChatWindowLayout />
      </SidebarInset>
    </SidebarProvider>
  );
};

export default ChatAppPage;
