import { useCallback, useState, type ReactNode } from 'react';
import { useCanHover } from '../../hooks/use-can-hover.ts';
import { useLongPress } from '../../hooks/use-long-press.ts';
import { useChatStore } from '../../stores/useChatStore.ts';
import type { Media, Message, MessageGroup, SeenBy } from '../../types/chat.ts';
import { Avatar, SeenAvatars } from '../avatars/avatar.tsx';
import { cn, getMessageTime, splitByNormalizedKeyword } from '../../lib/utils.ts';
import { useAuthStore } from '../../stores/useAuthStore.ts';
import { CornerUpLeft, EllipsisVertical, Smile, SmilePlus } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover.tsx';
import { Dialog, DialogContent } from '../ui/dialog.tsx';
import { EmojiPicker, EmojiPickerContent, EmojiPickerSearch } from '../ui/emoji-picker.tsx';
import { OthersProfileCard } from '../profile/profile-card.tsx';
import { ReactionPresetBar } from './reaction-preset-bar.tsx';
import { ChatVideo } from '@/components/ui/video.tsx';
import { MediaGalleryDialog } from '@/components/gallery/media-gallery.tsx';
import { renderSystemMessage } from '@/utils/systemMessageText.tsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu.tsx';

type IndexMessageType = 'first' | 'middle' | 'last' | 'single';

const getMessageIndexType = (idx: number, total: number): IndexMessageType => {
  if (idx === 0 && total === 1) return 'single';
  if (idx === 0) return 'first';
  if (idx === total - 1) return 'last';
  return 'middle';
};

const getMessageSeender = (seenByUsers: SeenBy[], messageId: string, userId: string) => {
  return seenByUsers.filter((i) => i.messageId === messageId && userId !== i.userId);
};

