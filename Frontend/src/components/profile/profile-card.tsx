import { useEffect, useRef, useState } from "react";
import { userService } from "../../services/userService.ts";
import Loading from "../ui/loading.tsx";
import { Button } from "../ui/button.tsx";
import {
  Check,
  ImageUp,
  Send,
  Undo2,
  UserPlus,
  UserRoundCheck,
  UserRoundX,
  X,
} from "lucide-react";
import { friendService } from "../../services/friendService.ts";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog.tsx";
import type { Profile, User } from "../../types/user.ts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu.tsx";
import { cn } from "../../lib/utils.ts";
import { Avatar } from "../avatar.tsx";

interface ProfileCardProps {
  userId: string;
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
  return (
    <div className="w-full">
      {/* Background Image */}
      <div
        className={cn(
          "relative w-full aspect-video overflow-hidden bg-gray-200 rounded-lg group",
          onBgClick && "group"
        )}
      >
        {user?.bgUrl && (
          <img
            src={user?.bgUrl}
            alt="Background"
            className="w-full h-full object-cover"
          />
        )}
        {onBgClick && (
          <div
            className={cn(
              "hidden justify-center items-center absolute inset-0 bg-gray-500/70 group-hover:flex cursor-pointer"
            )}
            onClick={onBgClick}
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
            <Avatar name={user.displayName} avatarUrl={user.avtUrl} className=" w-1/4 h-auto aspect-square border-4 border-background shrink-0 group relative"
              layer={onAvtClick && (
                <div
                  className="hidden justify-center items-center absolute inset-0 bg-gray-500/70 group-hover:flex cursor-pointer transition-smooth"
                  onClick={onAvtClick}
                >
                  <ImageUp />
                </div>
              )}
            />
          )}
        </div>
        <div className="mb-2">
          <h2 className="text-xl font-bold text-foreground">
            {user?.displayName}
          </h2>
          <p className="text-xs mb-1">{user.email}</p>
          <p className="text-xs">{user.phone}</p>
        </div>

        {/* Description */}
        <p className="text-sm text-foreground/80 mb-2 leading-relaxed">
          {user?.bio}
        </p>
      </div>
    </div>
  );
};

export const OthersProfileCard = ({ userId }: ProfileCardProps) => {
  const firstRender = useRef<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  const getUserInfo = async () => {
    try {
      const res = await userService.getUser(userId);
      setProfile(res.profile);
    } catch (error) {
      console.log("Lỗi khi gọi getUserInfo: " + error);
    } finally {
      setLoading(false);
      firstRender.current = false;
    }
  };

  const unFriendHandler = async () => {
    try {
      setLoading(true);
      await friendService.unFriend(userId);
      getUserInfo();
    } catch (error) {
      console.log("Lỗi khi gọi unFriendHandler: " + error);
    }
  };

  const addFriendHandler = async () => {
    try {
      setLoading(true);
      await friendService.addFriend(userId);
      getUserInfo();
    } catch (error) {
      console.log("Lỗi khi gọi unFriendHandler: " + error);
    }
  };

  const acceptFriendHandler = async () => {
    try {
      if (!profile) return
      setLoading(true);
      await friendService.acceptFriendRequest(profile.receivedRequest!);
      getUserInfo();
    } catch (error) {
      console.log("Lỗi khi gọi unFriendHandler: " + error);
    }
  };

  const declineFriendHandler = async (id: string) => {
    try {
      setLoading(true);
      await friendService.declineFriendRequest(id);
      getUserInfo();
    } catch (error) {
      console.log("Lỗi khi gọi unFriendHandler: " + error);
    }
  };

  useEffect(() => {
    setLoading(true);
    getUserInfo();
  }, []);

  const renderButtons = () => {
    if (profile?.isFriend)
      return (
        <div className="group transition-smooth">
          <Button variant="primary" className="group-hover:hidden">
            <UserRoundCheck />
            Bạn bè
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="primary"
                className="hidden group-hover:flex active:flex"
              >
                <UserRoundX />
                Hủy kết bạn
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Xác nhận</DialogTitle>
                <DialogDescription>
                  Bạn có xác nhận hủy kết bạn với người này ?
                </DialogDescription>
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
        </div>
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
    <div className="w-full max-w-sm">
      {profile?.user && <ProfileCard user={profile.user} />}
      <div className="flex justify-around gap-1 items-center">
        {renderButtons()}
        <div className="border-r h-4 border-secondary"></div>
        <Button variant="primary">
          <Send />
          Nhắn tin
        </Button>
      </div>
    </div>
  );
};
