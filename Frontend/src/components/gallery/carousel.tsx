import { useState, useCallback } from 'react';
import type { Media } from '@/types/chat.ts';
import { ChatVideo } from '@/components/ui/video.tsx';
import { cn } from '@/lib/utils.ts';
import { Play } from 'lucide-react';

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
            <Play className="w-1/5 absolute flex top-1/2 left-1/2 -translate-1/2" />
          </div>
        );
      }
    }
  };

  return (
    <div
      className={cn(
        'grow-0 shrink-0 aspect-square h-full rounded-md overflow-hidden',
        selected ? 'border border-white brightness-100' : 'brightness-50 hover:brightness-100'
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
  defaultSelectIndex: number;
};

const MediaCarousel = (props: PropType) => {
  const { slides, defaultSelect, defaultSelectIndex } = props;
  const [selectedIndex, setSelectedIndex] = useState(defaultSelectIndex);
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
          />
        );
      }
    }
  };

  const onThumbClick = useCallback((media: Media, index: number) => {
    setSelected(media);
    setSelectedIndex(index);
  }, []);

  return (
    <div className="m-auto h-full flex flex-col">
      <div className="overflow-hidden grow">
        <div className="flex -ml-4 touch-pinch-zoom h-full select-none">
          {selected && (
            <div className={cn('pl-4 grow-0 shrink-0 basis-full')} key={selected._id}>
              <div className="h-full flex items-center justify-center">{renderMedia(selected)}</div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 h-1/10">
        <div className="overflow-x-scroll h-full">
          <div className=" h-full flex gap-3 justify-center">
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
