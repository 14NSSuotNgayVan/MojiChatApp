import { useState } from 'react';
import { useChatStore } from '../../stores/useChatStore.ts';
import type { Media, Message, MessageGroup, SeenBy } from '../../types/chat.ts';
import { Avatar, SeenAvatars } from '../avatars/avatar.tsx';
import { cn, escapeRegex, getMessageTime } from '../../lib/utils.ts';
import { useAuthStore } from '../../stores/useAuthStore.ts';
import { CornerUpLeft, Smile, SmilePlus } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover.tsx';
import { Button } from '../ui/button.tsx';
import { Dialog, DialogContent } from '../ui/dialog.tsx';
import { EmojiPicker, EmojiPickerContent, EmojiPickerSearch } from '../ui/emoji-picker.tsx';
import { OthersProfileCard } from '../profile/profile-card.tsx';
import { ChatVideo } from '@/components/ui/video.tsx';
import { MediaGalleryDialog } from '@/components/gallery/media-gallery.tsx';
import { renderSystemMessage } from '@/utils/systemMessageText.tsx';

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
  return '';
};

const REACTION_PRESETS = ['😂', '😭', '👍', '❤️', '😮', '😡'] as const;

const MessageReactions = ({ message, isOwner }: { message: Message; isOwner: boolean }) => {
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
              <span className="text-xs leading-none group-hover/emoji:pl-0.5">{emoji}</span>
              <span className="text-xs text-muted-foreground hidden group-hover/emoji:block group-hover/emoji:pr-1">
                x{count}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const MessageReactionBar = ({ message }: { message: Message }) => {
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
            className="opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-muted/70 hover:bg-muted/90 border rounded-full p-0.5 cursor-pointer"
          >
            <Smile className="size-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-max p-2  bg-accent/70 rounded-full"
          align="center"
          side="top"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-wrap gap-1 items-center">
            {REACTION_PRESETS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className={cn(
                  'flex size-6 items-center justify-center rounded-sm text-lg hover:scale-200 hover:mx-2 transition-all p-1',
                  myEmoji === emoji && 'bg-muted-foreground/50'
                )}
                onClick={() => {
                  handleToggle(emoji);
                  setOpen(false);
                }}
              >
                {emoji}
              </button>
            ))}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setOpen(false);
                setModalOpen(true);
              }}
              className="p-1! size-5"
            >
              <SmilePlus className="size-5" />
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="w-max p-0">
          <EmojiPicker
            className="h-[420px]"
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

