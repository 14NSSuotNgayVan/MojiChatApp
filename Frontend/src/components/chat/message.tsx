import { useState } from 'react';
import { useChatStore } from '../../stores/useChatStore.ts';
import type { Media, Message, MessageGroup, SeenBy } from '../../types/chat.ts';
import { Avatar, SeenAvatars } from '../avatars/avatar.tsx';
import { cn, escapeRegex, getMessageTime } from '../../lib/utils.ts';
import { useAuthStore } from '../../stores/useAuthStore.ts';
import { CornerUpLeft } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover.tsx';
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

const MessageHighlightText = ({ text, keyword }: { text: string; keyword: string }) => {
  const k = keyword.trim();
  if (!k) return <>{text}</>;
  try {
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
  } catch {
    return <>{text}</>;
  }
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
      className={cn(
        'flex flex-col gap-1',
        isSearchHighlight && 'ring-primary/80 rounded-lg ring-2 ring-offset-2 ring-offset-background'
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
      <div className="flex max-w-2/3 gap-1 items-end relative group w-max">
        <button
          type="button"
          aria-label="Reply to message"
          onClick={(e) => {
            e.stopPropagation();
            setReplyingTo(message);
          }}
          className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-14  opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-muted/70 hover:bg-muted/90 border rounded-full p-1 cursor-pointer"
        >
          <CornerUpLeft className="size-4" />
        </button>
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
        <div className={cn('flex flex-col gap-1 max-w-full w-max')}>
          {message.replyTo && (
            <div className="bg-secondary px-3 py-2 rounded-t-2xl translate-y-5 -mt-4">
              <p className="text-sm text-muted-foreground truncate pb-4">
                {truncateText(getReplyPreviewText(message.replyTo), 70)}
              </p>
            </div>
          )}
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
      className={cn(
        'flex flex-col gap-1',
        isSearchHighlight && 'ring-primary/80 rounded-lg ring-2 ring-offset-2 ring-offset-background'
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
      <div className="self-end max-w-2/3 flex flex-col items-end gap-1 relative group">
        <button
          type="button"
          aria-label="Reply to message"
          onClick={(e) => {
            e.stopPropagation();
            setReplyingTo(message);
          }}
          className="absolute top-1/2 left-0 -translate-x-14 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-muted/70 hover:bg-muted/90 border rounded-full p-1 cursor-pointer"
        >
          <CornerUpLeft className="size-4" />
        </button>
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
