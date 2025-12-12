import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
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
