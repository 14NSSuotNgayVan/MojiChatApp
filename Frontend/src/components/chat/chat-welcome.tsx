import { Heart, MessageCircle, Users } from 'lucide-react';
import { Button } from '../ui/button.tsx';
import { MojiLogo } from '@/components/brand/moji-logo.tsx';
import { AddFriendDialog } from '@/components/dialogs/add-friend-dialog.tsx';
import { useState } from 'react';
import { AddChatDialog } from '@/components/dialogs/add-chat-dialog.tsx';

const features = [
  { icon: MessageCircle, label: 'Nhắn tin nhanh chóng và an toàn' },
  { icon: Users, label: 'Tạo nhóm và quản lý bạn bè' },
  { icon: Heart, label: 'Chia sẻ cảm xúc với emoji' },
] as const;

export const ChatWelcome = () => {
  const [openAddFriendDialog, setOpenAddFriendDialog] = useState<boolean>(false);
  const [openAddChatDialog, setOpenAddChatDialog] = useState<boolean>(false);

  return (
    <>
      <AddFriendDialog open={openAddFriendDialog} onOpenChange={setOpenAddFriendDialog} />
      <AddChatDialog open={openAddChatDialog} onOpenChange={setOpenAddChatDialog} />
      <div className="flex-1 overflow-scroll flex flex-col bg-background">
        <div className="flex-1 flex items-center justify-center px-8 pb-4">
          <div className="text-center max-w-md w-full">
            <MojiLogo size="xl" variant="app" className="my-4 mx-auto" />

            <h2 className="text-3xl font-bold mb-4">Chào mừng đến với</h2>
            <p className="text-4xl font-black mb-6 text-primary">MOJI</p>

            <p className="mb-8 leading-relaxed text-muted-foreground">
              Kết nối, trò chuyện và chia sẻ những khoảnh khắc tuyệt vời với bạn bè và gia đình
            </p>

            <div className="grid gap-3 mb-8 text-sm text-muted-foreground text-left max-w-sm mx-auto">
              {features.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-primary">
                    <Icon size={18} className="text-primary-foreground" />
                  </div>
                  <span>{label}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 items-center justify-center">
              <Button
                onClick={() => setOpenAddChatDialog(true)}
                className="w-full max-w-xs"
              >
                Bắt đầu trò chuyện
              </Button>
              <Button
                onClick={() => setOpenAddFriendDialog(true)}
                variant="secondary"
                className="w-full max-w-xs"
              >
                Thêm bạn bè
              </Button>
            </div>
          </div>
        </div>

        <div className="px-8 py-2 text-center text-muted-foreground text-sm border-t">
          <p>Hãy chọn một đoạn hội thoại từ danh sách bên trái để bắt đầu</p>
        </div>
      </div>
    </>
  );
};
