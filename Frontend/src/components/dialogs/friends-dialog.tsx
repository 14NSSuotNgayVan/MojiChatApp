import { Avatar } from '@/components/avatars/avatar.tsx';
import { OthersProfileDialog } from '@/components/dialogs/others-profile-dialog.tsx';
import { Button } from '@/components/ui/button.tsx';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog.tsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';
import { Input } from '@/components/ui/input.tsx';
import Loading from '@/components/ui/loading.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { debounce, getNormalizeString } from '@/lib/utils.ts';
import { friendService } from '@/services/friendService.ts';
import type { ReceivedRequest, SentRequest } from '@/types/user.ts';
import { Check, SearchIcon, Undo2, UserRoundCheck, UserRoundX, X } from 'lucide-react';
import { useEffect, useState } from 'react';

type NotUser = {
  _id: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  avtUrl: string | null;
};

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type TabProps = {
  keyword: string;
  handleOpenProfile: (userId: string) => void;
};

const FRIEND_MANAGE_TABS = {
  FRIENDS: 'friends',
  RECEIVED_REQ: 'received_req',
  SENT_REQ: 'sent_req',
};

const FriendTab = ({ handleOpenProfile, keyword }: TabProps) => {
  const [loading, setLoading] = useState<boolean>(false);

  const [users, setUsers] = useState<NotUser[]>([]);

  const unFriendHandler = async (userId: string) => {
    try {
      setLoading(true);
      await friendService.unFriend(userId);
      handleGetFriends();
    } catch (error) {
      console.log('Lỗi khi gọi unFriendHandler: ' + error);
    }
  };

  useEffect(() => {
    handleGetFriends();
  }, [keyword]);

  const handleGetFriends = async () => {
    setLoading(true);
    try {
      const res = await friendService.getFriends({ keyword: keyword.trim() });
      setUsers(res?.friends);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return loading ? (
    <div className="flex justify-center items-center">
      <div className="w-4">
        <Loading />
      </div>
    </div>
  ) : (
    <>
      {!users?.length ? (
        <p className="text-primary text-center text-xs">Không tìm thấy bạn bè phù hợp.</p>
      ) : (
        <>
          {users?.map((user) => (
            <div
              className="group flex p-2 items-center justify-between rounded-sm gap-2 dark:hover:bg-muted hover:bg-secondary/50"
              onClick={() => {
                handleOpenProfile(user._id);
              }}
            >
              <div className="flex items-center gap-2">
                <Avatar name={user.displayName} avatarUrl={user?.avtUrl} />
                <p className="">{user.displayName}</p>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="primary" className="flex">
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
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        unFriendHandler(user._id);
                      }}
                      disabled={loading}
                    >
                      Xác nhận
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          ))}
        </>
      )}
    </>
  );
};

