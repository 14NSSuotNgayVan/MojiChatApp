import React, { useEffect, useRef, useState } from "react";
import { Avatar } from "../avatar.tsx";
import { userService } from "../../services/userService.ts";
import Loading from "./loading.tsx";
import { Button } from "./button.tsx";
import {
  Check,
  ChevronLeft,
  PenLine,
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
} from "./dialog.tsx";
import type { Profile, User } from "../../types/user.ts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu.tsx";
import { useAuthStore } from "../../stores/useAuthStore.ts";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "./field.tsx";
import { Input } from "./input.tsx";
import { cn } from "../../lib/utils.ts";
import { Textarea } from "./textarea.tsx";
import { Separator } from "./separator.tsx";

interface ProfileCardProps {
  userId: string;
}

export const ProfileCard = ({ user }: { user: User }) => {
  return (
    <div className="w-full max-w-sm">
      {/* Background Image */}
      <div className="relative w-full aspect-video overflow-hidden bg-gray-200 rounded-lg">
        {user?.avtUrl && (
          <img
            src={user?.avtUrl}
            alt="Background"
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Content */}
      <div className=" py-4">
        {/* Avatar & Info */}
        <div className="flex items-end gap-4 mb-2 -mt-12 relative z-10">
          {user?.displayName && (
            <Avatar
              name={user?.displayName}
              avatarUrl={user?.avtUrl}
              className="w-20 h-20 rounded-full border-4 border-card bg-card object-cover"
            />
          )}
        </div>
        <div className="mb-2">
          <h2 className="text-xl font-bold text-foreground">
            {user?.displayName}
          </h2>
          <p className="text-xs">{user.email}</p>
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
      setLoading(true);
      await friendService.acceptFriendRequest(profile?.receivedRequest!);
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
                declineFriendHandler(profile?.receivedRequest!);
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
            declineFriendHandler(profile?.sentRequest!);
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

const schema = z.object({
  displayName: z.string().min(1, "Tên hiển thị là bắt buộc"),
  bio: z.string(),
  email: z.email("Email không đúng định dạng").min(1, "Email là bắt buộc"),
  phone: z.regex(
    /^(0|\+84)(3|5|7|8|9)\d{8}$/,
    "Số điện thoại không đúng định dạng"
  ),
});

type profileSchema = z.infer<typeof schema>;

const EditProfileForm = ({ handleBack }: { handleBack: () => void }) => {
  const { user } = useAuthStore();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<profileSchema>({
    resolver: zodResolver(schema),
    defaultValues: {
      ...user,
    },
  });

  const handleSubmitForm = async (data: profileSchema) => {};

  return (
    <div className="relative h-full">
      <form
        className="overflow-y-scroll mb-12"
        onSubmit={handleSubmit(handleSubmitForm)}
      >
        <FieldGroup className="gap-4">
          <Field>
            <Field>
              <FieldLabel htmlFor="displayName">Tên hiển thị</FieldLabel>
              <Input
                id="displayName"
                {...register("displayName")}
                type="string"
                placeholder="User 123"
              />

              {errors?.displayName && (
                <FieldDescription>
                  {errors?.displayName?.message}
                </FieldDescription>
              )}
            </Field>
          </Field>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              {...register("email")}
              type="email"
              placeholder="m@example.com"
            />

            {errors?.email && (
              <FieldDescription>{errors?.email?.message}</FieldDescription>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor="phone">Số điện thoại</FieldLabel>
            <Input
              id="phone"
              {...register("phone")}
              type="phone"
              placeholder="0987654321"
            />

            {errors?.phone && (
              <FieldDescription>{errors?.phone?.message}</FieldDescription>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor="phone">Tiểu sử</FieldLabel>
            <Textarea id="bio" {...register("bio")} placeholder="0987654321" />

            {errors?.bio && (
              <FieldDescription>{errors?.bio?.message}</FieldDescription>
            )}
          </Field>
        </FieldGroup>
      </form>
      <div className="absolute bottom-0 right-0 left-0 flex justify-between">
        <Button variant="primary" onClick={handleBack}>
          <ChevronLeft />
          Trở lại
        </Button>
        <Button variant="primary">Lưu</Button>
      </div>
    </div>
  );
};

export const MeProfileCard = () => {
  const { user } = useAuthStore();
  const [mode, setMode] = useState<"view" | "edit">("view");

  return (
    <div className="w-full max-w-sm overflow-hidden">
      <div
        className={cn(
          "w-[200%] flex transition-all",
          mode === "edit" ? "-translate-x-1/2" : "translate-x-0"
        )}
      >
        <div className={cn("flex-1", mode === "edit" ? "h-0" : "h-auto")}>
          {user && <ProfileCard user={user} />}
          <Separator className="mb-2" />
          <Button
            variant="primary"
            className="w-full"
            onClick={() => setMode("edit")}
          >
            <PenLine />
            Chỉnh sửa thông tin
          </Button>
        </div>
        <div className={cn("flex-1", mode === "view" ? "h-0" : "h-auto")}>
          <EditProfileForm handleBack={() => setMode("view")} />
        </div>
      </div>
    </div>
  );
};
