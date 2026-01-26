import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarManagerTrigger,
  useSidebarManager,
} from '@/components/ui/sidebar';
import { useAuthStore } from '@/stores/useAuthStore';
import { Header } from '@/components/sidebar/sidebar-header.tsx';
import { ChatList } from '@/components/sidebar/chat-list.tsx';
import { NavUser } from '@/components/sidebar/nav-user.tsx';
import { ChevronLeft } from 'lucide-react';
import { SidebarAvatarHeader } from '@/components/sidebar/right-sidebar.tsx';

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
  const manager = useSidebarManager();
  const sidebar = manager.use('right');

  return (
    <Sidebar variant="inset" side="right" {...props}>
      <div className="flex px-4 h-16 items-center">
        {sidebar?.isMobile && <SidebarManagerTrigger name="right" icon={<ChevronLeft />} />}
        <p className="text-center text-lg font-semibold grow">Thông tin hội thoại</p>
      </div>
      <SidebarContent>
        <SidebarAvatarHeader />
      </SidebarContent>
    </Sidebar>
  );
}
