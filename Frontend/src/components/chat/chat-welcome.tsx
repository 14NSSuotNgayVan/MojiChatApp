import { ArrowRight } from 'lucide-react';
import { Button } from '../ui/button.tsx';
import { MojiLogo } from '@/components/brand/moji-logo.tsx';
import { AddFriendDialog } from '@/components/dialogs/add-friend-dialog.tsx';
import { FriendsDialog } from '@/components/dialogs/friends-dialog.tsx';
import { useState } from 'react';
import { AddChatDialog } from '@/components/dialogs/add-chat-dialog.tsx';
import { useChatStore } from '@/stores/useChatStore.ts';
import { useFriendStore } from '@/stores/useFriendStore.ts';

export const ChatWelcome = () => {
  const [openAddFriendDialog, setOpenAddFriendDialog] = useState<boolean>(false);
  const [openAddChatDialog, setOpenAddChatDialog] = useState<boolean>(false);
  const [openFriendsDialog, setOpenFriendsDialog] = useState<boolean>(false);
  const { conversations } = useChatStore();
  const { friendsCount, pendingRequestsCount } = useFriendStore();

  const hasFriends = friendsCount > 0;
  const hasConversations = conversations.length > 0;

  const primaryAction = !hasFriends
    ? { label: 'Thêm bạn bè', onClick: () => setOpenAddFriendDialog(true) }
    : !hasConversations
      ? { label: 'Bắt đầu trò chuyện', onClick: () => setOpenAddChatDialog(true) }
      : null;

  const subtitle = !hasFriends
    ? 'Bước đầu tiên: kết bạn để có thể nhắn tin và tạo nhóm chat.'
    : !hasConversations
      ? 'Bạn đã có bạn bè — hãy bắt đầu cuộc trò chuyện đầu tiên.'
      : 'Chọn một cuộc trò chuyện từ danh sách bên trái để tiếp tục.';

  return (
    <>
      <AddFriendDialog open={openAddFriendDialog} onOpenChange={setOpenAddFriendDialog} />
      <AddChatDialog open={openAddChatDialog} onOpenChange={setOpenAddChatDialog} />
      <FriendsDialog open={openFriendsDialog} onOpenChange={setOpenFriendsDialog} />
      <div className="flex-1 overflow-auto flex flex-col bg-background">
        <div className="flex-1 flex items-center justify-center px-6 py-8">
          <div className="app-welcome app-reveal">
            <MojiLogo size="lg" variant="app" className="mb-6 mx-auto" />

            {pendingRequestsCount > 0 && (
              <button
                type="button"
                onClick={() => setOpenFriendsDialog(true)}
                className="mb-4 w-full max-w-xs mx-auto block rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm text-primary hover:bg-primary/15 transition-colors app-reveal"
              >
                Bạn có {pendingRequestsCount} lời mời kết bạn — xem ngay
              </button>
            )}

            <p className="app-welcome__eyebrow">MOJI Chat</p>
            <h1 className="app-welcome__title">
              {hasConversations ? (
                <>
                  Chào mừng{' '}
                  <span className="italic font-medium">trở lại.</span>
                </>
              ) : (
                <>
                  Sẵn sàng{' '}
                  <span className="italic font-medium">trò chuyện.</span>
                </>
              )}
            </h1>
            <p className="app-welcome__subtitle">{subtitle}</p>

            {!hasConversations && (
              <div className="app-welcome__strip app-reveal app-reveal--delay-1" aria-hidden>
                <div className="app-welcome__strip-msg">
                  <div className="app-welcome__bubble app-welcome__bubble--left">
                    Tối nay vào MOJI nhé?
                  </div>
                  <div className="app-welcome__bubble app-welcome__bubble--right">
                    Ok, mình online rồi!
                  </div>
                </div>
              </div>
            )}

            <div className="app-welcome__actions app-reveal app-reveal--delay-2">
              {primaryAction && (
                <Button
                  onClick={primaryAction.onClick}
                  className="auth-submit-btn h-11 w-full max-w-xs rounded-xl font-medium"
                >
                  {primaryAction.label}
                  <ArrowRight className="size-4" />
                </Button>
              )}
              {hasFriends && !hasConversations && (
                <Button
                  onClick={() => setOpenAddFriendDialog(true)}
                  variant="outline"
                  className="h-11 w-full max-w-xs rounded-xl"
                >
                  Thêm bạn bè
                </Button>
              )}
              {!hasFriends && (
                <Button
                  onClick={() => setOpenAddChatDialog(true)}
                  variant="outline"
                  className="h-11 w-full max-w-xs rounded-xl"
                  disabled
                  title="Thêm bạn bè trước khi tạo cuộc trò chuyện"
                >
                  Bắt đầu trò chuyện
                </Button>
              )}
              {hasConversations && (
                <p className="app-welcome__hint">
                  Hoặc tạo cuộc trò chuyện mới từ sidebar bên trái
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
