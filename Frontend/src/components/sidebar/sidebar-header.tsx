import { AddChatDialog } from '@/components/dialogs/add-chat-dialog.tsx';
import { AddFriendDialog } from '@/components/dialogs/add-friend-dialog';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { SidebarHeader, SidebarMenu, SidebarMenuItem } from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip.tsx';
import { MessageCirclePlus, SearchIcon, UserPlus } from 'lucide-react';
import { useState } from 'react';

export const Header = () => {
  const [openAddFriendDialog, setOpenAddFriendDialog] = useState<boolean>(false);
  const [openAddChatDialog, setOpenAddChatDialog] = useState<boolean>(false);
  const [onSearch, setOnSearch] = useState<boolean>(false);

  const handleOpenFriendDialog = () => {
    setOpenAddFriendDialog(true);
  };

  const handleOpenAddChatDialog = () => {
    setOpenAddChatDialog(true);
  };

  const handleOpenChange = (open: boolean) => {
    setOpenAddFriendDialog(open);
  };

  const handleOnSearchClick = () => {
    if (!onSearch) setOnSearch(true);
  };

  return (
    <>
      <AddFriendDialog open={openAddFriendDialog} onOpenChange={handleOpenChange} />
      <AddChatDialog open={openAddChatDialog} onOpenChange={setOpenAddChatDialog} />
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="flex p-2 items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              <div className="text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <img src="public/logo.svg" className="w-6" />
              </div>
              <div className="grid flex-1 text-left text-lg leading-tight">
                <span className="truncate font-bold">MOJI</span>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="pb-2 border-b mb-2">
          <div className="flex items-center gap-1 px-2 py-1 ">
            <div className="relative grow">
              <Input
                id={`input-search`}
                className="peer h-8 ps-8 pe-2 text-sm"
                placeholder={'Tìm kiếm...'}
                type="search"
                value={''}
                onChange={() => {}}
                onClick={handleOnSearchClick}
              />
              <div className="text-white pointer-events-none absolute flex h-full top-0 items-center justify-center ps-2 peer-disabled:opacity-50">
                <SearchIcon className="text-primary" size={16} />
              </div>
            </div>
            {onSearch ? (
              <Button variant="primary" size="sm" onClick={() => setOnSearch(false)}>
                Trở lại
              </Button>
            ) : (
              <>
                <Tooltip>
                  <TooltipTrigger asChild className="cursor-pointer">
                    <Button variant="primary" size="sm" onClick={handleOpenAddChatDialog}>
                      <MessageCirclePlus />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Tin nhắn mới</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild className="cursor-pointer">
                    <Button variant="primary" size="sm" onClick={handleOpenFriendDialog}>
                      <UserPlus />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Thêm bạn bè</p>
                  </TooltipContent>
                </Tooltip>
              </>
            )}
          </div>
        </div>
      </SidebarHeader>
    </>
  );
};
