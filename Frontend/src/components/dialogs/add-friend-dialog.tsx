import { Avatar } from '@/components/avatars/avatar.tsx';
import { OthersProfileDialog } from '@/components/dialogs/others-profile-dialog.tsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog.tsx';
import { Input } from '@/components/ui/input.tsx';
import Loading from '@/components/ui/loading.tsx';
import { debounce } from '@/lib/utils.ts';
import { userService } from '@/services/userService.ts';
import { SearchIcon } from 'lucide-react';
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

export const AddFriendDialog = ({ open, onOpenChange }: DialogProps) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [openProfileDialog, setOpenProfileDialog] = useState<boolean>(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [filter, setFilter] = useState({
    keyword: '',
    isMore: false,
    size: 10,
  });
  const [users, setUsers] = useState<NotUser[]>([]);

  const handleSearch = debounce((e) => {
    setFilter((prev) => ({ ...prev, keyword: e?.target?.value }));
  }, 500);

  const handleGetUsers = async () => {
    setLoading(true);
    try {
      const res = await userService.getUsers({ keyword: filter.keyword });
      setUsers(res?.users);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      setUsers([]);
      setFilter({
        keyword: '',
        isMore: false,
        size: 10,
      });
    }
  };

  useEffect(() => {
    if (!filter.keyword?.trim()) return;
    handleGetUsers();
  }, [filter.keyword]);

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
            <DialogTitle>Thêm bạn bè</DialogTitle>
          </DialogHeader>
          <div className="relative grow">
            <Input
              id={`input-search`}
              className="peer h-8 ps-8 pe-2 text-sm"
              placeholder={'Tìm kiếm...'}
              type="search"
              onChange={handleSearch}
            />
            <div className="text-white pointer-events-none absolute flex h-full top-0 items-center justify-center ps-2 peer-disabled:opacity-50">
              <SearchIcon className="text-primary" size={16} />
            </div>
          </div>
          {filter?.keyword?.trim() ? (
            <>
              <p className="text-foreground text-sm">Kết quả</p>
              {loading ? (
                <div className="flex justify-center items-center">
                  <div className="w-4">
                    <Loading />
                  </div>
                </div>
              ) : (
                <>
                  {!users?.length ? (
                    <p className="text-primary text-center text-xs">
                      Không tìm thấy bạn bè phù hợp.
                    </p>
                  ) : (
                    users?.map((user) => (
                      <div
                        className="group flex p-2 items-center justify-between rounded-sm gap-2 hover:bg-muted"
                        onClick={() => {
                          setCurrentUserId(user._id);
                          setOpenProfileDialog(true);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <Avatar name={user.displayName} avatarUrl={user?.avtUrl} />
                          <p className="">{user.displayName}</p>
                        </div>
                      </div>
                    ))
                  )}
                </>
              )}
            </>
          ) : (
            <p className="text-muted-foreground text-xs text-center">
              Nhập tên, email hoặc số điện thoại của người bạn muốn kết bạn...
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
