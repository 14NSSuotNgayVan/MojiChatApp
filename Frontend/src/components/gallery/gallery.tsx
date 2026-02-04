import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel.tsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog.tsx';
import { ChatVideo } from '@/components/ui/video.tsx';
import { cn } from '@/lib/utils.ts';
import { type Media } from '@/types/chat.ts';
import { useEffect, useState } from 'react';

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentMedia: Media;
};

export const MediaGalleryDialog = ({ open, onOpenChange, currentMedia }: DialogProps) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<Media[]>([]);

  const handleGetGallery = async () => {
    setLoading(true);
    try {
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
    }
  };

  useEffect(() => {
    handleGetGallery();
  }, []);

  const renderMedia = (media: Media) => {
    switch (media.type) {
      case 'image': {
        return <img src={media.url} className={'object-contain max-w-full max-h-full m-auto'} />;
      }

      case 'video': {
        return (
          <ChatVideo
            src={media.url}
            className={'object-contain max-w-full max-h-full m-auto'}
            poster={media?.meta?.poster}
          />
        );
      }
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent aria-describedby={undefined} className="w-full max-w-full! h-screen">
          <DialogHeader className="shrink">
            <DialogTitle>MOJI</DialogTitle>
          </DialogHeader>
          <div className="w-full grow px-10 overflow-hidden">
            <Carousel className="h-full">
              <CarouselContent className="h-full">
                {data?.length ? (
                  data.map((media, index) => (
                    <CarouselItem key={index}>{renderMedia(media)}</CarouselItem>
                  ))
                ) : (
                  <CarouselItem key={'temp'}>{renderMedia(currentMedia)}</CarouselItem>
                )}
              </CarouselContent>
              <CarouselNext />
              <CarouselPrevious />
            </Carousel>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