const ReceivedTab = ({ handleOpenProfile, keyword }: TabProps) => {
  const [loading, setLoading] = useState<boolean>(false);

  const [requets, setRequests] = useState<ReceivedRequest[]>([]);

  const acceptFriendHandler = async (id: string) => {
    try {
      setLoading(true);
      await friendService.acceptFriendRequest(id);
      handleGetFriendRequests();
    } catch (error) {
      console.log('Lỗi khi gọi acceptFriendHandler: ' + error);
    }
  };

  const declineFriendHandler = async (id: string) => {
    try {
      setLoading(true);
      await friendService.declineFriendRequest(id);
      handleGetFriendRequests();
    } catch (error) {
      console.log('Lỗi khi gọi declineFriendHandler: ' + error);
    }
  };

  useEffect(() => {
    handleGetFriendRequests();
  }, [keyword]);

  const handleGetFriendRequests = async () => {
    setLoading(true);
    try {
      const res = await friendService.getFriendRequests({ keyword: keyword.trim() });
      setRequests(res?.received);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return loading ? (
    <div className="flex justify-center items-center">
      <div className="w-4">
        <Loading />
      </div>
    </div>
  ) : (
    <>
      {!requets?.length ? (
        <p className="text-primary text-center text-xs">Không tìm thấy Lời mời.</p>
      ) : (
        <>
          {requets?.map((req) => (
            <div
              className="group flex p-2 items-center justify-between rounded-sm gap-2 dark:hover:bg-muted hover:bg-secondary/50"
              onClick={() => {
                handleOpenProfile(req.fromUser._id);
              }}
            >
              <div className="flex items-center gap-2">
                <Avatar name={req.fromUser.displayName} avatarUrl={req.fromUser?.avtUrl} />
                <p className="">{req.fromUser.displayName}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="primary" disabled={loading}>
                    <UserRoundCheck />
                    Phản hồi
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      acceptFriendHandler(req._id);
                    }}
                  >
                    <Check />
                    Chấp nhận
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      declineFriendHandler(req._id);
                    }}
                  >
                    <X />
                    Từ chối
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </>
      )}
    </>
  );
};

const SentTab = ({ handleOpenProfile, keyword }: TabProps) => {
  const [loading, setLoading] = useState<boolean>(false);

  const [requets, setRequests] = useState<SentRequest[]>([]);

  const declineFriendHandler = async (id: string) => {
    try {
      setLoading(true);
      await friendService.declineFriendRequest(id);
      handleGetFriendRequests();
    } catch (error) {
      console.log('Lỗi khi gọi declineFriendHandler: ' + error);
    }
  };

  useEffect(() => {
    handleGetFriendRequests();
  }, [keyword]);

  const handleGetFriendRequests = async () => {
    setLoading(true);
    try {
      const res = await friendService.getFriendRequests({ keyword: keyword.trim() });
      setRequests(res?.sent);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return loading ? (
    <div className="flex justify-center items-center">
      <div className="w-4">
        <Loading />
      </div>
    </div>
  ) : (
    <>
      {!requets?.length ? (
        <p className="text-primary text-center text-xs">Không tìm thấy Lời mời.</p>
      ) : (
        <>
          {requets?.map((req) => (
            <div
              className="group flex p-2 items-center justify-between rounded-sm gap-2 dark:hover:bg-muted hover:bg-secondary/50"
              onClick={() => {
                handleOpenProfile(req.toUser._id);
              }}
            >
              <div className="flex items-center gap-2">
                <Avatar name={req.toUser?.displayName} avatarUrl={req.toUser?.avtUrl} />
                <p className="">{req.toUser?.displayName}</p>
              </div>
              <Button
                variant="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  declineFriendHandler(req._id!);
                }}
                disabled={loading}
              >
                <Undo2 />
                Hoàn tác yêu cầu
              </Button>
            </div>
          ))}
        </>
      )}
    </>
  );
};

export const FriendsDialog = ({ open, onOpenChange }: DialogProps) => {
  const [openProfileDialog, setOpenProfileDialog] = useState<boolean>(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [keyword, setKeyword] = useState<string>('');

  const handleSearch = debounce((e) => {
    setKeyword(getNormalizeString(e?.target?.value));
  }, 500);

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      setKeyword('');
    }
  };

  const handleOpenProfile = (userId: string) => {
    setCurrentUserId(userId);
    setOpenProfileDialog(true);
  };

  return (
    <>
      {currentUserId && (
        <OthersProfileDialog
          open={openProfileDialog}
          onOpenChange={(open) => setOpenProfileDialog(open)}
          userId={currentUserId}
          closeParent={() => {
            onOpenChange(false);
          }}
        />
      )}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Bạn bè</DialogTitle>
          </DialogHeader>
          <div className="relative grow">
            <Input
              id={`input-search`}
              className="peer h-8 ps-8 pe-2 text-sm"
              placeholder={'Nhập tên, email hoặc số điện thoại...'}
              type="search"
              onChange={handleSearch}
            />
            <div className="text-white pointer-events-none absolute flex h-full top-0 items-center justify-center ps-2 peer-disabled:opacity-50">
              <SearchIcon className="text-primary" size={16} />
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Tabs defaultValue={FRIEND_MANAGE_TABS.FRIENDS} className="w-full">
              <TabsList variant="ghost">
                <TabsTrigger value={FRIEND_MANAGE_TABS.FRIENDS}>Bạn bè</TabsTrigger>
                <TabsTrigger value={FRIEND_MANAGE_TABS.RECEIVED_REQ}>Lời mời đã nhận</TabsTrigger>
                <TabsTrigger value={FRIEND_MANAGE_TABS.SENT_REQ}>Lời mời đã gửi</TabsTrigger>
              </TabsList>
              <TabsContent value={FRIEND_MANAGE_TABS.FRIENDS}>
                <FriendTab handleOpenProfile={handleOpenProfile} keyword={keyword} />
              </TabsContent>

              <TabsContent value={FRIEND_MANAGE_TABS.RECEIVED_REQ}>
                <ReceivedTab handleOpenProfile={handleOpenProfile} keyword={keyword} />
              </TabsContent>

              <TabsContent value={FRIEND_MANAGE_TABS.SENT_REQ}>
                <SentTab handleOpenProfile={handleOpenProfile} keyword={keyword} />
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