const truncateText = (text: string, maxLen: number) => {
  const t = text?.trim?.() || '';
  if (!t) return '';
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen)}...`;
};

const getReplyPreviewText = (replyTo: Message['replyTo']) => {
  if (!replyTo) return '';
  const content = replyTo.content?.trim?.() || '';
  if (content) return content;
  if (replyTo.type && replyTo.type !== 'text') return 'Ảnh/Video';
  return 'Tin nhắn đã được thu hồi';
};

const messageActionBtnClass = (canHover: boolean, isActive: boolean, size: 'sm' | 'md' = 'md') =>
  cn(
    'transition-opacity z-10 bg-muted/70 hover:bg-muted/90 active:bg-muted border rounded-full cursor-pointer touch-manipulation',
    canHover
      ? size === 'sm'
        ? 'p-0.5'
        : 'p-1'
      : size === 'sm'
        ? 'p-1.5'
        : 'p-2',
    canHover
      ? 'opacity-0 group-hover:opacity-100'
      : isActive
        ? 'opacity-100'
        : 'opacity-0 pointer-events-none'
  );

function MessageActionsRow({
  align,
  children,
}: {
  align: 'start' | 'end';
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        'absolute top-1/2 -translate-y-1/2 flex items-center gap-1',
        align === 'start'
          ? 'right-0 translate-x-[calc(100%+0.5rem)]'
          : 'left-0 -translate-x-[calc(100%+0.5rem)] gap-0.5'
      )}
    >
      {children}
    </div>
  );
}

const MessageReactions = ({ message, isOwner }: { message: Message; isOwner: boolean }) => {
  const canHover = useCanHover();
  const { toggleMessageReaction } = useChatStore();
  const { user } = useAuthStore();
  const reactions = message.reactions ?? [];
  const myEmoji = user?._id ? reactions.find((r) => r.userId === user._id)?.emoji : undefined;

  const counts = reactions.reduce<Record<string, number>>((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] ?? 0) + 1;
    return acc;
  }, {});

  const entries = Object.entries(counts);

  const handleToggle = (emoji: string) => {
    if (!message.conversationId || !message._id) return;
    void toggleMessageReaction(message.conversationId, message._id, emoji);
  };
  return (
    <div
      className={cn(
        'absolute -bottom-1 translate-y-1/2 z-10 group/emoji transition-all bg-accent/50 rounded-full px-2',
        isOwner ? 'right-0' : 'left-full -translate-x-6'
      )}
    >
      {entries.length > 0 && (
        <div className="flex gap-0.5">
          {entries.map(([emoji, count]) => (
            <button
              key={emoji}
              type="button"
              className={cn(
                'flex items-center gap-1 py-0.5 text-xs rounded-full cursor-pointer',
                myEmoji === emoji
                  ? 'group-hover/emoji:bg-muted-foreground/50 text-foreground'
                  : 'text-muted-foreground'
              )}
              onClick={(e) => {
                e.stopPropagation();
                handleToggle(emoji);
              }}
            >
              <span
                className={cn('text-xs leading-none', canHover && 'group-hover/emoji:pl-0.5')}
              >
                {emoji}
              </span>
              <span
                className={cn(
                  'text-xs text-muted-foreground pr-1',
                  canHover ? 'hidden group-hover/emoji:block' : 'block'
                )}
              >
                x{count}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const MessageReactionBar = ({
  message,
  canHover,
  isActionsVisible,
}: {
  message: Message;
  canHover: boolean;
  isActionsVisible: boolean;
}) => {
  const { user } = useAuthStore();
  const { toggleMessageReaction } = useChatStore();
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  if (message.type === 'system') return null;
  const reactions = message.reactions ?? [];
  const myEmoji = user?._id ? reactions.find((r) => r.userId === user._id)?.emoji : undefined;

  const handleToggle = (emoji: string) => {
    if (!message.conversationId || !message._id) return;
    void toggleMessageReaction(message.conversationId, message._id, emoji);
  };

  return (
    <div className="flex flex-col gap-1 w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Reaction to message"
            onClick={(e) => e.stopPropagation()}
            className={messageActionBtnClass(canHover, isActionsVisible, 'sm')}
          >
            <Smile className="size-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-max p-2 bg-accent/70 rounded-full"
          align="center"
          side="top"
          onClick={(e) => e.stopPropagation()}
        >
          <ReactionPresetBar
            compact
            myEmoji={myEmoji}
            className="bg-transparent shadow-none border-0"
            onSelect={(emoji) => {
              handleToggle(emoji);
              setOpen(false);
            }}
            onMoreClick={() => {
              setOpen(false);
              setModalOpen(true);
            }}
            moreTrigger={<SmilePlus className="size-5" />}
          />
        </PopoverContent>
      </Popover>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent variant="centered" className="w-full max-w-sm p-0 sm:w-max">
          <EmojiPicker
            className="h-[min(420px,60dvh)] sm:h-[420px]"
            onEmojiSelect={({ emoji }) => {
              handleToggle(emoji);
              setModalOpen(false);
            }}
          >
            <EmojiPickerSearch />
            <EmojiPickerContent />
          </EmojiPicker>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const MessageDeleteMenu = ({
  message,
  isOwner,
  canHover,
  isActionsVisible,
}: {
  message: Message;
  isOwner: boolean;
  canHover: boolean;
  isActionsVisible: boolean;
}) => {
  const { deleteMessageForMe, deleteMessageForEveryone } = useChatStore();
  if (message.type === 'system' || message.isDeleted) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Message actions"
          onClick={(e) => e.stopPropagation()}
          className={messageActionBtnClass(canHover, isActionsVisible)}
        >
          <EllipsisVertical className="size-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
        {!message.isDeleted && (
          <DropdownMenuItem onClick={() => void deleteMessageForMe(message.conversationId, message._id)}>
            Xóa phía tôi
          </DropdownMenuItem>
        )}
        {isOwner && !message.isDeleted && (
          <DropdownMenuItem
            onClick={() => void deleteMessageForEveryone(message.conversationId, message._id)}
            className="text-destructive focus:text-destructive"
          >
            Xóa với tất cả mọi người
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const MessageHighlightText = ({ text, keyword }: { text: string; keyword: string }) => {
  const segments = splitByNormalizedKeyword(text, keyword);
  if (segments.length === 1 && !segments[0].match) return <>{text}</>;

  return (
    <>
      {segments.map((seg, i) =>
        seg.match ? (
          <mark key={i} className="rounded bg-yellow-400/40 px-0.5 dark:bg-yellow-500/25">
            {seg.value}
          </mark>
        ) : (
          <span key={i}>{seg.value}</span>
        )
      )}
    </>
  );
};

const MediaView = ({
  className,
  media,
  shouldSuppressClick,
}: {
  className: string;
  media: Media;
  shouldSuppressClick?: () => boolean;
}) => {
  const [openGallery, setOpenGallery] = useState<boolean>(false);

  const handleMediaOpen = () => {
    if (shouldSuppressClick?.()) return;
    setOpenGallery(true);
  };

  const renderMedia = () => {
    switch (media.type) {
      case 'image': {
        return (
          <img
            src={media.url}
            alt="Ảnh đính kèm"
            className={className}
            onClick={handleMediaOpen}
          />
        );
      }
      case 'video': {
        return (
          <ChatVideo
            src={media.url}
            className={className}
            poster={media?.meta?.poster}
            onClick={handleMediaOpen}
          />
        );
      }
    }
  };

  return (
    <>
      {openGallery && (
        <MediaGalleryDialog open={openGallery} onOpenChange={setOpenGallery} currentMedia={media} />
      )}
      <div data-media-view>{renderMedia()}</div>
    </>
  );
};

export const SystemMessage = ({ message }: { message: Message }) => {
  const { users } = useChatStore();
  const text = renderSystemMessage(message, users);

  return (
    <div className="flex justify-center py-1">
      <span className="text-xs text-muted-foreground bg-muted/20 dark:bg-muted/50 px-3 py-1 rounded-full">
        {text}
      </span>
    </div>
  );
};

export const OtherMessage = ({
  message,
  indexMessageType,
}: {
  message: Message;
  indexMessageType: IndexMessageType;
}) => {
  const {
    users,
    activeConversation,
    setReplyingTo,
    highlightedMessageId,
    messageSearchKeyword,
    activeMessageId,
    setActiveMessageId,
  } = useChatStore();
  const { user } = useAuthStore();
  const canHover = useCanHover();
  const isActionsVisible = canHover || activeMessageId === message._id;
  const indexType = {
    isFirst: indexMessageType === 'first',
    isMiddle: indexMessageType === 'middle',
    isLast: indexMessageType === 'last',
    isSingle: indexMessageType === 'single',
  };
  const participants = activeConversation?.participants;
  const sender = participants?.find((p) => p._id === message.senderId);
  const [isShowDes, setIsShowDes] = useState<boolean>(indexType.isFirst || indexType.isSingle);
  const seenByUsers = user
    ? getMessageSeender(activeConversation?.seenBy || [], message._id, user._id)
    : null;

  const handleToggleMessage = () => {
    if (indexType.isFirst || indexType.isSingle) return;
    setIsShowDes((prev) => !prev);
  };

  const showMessageActions = useCallback(() => {
    if (!message.isDeleted && message.type !== 'system') {
      setActiveMessageId(message._id);
    }
  }, [message._id, message.isDeleted, message.type, setActiveMessageId]);

  const { handlers: pressHandlers, shouldSuppressClick } = useLongPress({
    enabled: !canHover,
    onLongPress: showMessageActions,
    onPress: (event) => {
      if ((event.target as HTMLElement | null)?.closest('[data-media-view]')) return;
      handleToggleMessage();
    },
  });

  const handleBubbleClick = (e: React.MouseEvent) => {
    if (!canHover) return;
    e.stopPropagation();
    handleToggleMessage();
  };

  const renderMediaGrid = () => {
    const enterClass = message.isNew ? 'chat-msg-enter' : '';

    if (message.type === 'media' && message.medias?.length === 1) {
      return (
        <div className={enterClass}>
          <MediaView
            className={cn(
              'w-full max-w-2xs rounded-md overflow-hidden',
              indexType.isSingle && 'rounded-2xl',
              indexType.isFirst && 'rounded-3xl rounded-bl-sm',
              indexType.isLast && 'rounded-3xl rounded-tl-sm',
              indexType.isMiddle && 'rounded-3xl rounded-tl-sm rounded-bl-sm',
              isShowDes && !indexType.isFirst && 'rounded-2xl'
            )}
            media={message.medias[0]}
            shouldSuppressClick={shouldSuppressClick}
          />
        </div>
      );
    }

    if (message.type === 'mixed' && message.medias?.length === 1) {
      return (
        <div className={enterClass}>
          <MediaView
            media={message.medias?.[0]}
            className={cn(
              'w-full max-w-2xs rounded-md overflow-hidden',
              indexType.isSingle && 'rounded-3xl rounded-tl-sm',
              indexType.isFirst && 'rounded-3xl rounded-tl-sm rounded-bl-sm',
              indexType.isLast && 'rounded-3xl rounded-tl-sm',
              indexType.isMiddle && 'rounded-3xl rounded-tl-sm rounded-bl-sm'
            )}
            shouldSuppressClick={shouldSuppressClick}
          />
        </div>
      );
    }

    if (message.medias?.length && message.medias?.length > 1) {
      return (
        <div className={cn('max-w-full flex flex-wrap gap-1 w-max', enterClass)}>
          {message.medias?.map((mda) => (
            <MediaView
              key={mda._id}
              media={mda}
              className={cn(
                'w-full max-w-2xs rounded-md aspect-square object-cover overflow-hidden grow'
              )}
              shouldSuppressClick={shouldSuppressClick}
            />
          ))}
        </div>
      );
    }
  };

  const isSearchHighlight = highlightedMessageId === message._id;
  const isFocusedOnMobile = !canHover && activeMessageId === message._id;

  return (
    <div
      data-message-id={message._id}
      className={cn(
        'flex flex-col gap-1 group',
        isSearchHighlight && 'bg-primary/10 rounded-lg',
        isFocusedOnMobile && 'opacity-0 pointer-events-none'
      )}
    >
      <p
        className={cn(
          'text-sm text-muted-foreground text-center hidden slide-up-fade',
          isShowDes && 'block'
        )}
      >
        {getMessageTime(message.createdAt)}
      </p>
      {isShowDes && (
        <p className="max-w-2/3 ml-14 text-sm text-muted-foreground slide-up-fade">
          {sender ? users[sender._id!]?.displayName : ''}{' '}
          {message.replyTo &&
            (users[message.replyTo.senderId]?.displayName
              ? `đã trả lời ${message.replyTo.senderId === user?._id ? 'bạn' : users[message.replyTo.senderId]?.displayName}`
              : 'đã trả lời')}
        </p>
      )}
      <div
        className={cn(
          'flex flex-col max-w-2/3',
          message.reactions?.length && 'mb-3'
        )}
      >
        <div className="flex max-w-full gap-1 items-end relative w-max">
          {canHover && (
            <MessageActionsRow align="start">
              {!message.isDeleted && (
                <>
                  <MessageReactionBar
                    message={message}
                    canHover={canHover}
                    isActionsVisible={isActionsVisible}
                  />
                  <button
                    type="button"
                    aria-label="Reply to message"
                    onClick={(e) => {
                      e.stopPropagation();
                      setReplyingTo(message);
                    }}
                    className={messageActionBtnClass(canHover, isActionsVisible)}
                  >
                    <CornerUpLeft className="size-3" />
                  </button>
                </>
              )}
              <MessageDeleteMenu
                message={message}
                isOwner={false}
                canHover={canHover}
                isActionsVisible={isActionsVisible}
              />
            </MessageActionsRow>
          )}

        {indexType.isLast || indexType.isSingle ? (
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="rounded-full cursor-pointer"
                aria-label={`Xem hồ sơ ${sender?._id ? users[sender._id]?.displayName ?? 'người gửi' : 'người gửi'}`}
              >
                {sender && (
                  <Avatar
                    name={users[sender?._id]?.displayName}
                    avatarUrl={users[sender?._id]?.avtUrl}
                  />
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" side="bottom" className="w-80">
              {sender && <OthersProfileCard userId={sender?._id} />}
            </PopoverContent>
          </Popover>
        ) : (
          <div className="w-10 shrink-0"></div>
        )}
        <div
          className={cn(
            'flex flex-col gap-1 max-w-full w-max relative touch-manipulation select-none',
            !canHover && 'cursor-default'
          )}
          data-message-bubble
          {...pressHandlers}
        >
          {!message.isDeleted && message.replyTo && (
            <div className="bg-secondary px-3 py-2 rounded-t-2xl translate-y-5 -mt-4">
              <p className="text-sm text-muted-foreground truncate pb-4">
                {truncateText(getReplyPreviewText(message.replyTo), 70)}
              </p>
            </div>
          )}
          {!message.isDeleted && <MessageReactions message={message} isOwner={false} />}
          {message.isDeleted ? (
            <div className="bg-(--message) px-3 py-2 rounded-2xl italic text-muted-foreground">
              Tin nhắn đã được thu hồi
            </div>
          ) : Boolean(message?.content) && (
            <div
              className={cn(
                'bg-(--message) px-3 py-2 hover:bg-accent z-1',
                message.isNew && 'chat-msg-enter',
                ...(message.type === 'mixed'
                  ? [
                      'w-max max-w-full',
                      indexType.isSingle && 'rounded-3xl rounded-bl-sm',
                      indexType.isFirst && 'rounded-3xl rounded-bl-sm',
                      indexType.isLast && 'rounded-3xl rounded-tl-sm rounded-bl-sm',
                      indexType.isMiddle && 'rounded-3xl rounded-tl-sm rounded-bl-sm',
                    ]
                  : [
                      indexType.isSingle && 'rounded-2xl',
                      indexType.isFirst && 'rounded-3xl rounded-bl-sm',
                      indexType.isLast && 'rounded-3xl rounded-tl-sm',
                      indexType.isMiddle && 'rounded-3xl rounded-tl-sm rounded-bl-sm',
                      isShowDes && !indexType.isFirst && 'rounded-2xl',
                    ])
              )}
              onClick={canHover ? handleBubbleClick : undefined}
            >
              <MessageHighlightText text={message.content ?? ''} keyword={messageSearchKeyword} />
            </div>
          )}
          {!message.isDeleted && renderMediaGrid()}
        </div>
        </div>
      </div>
      {seenByUsers && <SeenAvatars seenUsers={seenByUsers} />}
    </div>
  );
};

export const OtherMessageGroup = ({ group }: { group: MessageGroup }) => {
  return (
    <div className="flex flex-col gap-1">
      {group.messages.map((mg, idx) => (
        <OtherMessage
          message={mg}
          indexMessageType={getMessageIndexType(idx, group.messages.length)}
          key={mg._id}
        />
      ))}
    </div>
  );
};

export const OwnerMessage = ({
  message,
  indexMessageType,
}: {
  message: Message;
  indexMessageType: IndexMessageType;
}) => {
  const indexType = {
    isFirst: indexMessageType === 'first',
    isMiddle: indexMessageType === 'middle',
    isLast: indexMessageType === 'last',
    isSingle: indexMessageType === 'single',
  };
  const [isShowDes, setIsShowDes] = useState<boolean>(indexType.isFirst || indexType.isSingle);
  const {
    activeConversation,
    users,
    setReplyingTo,
    highlightedMessageId,
    messageSearchKeyword,
    activeMessageId,
    setActiveMessageId,
  } = useChatStore();
  const { user } = useAuthStore();
  const canHover = useCanHover();
  const isActionsVisible = canHover || activeMessageId === message._id;
  const seenByUsers = getMessageSeender(activeConversation?.seenBy || [], message._id, user!._id);

  const handleToggleMessage = () => {
    if (indexType.isFirst || indexType.isSingle) return;
    setIsShowDes((prev) => !prev);
  };

  const showMessageActions = useCallback(() => {
    if (!message.isDeleted && message.type !== 'system') {
      setActiveMessageId(message._id);
    }
  }, [message._id, message.isDeleted, message.type, setActiveMessageId]);

  const { handlers: pressHandlers, shouldSuppressClick } = useLongPress({
    enabled: !canHover,
    onLongPress: showMessageActions,
    onPress: (event) => {
      if ((event.target as HTMLElement | null)?.closest('[data-media-view]')) return;
      handleToggleMessage();
    },
  });

  const handleBubbleClick = (e: React.MouseEvent) => {
    if (!canHover) return;
    e.stopPropagation();
    handleToggleMessage();
  };

  const renderMediaGrid = () => {
    const enterClass = message.isNew ? 'chat-msg-enter' : '';

    if (message.type === 'media' && message.medias?.length === 1) {
      return (
        <div className={enterClass}>
          <MediaView
            className={cn(
              'w-full max-w-2xs rounded-md max-h-96 overflow-hidden',
              indexType.isSingle && 'rounded-2xl',
              indexType.isFirst && 'rounded-3xl rounded-br-sm',
              indexType.isLast && 'rounded-3xl rounded-tr-sm',
              indexType.isMiddle && 'rounded-3xl rounded-tr-sm rounded-br-sm',
              isShowDes && !indexType.isFirst && 'rounded-2xl'
            )}
            media={message.medias[0]}
            shouldSuppressClick={shouldSuppressClick}
          />
        </div>
      );
    }
    if (message.type === 'mixed' && message.medias?.length === 1) {
      return (
        <div className={enterClass}>
          <MediaView
            media={message.medias?.[0]}
            className={cn(
              'w-full max-w-2xs rounded-md max-h-96 overflow-hidden',
              indexType.isSingle && 'rounded-3xl rounded-tr-sm',
              indexType.isFirst && 'rounded-3xl rounded-tr-sm rounded-br-sm',
              indexType.isLast && 'rounded-3xl rounded-tr-sm',
              indexType.isMiddle && 'rounded-3xl rounded-tr-sm rounded-br-sm'
            )}
            shouldSuppressClick={shouldSuppressClick}
          />
        </div>
      );
    }

    if (message.medias?.length && message.medias?.length > 1) {
      return (
        <div
          className={cn(
            'w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1',
            enterClass
          )}
        >
          {message.medias?.map((mda) => (
            <MediaView
              key={mda._id}
              media={mda}
              className={'w-full max-w-2xs rounded-md aspect-square object-cover'}
              shouldSuppressClick={shouldSuppressClick}
            />
          ))}
        </div>
      );
    }
  };

  const isSearchHighlight = highlightedMessageId === message._id;
  const isFocusedOnMobile = !canHover && activeMessageId === message._id;

  return (
    <div
      data-message-id={message._id}
      className={cn(
        'flex flex-col gap-1',
        isSearchHighlight && 'bg-primary/10 rounded-lg',
        isFocusedOnMobile && 'opacity-0 pointer-events-none'
      )}
    >
      <p
        className={cn(
          'text-sm text-muted-foreground text-center hidden opacity-0 translate-y-4 slide-up-fade',
          isShowDes && 'block opacity-100 translate-y-0'
        )}
      >
        {getMessageTime(message.createdAt)}
      </p>
      <div
        className={cn(
          'self-end max-w-2/3 flex flex-col items-end gap-1',
          message.reactions?.length && 'mb-3'
        )}
      >
        <div
          className={cn(
            'relative flex flex-col items-end gap-1 w-full group touch-manipulation select-none',
            !canHover && 'cursor-default'
          )}
          data-message-bubble
          {...pressHandlers}
        >
          {canHover && (
            <MessageActionsRow align="end">
              <MessageDeleteMenu
                message={message}
                isOwner
                canHover={canHover}
                isActionsVisible={isActionsVisible}
              />
              {!message.isDeleted && (
                <>
                  <button
                    type="button"
                    aria-label="Reply to message"
                    onClick={(e) => {
                      e.stopPropagation();
                      setReplyingTo(message);
                    }}
                    className={messageActionBtnClass(canHover, isActionsVisible)}
                  >
                    <CornerUpLeft className="size-3" />
                  </button>
                  <MessageReactionBar
                    message={message}
                    canHover={canHover}
                    isActionsVisible={isActionsVisible}
                  />
                </>
              )}
            </MessageActionsRow>
          )}
        {!message.isDeleted && message.replyTo && (
          <>
            <p className="text-xs text-muted-foreground truncate text-left w-full pl-2">
              {users[message.replyTo.senderId]?.displayName
                ? `Đã trả lời ${message.replyTo.senderId === user?._id ? 'Bản thân' : users[message.replyTo.senderId]?.displayName}`
                : 'Đã trả lời'}
            </p>
            <div className="w-full h-full">
              <div className="bg-secondary px-3 py-2 border-primary/40 rounded-t-2xl w-full translate-y-5 -mt-4">
                <p className="text-sm text-muted-foreground truncate pb-4">
                  {truncateText(getReplyPreviewText(message.replyTo), 70)}
                </p>
              </div>
            </div>
          </>
        )}
        {message.isDeleted ? (
          <div className="bg-(--message) px-3 py-2 rounded-2xl italic text-muted-foreground">
            Tin nhắn đã được thu hồi
          </div>
        ) : message.content && (
          <div
            className={cn(
              'bg-(--message) px-3 py-2 hover:bg-accent z-1',
              message.isNew && 'chat-msg-enter',
              ...(message.type === 'mixed'
                ? [
                    'w-max max-w-full',
                    indexType.isSingle && 'rounded-3xl rounded-br-sm',
                    indexType.isFirst && 'rounded-3xl rounded-br-sm',
                    indexType.isLast && 'rounded-3xl rounded-tr-sm rounded-br-sm',
                    indexType.isMiddle && 'rounded-3xl rounded-tr-sm rounded-br-sm',
                  ]
                : [
                    indexType.isSingle && 'rounded-2xl',
                    indexType.isFirst && 'rounded-3xl rounded-br-sm',
                    indexType.isLast && 'rounded-3xl rounded-tr-sm',
                    indexType.isMiddle && 'rounded-3xl rounded-tr-sm rounded-br-sm',
                    isShowDes && !indexType.isFirst && 'rounded-2xl',
                  ])
            )}
            onClick={canHover ? handleBubbleClick : undefined}
          >
            <MessageHighlightText text={message.content ?? ''} keyword={messageSearchKeyword} />
          </div>
        )}
        {!message.isDeleted && renderMediaGrid()}
        {!message.isDeleted && <MessageReactions message={message} isOwner />}
        </div>
      </div>
      <SeenAvatars seenUsers={seenByUsers} />
    </div>
  );
};

export const OwnerMessageGroup = ({ group }: { group: MessageGroup }) => {
  return (
    <div className="flex flex-col gap-1">
      {group.messages.map((mg, idx) => (
        <OwnerMessage
          message={mg}
          indexMessageType={getMessageIndexType(idx, group.messages.length)}
          key={mg._id}
        />
      ))}
    </div>
  );
};
