import { cn } from '@/lib/utils';

type UnreadBadgeProps = {
  count: number | string;
  size?: 'sm' | 'md';
  className?: string;
};

export const UnreadBadge = ({ count, size = 'md', className }: UnreadBadgeProps) => {
  if (!count) return null;

  return (
    <div
      className={cn(
        'bg-destructive text-destructive-foreground rounded-full flex items-center justify-center font-medium',
        size === 'sm' && 'text-[10px] min-w-4 h-4 px-0.5',
        size === 'md' && 'text-xs px-1 min-h-4',
        className
      )}
    >
      {count}
    </div>
  );
};
