import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useAuthStore } from "@/stores/useAuthStore";
import { Header } from "@/components/sidebar/sidebar-header.tsx";
import { ChatList } from "@/components/sidebar/chat-list.tsx";
import { NavUser } from "@/components/sidebar/nav-user.tsx";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuthStore();
  return (
    <Sidebar variant="inset" {...props}>
      {/* header */}
      <Header />
      {/* content */}
      <SidebarContent>
        <ChatList />
      </SidebarContent>
      {/* footer */}
      <SidebarFooter>{user && <NavUser />}</SidebarFooter>
    </Sidebar>
  );
}
