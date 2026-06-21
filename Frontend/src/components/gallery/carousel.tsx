import { useState, useEffect, useCallback } from 'react';
import type { Media } from '@/types/chat.ts';
import { ChatVideo } from '@/components/ui/video.tsx';
import { cn, getMessageTime } from '@/lib/utils.ts';
import { ArrowLeft, ArrowRight, Play } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { Avatar } from '@/components/avatars/avatar.tsx';
import { useChatStore } from '@/stores/useChatStore.ts';

const ThumbSkeleton = (number: number) => {
  return Array.from(new Array(number)).map(() => (
    <Skeleton className="grow-0 shrink-0 aspect-square h-full rounded-md overflow-hidden "></Skeleton>
  ));
};

type ThumbPropType = {
  selected: boolean;
  onClick: () => void;
  media: Media;
};

export const Thumb = (props: ThumbPropType) => {
  const { selected, onClick, media } = props;

  const renderMedia = (media: Media) => {
    switch (media.type) {
      case 'image': {
        return <img src={media.url} className="object-cover w-full h-full m-auto" />;
      }

      case 'video': {
        return (
          <div className="h-full relative">
            <img src={media?.meta?.poster} className="object-cover w-full h-full m-auto" />
            <Play className="w-1/5 absolute flex top-1/2 left-1/2 -translate-1/2 text-white" />
          </div>
        );
      }
    }
  };

  return (
    <div
      className={cn(
        'thumb grow-0 shrink-0 aspect-square h-full rounded-md overflow-hidden',
        selected
          ? 'border dark:border-white border-black brightness-100'
          : 'brightness-50 hover:brightness-100'
      )}
    >
      <button
        onClick={onClick}
        type="button"
        className="rounded-3xl touch-manipulation cursor-pointer h-full w-full select-none"
      >
        {renderMedia(media)}
      </button>
    </div>
  );
};

type PropType = {
  slides: Media[];
  defaultSelect: Media;
  onClickLast?: (mediaId: string) => void;
  onClickFirst?: (mediaId: string) => void;
  nextLoading?: boolean;
  prevLoading?: boolean;
  prevCursor?: {
    _id: string;
    createdAt: string;
  };
  nextCursor?: {
    _id: string;
    createdAt: string;
  };
};

const MediaCarousel = (props: PropType) => {
  const {
    slides,
    defaultSelect,
    onClickLast,
    onClickFirst,
    prevLoading,
    nextLoading,
    prevCursor,
    nextCursor,
  } = props;
  const [selected, setSelected] = useState<Media>(defaultSelect);
  const selectedIndex = slides.findIndex((i) => i._id === selected._id);
  const { users } = useChatStore();
  const renderMedia = (media: Media) => {
    switch (media.type) {
      case 'image': {
        return (
          <img
            src={media.url}
            alt=""
            className="max-h-full max-w-full object-contain"
          />
        );
      }

      case 'video': {
        return (
          <ChatVideo
            src={media.url}
            className="max-h-full max-w-full"
            videoClassName="max-h-full max-w-full object-contain"
            poster={media?.meta?.poster}
            showProgress
          />
        );
      }
    }
  };

  const handleScrollThumb = (index: number) => {
    const thumbSlide = document.getElementById('thumb-slide');
    if (!thumbSlide) return;
    const thumbs = thumbSlide.getElementsByClassName('thumb');

    if (!thumbs) return;
    thumbs?.[index].scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
  };

  const onThumbClick = (media: Media, index: number) => {
    setSelected(media);
    handleScrollThumb(index);
    if (index === 0 && prevCursor) {
      if (onClickFirst) onClickFirst(prevCursor._id);
    }

    if (index === slides.length - 1 && nextCursor) {
      if (onClickLast) onClickLast(nextCursor._id);
    }
  };

  const handleClickNext = useCallback(() => {
    if (selectedIndex + 1 < slides.length) {
      setSelected(slides[selectedIndex + 1]);
      handleScrollThumb(selectedIndex + 1);
      if (selectedIndex + 1 === slides.length - 1 && onClickLast && nextCursor)
        onClickLast(nextCursor?._id);
    }
  }, [selectedIndex, slides, onClickLast, nextCursor]);

  const handleClickPrevious = useCallback(() => {
    if (selectedIndex > 0) {
      setSelected(slides[selectedIndex - 1]);
      handleScrollThumb(selectedIndex - 1);
      if (selectedIndex - 1 === 0 && onClickFirst && prevCursor) onClickFirst(prevCursor._id);
    }
  }, [selectedIndex, slides, onClickFirst, prevCursor]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handleClickPrevious();
      }
      if (e.key === 'ArrowRight') {
        handleClickNext();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleClickPrevious, handleClickNext]);

  useEffect(() => {
    handleScrollThumb(slides.findIndex((i) => i._id === defaultSelect._id));
  }, [slides, defaultSelect]);

  const renderMediaInfo = () => {
    const sender = users[slides?.[selectedIndex].senderId];
    return (
      <div className="flex min-w-0 items-center gap-2">
        <Avatar name={sender?.displayName || ''} avatarUrl={sender?.avtUrl} />
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="truncate text-sm font-medium">{sender?.displayName}</div>
          <div className="text-xs text-muted-foreground">
            {getMessageTime(slides?.[selectedIndex].createdAt)}
          </div>
        </div>
      </div>
    );
  };

  const canGoPrevious = selectedIndex > 0;
  const canGoNext = selectedIndex + 1 < slides.length;

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col">
      <div className="relative flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden px-1 sm:px-2">
        {selected && (
          <>
            <button
              type="button"
              aria-label="Ảnh trước"
              disabled={!canGoPrevious}
              className={cn(
                'absolute left-1 top-1/2 z-10 -translate-y-1/2 rounded-full p-1.5 touch-manipulation sm:left-2 sm:p-2',
                'bg-background/70 backdrop-blur-sm hover:bg-muted active:-translate-x-0.5',
                !canGoPrevious && 'pointer-events-none opacity-30'
              )}
              onClick={handleClickPrevious}
            >
              <ArrowLeft className="size-5 sm:size-6" />
            </button>

            <div className="flex h-full w-full min-h-0 min-w-0 items-center justify-center px-9 sm:px-12">
              {renderMedia(selected)}
            </div>

            <button
              type="button"
              aria-label="Ảnh sau"
              disabled={!canGoNext}
              className={cn(
                'absolute right-1 top-1/2 z-10 -translate-y-1/2 rounded-full p-1.5 touch-manipulation sm:right-2 sm:p-2',
                'bg-background/70 backdrop-blur-sm hover:bg-muted active:translate-x-0.5',
                !canGoNext && 'pointer-events-none opacity-30'
              )}
              onClick={handleClickNext}
            >
              <ArrowRight className="size-5 sm:size-6" />
            </button>
          </>
        )}
      </div>

      <div className="mt-3 shrink-0">
        <div className="overflow-x-auto overflow-y-hidden transition-transform -mb-[7px]">
          <div id="thumb-slide" className="srhink-0 h-14 flex gap-3 pb-1 m-auto w-max my-0.5">
            {prevLoading && ThumbSkeleton(5)}
            {slides.map((media, index) => (
              <Thumb
                key={media._id}
                onClick={() => onThumbClick(media, index)}
                selected={selectedIndex === index}
                media={media}
              />
            ))}
            {nextLoading && ThumbSkeleton(5)}
          </div>
        </div>
      </div>

      <div className="shrink-0 px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 sm:pb-4">
        {renderMediaInfo()}
      </div>
    </div>
  );
};

export default MediaCarousel;
