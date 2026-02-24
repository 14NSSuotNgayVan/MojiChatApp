import { Sidebar, SidebarContent, SidebarFooter } from '@/components/ui/sidebar';
import { useAuthStore } from '@/stores/useAuthStore';
import { Header } from '@/components/left-sidebar/sidebar-header';
import { ChatList } from '@/components/left-sidebar/chat-list';
import { NavUser } from '@/components/left-sidebar/nav-user';
import { RightSidebarUI } from '@/components/right-sidebar/right-sidebar';

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

export function RightSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" side="right" {...props}>
      <RightSidebarUI />
    </Sidebar>
  );
}
