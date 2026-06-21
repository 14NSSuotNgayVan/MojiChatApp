import { useCallback, useState, type PointerEvent, type ReactNode } from 'react';
import { SmilePlus } from 'lucide-react';
import { useCanHover } from '@/hooks/use-can-hover.ts';
import { cn } from '@/lib/utils.ts';

export const REACTION_PRESETS = ['😂', '😭', '👍', '❤️', '😮', '😡'] as const;

const MORE_ITEM_ID = '__more__';

function resolveReactionItem(clientX: number, clientY: number) {
  const el = document.elementFromPoint(clientX, clientY);
  return el?.closest('[data-reaction-item]')?.getAttribute('data-reaction-item') ?? null;
}

type Props = {
  onSelect: (emoji: string) => void;
  onMoreClick?: () => void;
  myEmoji?: string;
  className?: string;
  compact?: boolean;
  moreTrigger?: ReactNode;
};

export function ReactionPresetBar({
  onSelect,
  onMoreClick,
  myEmoji,
  className,
  compact = false,
  moreTrigger,
}: Props) {
  const canHover = useCanHover();
  const [focusedId, setFocusedId] = useState<string | null>(null);

  const clearFocus = useCallback(() => setFocusedId(null), []);

  const itemClass = (id: string) =>
    cn(
      'flex shrink-0 items-center justify-center rounded-full transition-transform duration-150 ease-out touch-manipulation select-none',
      compact ? 'size-8 text-lg' : 'size-9 text-xl',
      canHover
        ? 'hover:scale-125 hover:bg-muted/60 active:scale-110'
        : focusedId === id
          ? 'scale-125 bg-muted/60'
          : 'scale-100',
      myEmoji === id && 'bg-muted-foreground/40'
    );

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (canHover) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setFocusedId(resolveReactionItem(e.clientX, e.clientY));
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (canHover || !e.currentTarget.hasPointerCapture(e.pointerId)) return;
    setFocusedId(resolveReactionItem(e.clientX, e.clientY));
  };

  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (canHover) return;
    const id = resolveReactionItem(e.clientX, e.clientY);
    if (id === MORE_ITEM_ID) {
      onMoreClick?.();
    } else if (id && REACTION_PRESETS.includes(id as (typeof REACTION_PRESETS)[number])) {
      onSelect(id);
    }
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    clearFocus();
  };

  return (
    <div
      className={cn(
        'flex items-center gap-0.5 rounded-full touch-none',
        compact
          ? 'bg-transparent px-1 py-1 shadow-none'
          : 'border border-border/50 bg-popover/95 px-2 py-1.5 shadow-lg backdrop-blur-md',
        className
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={clearFocus}
      onPointerLeave={canHover ? undefined : clearFocus}
    >
      {REACTION_PRESETS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          data-reaction-item={emoji}
          aria-label={`React ${emoji}`}
          className={itemClass(emoji)}
          onClick={canHover ? () => onSelect(emoji) : (e) => e.preventDefault()}
        >
          {emoji}
        </button>
      ))}
      {onMoreClick && (
        <button
          type="button"
          data-reaction-item={MORE_ITEM_ID}
          aria-label="Thêm reaction"
          className={cn(
            itemClass(MORE_ITEM_ID),
            'text-muted-foreground',
            canHover && 'hover:text-foreground'
          )}
          onClick={canHover ? onMoreClick : (e) => e.preventDefault()}
        >
          {moreTrigger ?? <SmilePlus className="size-5" />}
        </button>
      )}
    </div>
  );
}
