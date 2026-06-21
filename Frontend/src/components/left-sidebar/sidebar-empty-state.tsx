import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

type SidebarEmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function SidebarEmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: SidebarEmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
      <div className="flex size-10 items-center justify-center rounded-full bg-primary/15 text-primary">
        <Icon className="size-5" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" className="rounded-full" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
