import { useState, useEffect } from 'react';
import type { Media } from '@/types/chat.ts';
import { ChatVideo } from '@/components/ui/video.tsx';
import { cn } from '@/lib/utils.ts';
import { ArrowLeft, ArrowRight, Play } from 'lucide-react';

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
  onClickLast?: () => void;
  onClickFirst?: () => void;
};

const MediaCarousel = (props: PropType) => {
  const { slides, defaultSelect, onClickLast, onClickFirst } = props;
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selected, setSelected] = useState<Media>(defaultSelect);

  const renderMedia = (media: Media) => {
    switch (media.type) {
      case 'image': {
        return <img src={media.url} className={'object-contain max-w-full h-full m-auto'} />;
      }

      case 'video': {
        return (
          <ChatVideo
            src={media.url}
            className={'object-contain h-full max-w-full'}
            videoClassName="object-contain"
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
    setSelectedIndex(index);
    handleScrollThumb(index);
    if (index === 0) {
      if (onClickFirst) onClickFirst();
    }

    if (index === slides.length - 1) {
      if (onClickLast) onClickLast();
    }
  };

  const handleClickNext = () => {
    if (selectedIndex + 1 < slides.length) {
      setSelected(slides[selectedIndex + 1]);
      handleScrollThumb(selectedIndex + 1);
    } else if (onClickLast) onClickLast();
  };

  const handleClickPrevious = () => {
    if (selectedIndex > 0) {
      setSelected(slides[selectedIndex - 1]);
      handleScrollThumb(selectedIndex - 1);
    } else if (onClickFirst) onClickFirst();
  };

  useEffect(() => {
    setSelectedIndex(slides.findIndex((i) => i._id === selected._id));
  }, [slides, selected]);

  // useEffect(() => {
  //   const handleKeyDown = (e: KeyboardEvent) => {
  //     if (e.key === 'ArrowLeft') {
  //       handleClickPrevious();
  //     }
  //     if (e.key === 'ArrowRight') {
  //       handleClickNext();
  //     }
  //   };

  //   document.addEventListener('keydown', handleKeyDown);

  //   return () => document.removeEventListener('keydown', handleKeyDown);
  // }, []);

  return (
    <div className="m-auto h-full flex flex-col">
      <div className="overflow-hidden grow">
        <div className="flex -ml-4 touch-pinch-zoom h-full select-none">
          {selected && (
            <div className={cn('pl-4 grow-0 shrink-0 basis-full')} key={selected._id}>
              <div className="h-full flex items-center justify-center gap-1">
                <button
                  className="p-2 hover:bg-muted rounded-full cursor-pointer active:-translate-x-0.5"
                  onClick={handleClickPrevious}
                >
                  <ArrowLeft />
                </button>
                <div className="grow h-full">{renderMedia(selected)}</div>
                <button
                  className="p-2 hover:bg-muted rounded-full cursor-pointer active:translate-x-0.5"
                  onClick={handleClickNext}
                >
                  <ArrowRight />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 h-1/9">
        <div className="overflow-x-auto h-full transition-all">
          <div
            id="thumb-slide"
            className="srhink-0 h-[calc(100%-0.25rem)] flex gap-3 pb-1 m-auto w-max my-0.5"
          >
            {slides.map((media, index) => (
              <Thumb
                key={media._id}
                onClick={() => onThumbClick(media, index)}
                selected={selectedIndex === index}
                media={media}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaCarousel;
