import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { NavUser } from "./nav-user";
import { useAuthStore } from "@/stores/useAuthStore";
import { ChatList } from "./chat-list.tsx";
import { Header } from "./sidebar/sidebar-header.tsx";

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