const MessageHighlightText = ({ text, keyword }: { text: string; keyword: string }) => {
  const k = keyword.trim();
  if (!k) return <>{text}</>;
  const re = new RegExp(`(${escapeRegex(k)})`, 'gi');
  const parts = text.split(re);
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === k.toLowerCase() ? (
          <mark key={i} className="rounded bg-yellow-400/40 px-0.5 dark:bg-yellow-500/25">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
};

const MediaView = ({ className, media }: { className: string; media: Media }) => {
  const [openGallery, setOpenGallery] = useState<boolean>(false);

  const renderMedia = () => {
    switch (media.type) {
      case 'image': {
        return (
          <img
            src={media.url}
            className={className}
            onClick={() => {
              setOpenGallery(true);
            }}
          />
        );
      }
      case 'video': {
        return (
          <ChatVideo
            src={media.url}
            className={className}
            poster={media?.meta?.poster}
            onClick={() => {
              setOpenGallery(true);
            }}
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
      {renderMedia()}
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
  const { users, activeConversation, setReplyingTo, highlightedMessageId, messageSearchKeyword } =
    useChatStore();
  const { user } = useAuthStore();
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

  const renderMediaGrid = () => {
    if (message.type === 'media' && message.medias?.length === 1) {
      return (
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
        />
      );
    }

    if (message.type === 'mixed' && message.medias?.length === 1) {
      return (
        <MediaView
          media={message.medias?.[0]}
          className={cn(
            'w-full max-w-2xs rounded-md overflow-hidden',
            indexType.isSingle && 'rounded-3xl rounded-tl-sm',
            indexType.isFirst && 'rounded-3xl rounded-tl-sm rounded-bl-sm',
            indexType.isLast && 'rounded-3xl rounded-tl-sm',
            indexType.isMiddle && 'rounded-3xl rounded-tl-sm rounded-bl-sm'
          )}
        />
      );
    }

    if (message.medias?.length && message.medias?.length > 1) {
      return (
        <div className="max-w-full flex flex-wrap gap-1 w-max">
          {message.medias?.map((mda) => (
            <MediaView
              key={mda._id}
              media={mda}
              className={cn(
                'w-full max-w-2xs rounded-md aspect-square object-cover overflow-hidden grow'
              )}
            />
          ))}
        </div>
      );
    }
  };

  const isSearchHighlight = highlightedMessageId === message._id;

  return (
    <div
      data-message-id={message._id}
      className={cn('flex flex-col gap-1 group', isSearchHighlight && 'bg-primary/10 rounded-lg')}
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
          'flex max-w-2/3 gap-1 items-end relative w-max',
          message.reactions?.length && 'mb-3'
        )}
      >
        <div className="absolute top-1/2 right-0 -translate-y-1/2 flex translate-x-[calc(100%+0.5rem)] items-center gap-1">
          <MessageReactionBar message={message} />
          <button
            type="button"
            aria-label="Reply to message"
            onClick={(e) => {
              e.stopPropagation();
              setReplyingTo(message);
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-muted/70 hover:bg-muted/90 border rounded-full p-1 cursor-pointer"
          >
            <CornerUpLeft className="size-3" />
          </button>
        </div>

        {indexType.isLast || indexType.isSingle ? (
          <Popover>
            <PopoverTrigger>
              {sender && (
                <Avatar
                  name={users[sender?._id]?.displayName}
                  avatarUrl={users[sender?._id]?.avtUrl}
                />
              )}
            </PopoverTrigger>
            <PopoverContent align="start" side="bottom" className="w-80">
              {sender && <OthersProfileCard userId={sender?._id} />}
            </PopoverContent>
          </Popover>
        ) : (
          <div className="w-10 shrink-0"></div>
        )}
        <div className={cn('flex flex-col gap-1 max-w-full w-max relative')}>
          {message.replyTo && (
            <div className="bg-secondary px-3 py-2 rounded-t-2xl translate-y-5 -mt-4">
              <p className="text-sm text-muted-foreground truncate pb-4">
                {truncateText(getReplyPreviewText(message.replyTo), 70)}
              </p>
            </div>
          )}
          <MessageReactions message={message} isOwner={false} />
          {Boolean(message?.content) && (
            <div
              className={cn(
                'bg-(--message) px-3 py-2 hover:bg-accent z-1',
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
              onClick={handleToggleMessage}
            >
              <MessageHighlightText text={message.content ?? ''} keyword={messageSearchKeyword} />
            </div>
          )}
          {renderMediaGrid()}
        </div>
      </div>
      {seenByUsers && <SeenAvatars seenUsers={seenByUsers} />}
    </div>
  );
};

export const OtherMessageGroup = ({ group }: { group: MessageGroup }) => {
  return (
    <div className="flex flex-col gap-1 zoom-in">
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
  const { activeConversation, users, setReplyingTo, highlightedMessageId, messageSearchKeyword } =
    useChatStore();
  const { user } = useAuthStore();
  const seenByUsers = getMessageSeender(activeConversation?.seenBy || [], message._id, user!._id);

  const handleToggleMessage = () => {
    if (indexType.isFirst || indexType.isSingle) return;
    setIsShowDes((prev) => !prev);
  };

  const isSearchHighlight = highlightedMessageId === message._id;

  const renderMediaGrid = () => {
    if (message.type === 'media' && message.medias?.length === 1) {
      return (
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
        />
      );
    }
    if (message.type === 'mixed' && message.medias?.length === 1) {
      return (
        <MediaView
          media={message.medias?.[0]}
          className={cn(
            'w-full max-w-2xs rounded-md max-h-96 overflow-hidden',
            indexType.isSingle && 'rounded-3xl rounded-tr-sm',
            indexType.isFirst && 'rounded-3xl rounded-tr-sm rounded-br-sm',
            indexType.isLast && 'rounded-3xl rounded-tr-sm',
            indexType.isMiddle && 'rounded-3xl rounded-tr-sm rounded-br-sm'
          )}
        />
      );
    }

    if (message.medias?.length && message.medias?.length > 1) {
      return (
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
          {message.medias?.map((mda) => (
            <MediaView
              media={mda}
              className={'w-full max-w-2xs rounded-md aspect-square object-cover'}
            />
          ))}
        </div>
      );
    }
  };

  return (
    <div
      data-message-id={message._id}
      className={cn('flex flex-col gap-1', isSearchHighlight && 'bg-primary/10 rounded-lg')}
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
          'self-end max-w-2/3 flex flex-col items-end gap-1 relative group',
          message.reactions?.length && 'mb-3'
        )}
      >
        <div className="absolute top-1/2 left-0 -translate-x-14 -translate-y-1/2 flex items-center gap-0.5">
          <button
            type="button"
            aria-label="Reply to message"
            onClick={(e) => {
              e.stopPropagation();
              setReplyingTo(message);
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-muted/70 hover:bg-muted/90 border rounded-full p-1 cursor-pointer"
          >
            <CornerUpLeft className="size-3" />
          </button>
          <MessageReactionBar message={message} />
        </div>
        {message.replyTo && (
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
        {message.content && (
          <div
            className={cn(
              'bg-(--message) px-3 py-2 hover:bg-accent z-1',
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
            onClick={handleToggleMessage}
          >
            <MessageHighlightText text={message.content ?? ''} keyword={messageSearchKeyword} />
          </div>
        )}
        {renderMediaGrid()}
        <MessageReactions message={message} isOwner />
      </div>
      <SeenAvatars seenUsers={seenByUsers} />
    </div>
  );
};

export const OwnerMessageGroup = ({ group }: { group: MessageGroup }) => {
  return (
    <div className="flex flex-col gap-1 zoom-in">
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
