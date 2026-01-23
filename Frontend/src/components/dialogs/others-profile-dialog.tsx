import { OthersProfileCard } from '@/components/profile/profile-card.tsx';
import { Dialog, DialogContent } from '@/components/ui/dialog.tsx';

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  closeParent?: () => void;
};

export const OthersProfileDialog = ({ open, onOpenChange, userId, closeParent }: DialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-sm">
        <OthersProfileCard
          userId={userId}
          closeAll={() => {
            onOpenChange(false);
            if (closeParent) closeParent();
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
