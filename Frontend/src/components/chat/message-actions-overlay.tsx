import { useCallback, useEffect, useMemo, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import {
  CornerUpLeft,
  Trash2,
} from 'lucide-react';
import { useCanHover } from '@/hooks/use-can-hover.ts';
import { useChatStore } from '@/stores/useChatStore.ts';
import { useAuthStore } from '@/stores/useAuthStore.ts';
import type { Media, Message } from '@/types/chat.ts';
import { cn } from '@/lib/utils.ts';
import { Dialog, DialogContent } from '@/components/ui/dialog.tsx';
import { EmojiPicker, EmojiPickerContent, EmojiPickerSearch } from '@/components/ui/emoji-picker.tsx';
import { ChatVideo } from '@/components/ui/video.tsx';
import { ReactionPresetBar } from '@/components/chat/reaction-preset-bar.tsx';
const REACTION_BAR_HEIGHT = 44;
const STACK_GAP = 8;

type Rect = Pick<DOMRect, 'top' | 'left' | 'right' | 'bottom' | 'width' | 'height'>;

function MessageBubblePreview({ message, isOwner }: { message: Message; isOwner: boolean }) {
  if (message.isDeleted) {
    return (
      <div
        data-message-bubble
        className="bg-(--message) px-3 py-2 rounded-2xl italic text-muted-foreground text-sm"
      >
        Tin nhắn đã được thu hồi
      </div>
    );
  }

  const renderMedia = (media: Media, className: string) => {
    if (media.type === 'image') {
      return <img src={media.url} alt="Ảnh đính kèm" className={className} draggable={false} />;
    }
    return (
      <ChatVideo
        src={media.url}
        className={className}
        poster={media?.meta?.poster}
        showProgress
      />
    );
  };

  return (
    <div
      data-message-bubble
      className={cn('flex flex-col gap-1 max-w-full', isOwner ? 'items-end' : 'items-start')}
    >
      {!message.isDeleted && message.replyTo && (
        <div className="bg-secondary px-3 py-2 rounded-t-2xl w-full max-w-full">
          <p className="text-sm text-muted-foreground truncate">
            {message.replyTo.content?.trim() || 'Tin nhắn đã được thu hồi'}
          </p>
        </div>
      )}
      {Boolean(message.content) && (
        <div className="bg-(--message) px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words">
          {message.content}
        </div>
      )}
      {message.medias?.map((media) => (
        <div key={media._id} className="max-w-full overflow-hidden rounded-2xl">
          {renderMedia(media, 'max-w-full max-h-72 w-full object-cover rounded-2xl')}
        </div>
      ))}
    </div>
  );
}

type Props = {
  scrollContainerRef: RefObject<HTMLElement | null>;
};

export function MessageActionsOverlay({ scrollContainerRef }: Props) {
  const canHover = useCanHover();
  const { user } = useAuthStore();
  const {
    activeMessageId,
    setActiveMessageId,
    messages,
    activeConversationId,
    setReplyingTo,
    deleteMessageForMe,
    deleteMessageForEveryone,
    toggleMessageReaction,
  } = useChatStore();

  const [rect, setRect] = useState<Rect | null>(null);
  const [emojiModalOpen, setEmojiModalOpen] = useState(false);

  const message = useMemo(() => {
    if (!activeMessageId || !activeConversationId) return null;
    return messages[activeConversationId]?.items?.find((m) => m._id === activeMessageId) ?? null;
  }, [activeMessageId, activeConversationId, messages]);

  const isOwner = !!message && message.senderId === user?._id;

  const close = useCallback(() => {
    setActiveMessageId(null);
    setEmojiModalOpen(false);
  }, [setActiveMessageId]);

  const measureMessage = useCallback(() => {
    if (!activeMessageId) return;
    const bubble =
      (document.querySelector(
        `[data-message-id="${activeMessageId}"] [data-message-bubble]`
      ) as HTMLElement | null) ??
      (document.querySelector(`[data-message-id="${activeMessageId}"]`) as HTMLElement | null);
    if (!bubble) return;
    const next = bubble.getBoundingClientRect();
    setRect({
      top: next.top,
      left: next.left,
      right: next.right,
      bottom: next.bottom,
      width: next.width,
      height: next.height,
    });
  }, [activeMessageId]);

  useEffect(() => {
    if (canHover || !activeMessageId) {
      setRect(null);
      return;
    }

    measureMessage();
    const scrollEl = scrollContainerRef.current;
    const onScroll = () => close();
    const onResize = () => measureMessage();

    scrollEl?.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    return () => {
      scrollEl?.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, [activeMessageId, canHover, close, measureMessage, scrollContainerRef]);

  useEffect(() => {
    if (canHover || !activeMessageId) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [activeMessageId, canHover]);

  if (canHover || !activeMessageId || !message || message.type === 'system' || !rect) {
    return null;
  }

  const stackWidth = Math.max(240, rect.width);
  let stackLeft = isOwner ? rect.right - stackWidth : rect.left;
  stackLeft = Math.max(8, Math.min(stackLeft, window.innerWidth - stackWidth - 8));
  const stackTop = Math.max(16, rect.top - REACTION_BAR_HEIGHT - STACK_GAP);

  const handleReply = () => {
    setReplyingTo(message);
    close();
  };

  const handleReaction = (emoji: string) => {
    if (!message.conversationId || !message._id) return;
    void toggleMessageReaction(message.conversationId, message._id, emoji);
    close();
  };

  const handleDeleteForMe = () => {
    if (!message.conversationId || !message._id) return;
    void deleteMessageForMe(message.conversationId, message._id);
    close();
  };

  const handleDeleteForEveryone = () => {
    if (!message.conversationId || !message._id) return;
    void deleteMessageForEveryone(message.conversationId, message._id);
    close();
  };

  const actionMenu = (
    <div className="min-w-[220px] overflow-hidden rounded-2xl border border-border/60 bg-popover/95 shadow-xl backdrop-blur-md">
      {!message.isDeleted && (
        <button
          type="button"
          className="flex w-full items-center justify-between px-4 py-3.5 text-sm active:bg-muted/60"
          onClick={handleReply}
        >
          <span>Trả lời</span>
          <CornerUpLeft className="size-5 text-muted-foreground" />
        </button>
      )}
      {!message.isDeleted && (
        <button
          type="button"
          className="flex w-full items-center justify-between border-t border-border/50 px-4 py-3.5 text-sm active:bg-muted/60"
          onClick={handleDeleteForMe}
        >
          <span>Xóa phía tôi</span>
          <Trash2 className="size-5 text-muted-foreground" />
        </button>
      )}
      {isOwner && !message.isDeleted && (
        <button
          type="button"
          className="flex w-full items-center justify-between border-t border-border/50 px-4 py-3.5 text-sm text-destructive active:bg-destructive/10"
          onClick={handleDeleteForEveryone}
        >
          <span>Xóa với tất cả mọi người</span>
          <Trash2 className="size-5" />
        </button>
      )}
    </div>
  );

  return createPortal(
    <>
      <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Thao tác tin nhắn">
        <button
          type="button"
          className="absolute inset-0 bg-black/45 backdrop-blur-md"
          onClick={close}
          aria-label="Đóng"
        />

        <div
          className="pointer-events-none fixed z-10 flex flex-col"
          style={{
            top: stackTop,
            left: stackLeft,
            width: stackWidth,
          }}
        >
          <div className="pointer-events-auto mb-2 flex justify-center">
            <ReactionPresetBar
              myEmoji={
                user?._id
                  ? message.reactions?.find((r) => r.userId === user._id)?.emoji
                  : undefined
              }
              onSelect={handleReaction}
              onMoreClick={() => setEmojiModalOpen(true)}
            />
          </div>

          <div
            className={cn('pointer-events-none flex', isOwner ? 'justify-end' : 'justify-start')}
            style={{ minHeight: rect.height }}
          >
            <div className="pointer-events-auto" style={{ width: rect.width, maxWidth: '100%' }}>
              <MessageBubblePreview message={message} isOwner={isOwner} />
            </div>
          </div>

          <div
            className={cn(
              'pointer-events-auto mt-2 flex',
              isOwner ? 'justify-end' : 'justify-start'
            )}
          >
            {actionMenu}
          </div>
        </div>
      </div>

      <Dialog open={emojiModalOpen} onOpenChange={setEmojiModalOpen}>
        <DialogContent variant="centered" className="z-[60] w-full max-w-sm p-0 sm:w-max">
          <EmojiPicker
            className="h-[min(420px,60dvh)] sm:h-[420px]"
            onEmojiSelect={({ emoji }) => {
              handleReaction(emoji);
              setEmojiModalOpen(false);
            }}
          >
            <EmojiPickerSearch />
            <EmojiPickerContent />
          </EmojiPicker>
        </DialogContent>
      </Dialog>
    </>,
    document.body
  );
}
