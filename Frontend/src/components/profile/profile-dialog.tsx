import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog.tsx";
import { useAuthStore } from "../../stores/useAuthStore.ts";
import { cn } from "../../lib/utils.ts";
import { Separator } from "../ui/separator.tsx";
import { EditProfileForm } from "./profile-form.tsx";
import { ProfileCard } from "./profile-card.tsx";
import { Button } from "../ui/button.tsx";
import { PenLine } from "lucide-react";
import { useState } from "react";

type ProfileDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const MyProfileDialog = ({ open, onOpenChange }: ProfileDialogProps) => {
  const { user } = useAuthStore();
  const [mode, setMode] = useState<
    "view" | "edit-info" | "edit-avatar" | "edit-bg"
  >("view");

  const onOpenHandler = (open: boolean) => {
    onOpenChange(open);
    if (!open) setMode("view");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenHandler}>
      <DialogContent aria-describedby={undefined} className="">
        <DialogHeader>
          <DialogTitle>
            {mode === "view" ? "Thông tin tài khoản" : "Chỉnh sửa thông tin"}
          </DialogTitle>
        </DialogHeader>
        <div className="w-full overflow-hidden">
          <div
            className={cn(
              "w-[200%] flex transition-all",
              mode !== "view" ? "-translate-x-1/2" : "translate-x-0"
            )}
          >
            <div
              className={cn(
                "flex-1 max-w-1/2",
                mode !== "view" ? "h-0" : "h-auto"
              )}
            >
              {user && (
                <ProfileCard
                  user={user}
                  onBgClick={() => {}}
                  onAvtClick={() => {}}
                />
              )}
              <Separator className="mb-2" />
              <Button
                variant="primary"
                className="w-full"
                onClick={() => setMode("edit-info")}
              >
                <PenLine />
                Chỉnh sửa thông tin
              </Button>
            </div>
            <div
              className={cn(
                "flex-1 max-w-1/2",
                mode === "view" ? "h-0" : "h-auto"
              )}
            >
              <EditProfileForm handleBack={() => setMode("view")} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
