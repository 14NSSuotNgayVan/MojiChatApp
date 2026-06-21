import { useEffect, useRef, useState } from 'react';
import { userService } from '../../services/userService.ts';
import Loading from '../ui/loading.tsx';
import { Button } from '../ui/button.tsx';
import { Check, ImageUp, Send, Undo2, UserPlus, UserRoundCheck, UserRoundX, X } from 'lucide-react';
import { friendService } from '../../services/friendService.ts';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog.tsx';
import type { Profile, User } from '../../types/user.ts';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu.tsx';
import { useCanHover } from '../../hooks/use-can-hover.ts';
import { cn } from '../../lib/utils.ts';
import { Avatar } from '../avatars/avatar.tsx';
import { chatService } from '@/services/chatService.ts';
import { useChatStore } from '@/stores/useChatStore.ts';
import { useFriendStore } from '@/stores/useFriendStore';

interface ProfileCardProps {
  userId: string;
  closeAll?: () => void;
}

export const ProfileCard = ({
  user,
  onAvtClick,
  onBgClick,
}: {
  user: User;
  onAvtClick?: () => void;
  onBgClick?: () => void;
}) => {
  const canHover = useCanHover();
  const [bgOverlayVisible, setBgOverlayVisible] = useState(false);
  const [avtOverlayVisible, setAvtOverlayVisible] = useState(false);

  return (
    <div className="w-full">
      {/* Background Image */}
      <div
        className={cn(
          'relative w-full aspect-video overflow-hidden bg-gray-200 rounded-lg group',
          onBgClick && 'cursor-pointer'
        )}
        onClick={
          onBgClick && !canHover
            ? () => setBgOverlayVisible((prev) => !prev)
            : undefined
        }
      >
        {user?.bgUrl && (
          <img src={user?.bgUrl} alt="Background" className="w-full h-full object-cover" />
        )}
        {onBgClick && (
          <div
            className={cn(
              'justify-center items-center absolute inset-0 bg-black/30 cursor-pointer',
              canHover ? 'hidden group-hover:flex' : bgOverlayVisible ? 'flex' : 'hidden'
            )}
            onClick={(e) => {
              e.stopPropagation();
              onBgClick();
              if (!canHover) setBgOverlayVisible(false);
            }}
          >
            <ImageUp />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Avatar & Info */}
        <div className="mb-2 -mt-[calc(1/6)*100%] z-10">
          {user && (
            <div
              className={cn('w-1/4 relative', onAvtClick && !canHover && 'cursor-pointer')}
              onClick={
                onAvtClick && !canHover
                  ? () => setAvtOverlayVisible((prev) => !prev)
                  : undefined
              }
            >
              <Avatar
                name={user.displayName}
                avatarUrl={user.avtUrl}
                className="w-full h-auto aspect-square border-4 border-background shrink-0 group relative"
                layer={
                  onAvtClick && (
                    <div
                      className={cn(
                        'justify-center items-center absolute inset-0 bg-black/30 cursor-pointer transition-smooth',
                        canHover
                          ? 'hidden group-hover:flex'
                          : avtOverlayVisible
                            ? 'flex'
                            : 'hidden'
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAvtClick();
                        if (!canHover) setAvtOverlayVisible(false);
                      }}
                    >
                      <ImageUp />
                    </div>
                  )
                }
              />
            </div>
          )}
        </div>
        <div className="mb-2">
          <h2 className="text-xl font-bold text-foreground">{user?.displayName}</h2>
          <p className="text-xs mb-1">{user.email}</p>
          <p className="text-xs">{user.phone}</p>
        </div>

        {/* Description */}
        <p className="text-sm text-foreground/80 mb-2 leading-relaxed">{user?.bio}</p>
      </div>
    </div>
  );
};

export const OthersProfileCard = ({ userId, closeAll }: ProfileCardProps) => {
  const canHover = useCanHover();
  const firstRender = useRef<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [unfriendDialogOpen, setUnfriendDialogOpen] = useState(false);
  const refreshFriends = useFriendStore((s) => s.refreshFriends);

  const handleChat = async (userId: string) => {
    try {
      const { setActiveConversation, getConversations, getMessages } = useChatStore.getState();

      const res = await chatService.createConversation({
        type: 'direct',
        memberIds: [userId],
      });

      await getConversations();
      const success = await getMessages(res?.conversation._id);
      setActiveConversation(success ? res.conversation : null);
      if(closeAll) closeAll();
    } catch (error) {
      console.error(error);
    }
  };

  const getUserInfo = async () => {
    try {
      const res = await userService.getUser(userId);
      setProfile(res.profile);
    } catch (error) {
      console.log('Lỗi khi gọi getUserInfo: ' + error);
    } finally {
      setLoading(false);
      firstRender.current = false;
    }
  };

  const unFriendHandler = async () => {
    try {
      setLoading(true);
      await friendService.unFriend(userId);
      await refreshFriends();
      getUserInfo();
    } catch (error) {
      console.log('Lỗi khi gọi unFriendHandler: ' + error);
    }
  };

  const addFriendHandler = async () => {
    try {
      setLoading(true);
      await friendService.addFriend(userId);
      await refreshFriends();
      getUserInfo();
    } catch (error) {
      console.log('Lỗi khi gọi addFriendHandler: ' + error);
    }
  };

  const acceptFriendHandler = async () => {
    try {
      if (!profile) return;
      setLoading(true);
      await friendService.acceptFriendRequest(profile.receivedRequest!);
      await refreshFriends();
      getUserInfo();
    } catch (error) {
      console.log('Lỗi khi gọi acceptFriendHandler: ' + error);
    }
  };

  const declineFriendHandler = async (id: string) => {
    try {
      setLoading(true);
      await friendService.declineFriendRequest(id);
      await refreshFriends();
      getUserInfo();
    } catch (error) {
      console.log('Lỗi khi gọi declineFriendHandler: ' + error);
    }
  };

  useEffect(() => {
    setLoading(true);
    getUserInfo();
  }, []);

  const unfriendDialog = (
    <Dialog open={unfriendDialogOpen} onOpenChange={setUnfriendDialogOpen}>
      {canHover && (
        <DialogTrigger asChild>
          <Button variant="primary" className="hidden group-hover:flex active:flex">
            <UserRoundX />
            Hủy kết bạn
          </Button>
        </DialogTrigger>
      )}
      <DialogContent variant="centered" className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Xác nhận</DialogTitle>
          <DialogDescription>Bạn có xác nhận hủy kết bạn với người này ?</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="primary">Hủy</Button>
          </DialogClose>
          <Button onClick={unFriendHandler} disabled={loading}>
            Xác nhận
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderButtons = () => {
    if (profile?.isFriend)
      return (
        <>
          {canHover ? (
            <div className="group transition-smooth">
              <Button variant="primary" className="group-hover:hidden">
                <UserRoundCheck />
                Bạn bè
              </Button>
              {unfriendDialog}
            </div>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="primary" disabled={loading}>
                  <UserRoundCheck />
                  Bạn bè
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuItem onSelect={() => setUnfriendDialogOpen(true)}>
                  <UserRoundX />
                  Hủy kết bạn
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {!canHover && unfriendDialog}
        </>
      );

    if (profile?.receivedRequest)
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="primary" disabled={loading}>
              <UserRoundCheck />
              Phản hồi
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuItem onClick={acceptFriendHandler}>
              <Check />
              Chấp nhận
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                declineFriendHandler(profile.receivedRequest!);
              }}
            >
              <X />
              Từ chối
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    if (profile?.sentRequest)
      return (
        <Button
          variant="primary"
          onClick={() => {
            declineFriendHandler(profile.sentRequest!);
          }}
          disabled={loading}
        >
          <Undo2 />
          Hoàn tác yêu cầu
        </Button>
      );

    return (
      <Button variant="primary" onClick={addFriendHandler} disabled={loading}>
        <UserPlus />
        Kết bạn
      </Button>
    );
  };

  if (loading && firstRender.current)
    return (
      <div className="flex justify-center h-72">
        <Loading />
      </div>
    );

  return (
    <div className="w-full">
      {profile?.user && <ProfileCard user={profile.user} />}
      <div className="flex justify-around gap-1 items-center">
        {renderButtons()}
        <div className="border-r h-4 border-secondary"></div>
        <Button
          variant="primary"
          onClick={() => {
            if (profile?.user?._id) handleChat(profile?.user?._id);
          }}
        >
          <Send />
          Nhắn tin
        </Button>
      </div>
    </div>
  );
};
