import { useState } from 'react';
import { useChatStore } from '../../stores/useChatStore.ts';
import type { Media, Message, MessageGroup, SeenBy } from '../../types/chat.ts';
import { Avatar, SeenAvatars } from '../avatars/avatar.tsx';
import { cn, getMessageTime } from '../../lib/utils.ts';
import { useAuthStore } from '../../stores/useAuthStore.ts';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover.tsx';
import { OthersProfileCard } from '../profile/profile-card.tsx';
import { ChatVideo } from '@/components/ui/video.tsx';
import { MediaGalleryDialog } from '@/components/gallery/media-gallery.tsx';

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

export const OtherMessage = ({
  message,
  indexMessageType,
}: {
  message: Message;
  indexMessageType: IndexMessageType;
}) => {
  const { users, activeConversation } = useChatStore();
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
        <div className="w-full flex flex-wrap gap-1">
          {message.medias?.map((mda) => (
            <MediaView
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

  return (
    <>
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
          {sender ? users[sender._id!]?.displayName : ''}
        </p>
      )}
      <div className="flex max-w-2/3 gap-1 items-end">
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
        <div className={cn('flex flex-col gap-1 max-w-full')}>
          {Boolean(message?.content) && (
            <div
              className={cn(
                'bg-secondary px-3 py-2 hover:bg-accent',
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
              {message.content}
            </div>
          )}
          {renderMediaGrid()}
        </div>
      </div>
      {seenByUsers && <SeenAvatars seenUsers={seenByUsers} />}
    </>
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
  const { activeConversation } = useChatStore();
  const { user } = useAuthStore();
  const seenByUsers = getMessageSeender(activeConversation?.seenBy || [], message._id, user!._id);

  const handleToggleMessage = () => {
    if (indexType.isFirst || indexType.isSingle) return;
    setIsShowDes((prev) => !prev);
  };

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
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
        {message.medias?.map((mda) => (
          <MediaView
            media={mda}
            className={'w-full max-w-2xs rounded-md aspect-square object-cover'}
          />
        ))}
      </div>;
    }
  };

  return (
    <>
      <p
        className={cn(
          'text-sm text-muted-foreground text-center hidden opacity-0 translate-y-4 slide-up-fade',
          isShowDes && 'block opacity-100 translate-y-0'
        )}
      >
        {getMessageTime(message.createdAt)}
      </p>
      <div className="self-end max-w-2/3 flex flex-col gap-1 items-end">
        {message.content && (
          <div
            className={cn(
              'bg-primary/40 px-3 py-2 hover:bg-accent',
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
            {message.content}
          </div>
        )}
        {renderMediaGrid()}
      </div>
      <SeenAvatars seenUsers={seenByUsers} />
    </>
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
