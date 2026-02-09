import MediaCarousel from '@/components/gallery/carousel';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog.tsx';
import { fileService } from '@/services/fileService.ts';
import { useChatStore } from '@/stores/useChatStore.ts';
import { type Media } from '@/types/chat.ts';
import { useEffect, useState } from 'react';

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentMedia: Media;
};

export const MediaGalleryDialog = ({ open, onOpenChange, currentMedia }: DialogProps) => {
  const { medias, activeConversationId, setMedia } = useChatStore();
  const currentConvMedias = activeConversationId ? medias?.[activeConversationId] : null;

  const [prevLoading, setPrevLoading] = useState<boolean>(false);
  const [nextLoading, setNextLoading] = useState<boolean>(false);

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
  };

  useEffect(() => {
    const handleGetGalleryById = async () => {
      try {
        const res = await fileService.getMediasByMediaId(currentMedia._id, { limit: 2 });
        setMedia(activeConversationId!, (prev) => ({
          ...prev,
          items: res.medias,
          nextCursor: res.nextCursor,
          prevCursor: res.prevCursor,
        }));
      } catch (error) {
        console.error(error);
      }
    };

    if (!currentConvMedias) handleGetGalleryById();
  }, [currentMedia._id, setMedia, activeConversationId, currentConvMedias]);

  const handleGetPrev = async (mediaId: string) => {
    if (!currentConvMedias?.prevCursor || !activeConversationId) return;
    try {
      setPrevLoading(true);
      const res = await fileService.getMedias(activeConversationId, {
        cursor: currentConvMedias?.prevCursor,
        direction: 'prev',
        mediaId,
      });
      setMedia(activeConversationId, (prev) => ({
        ...prev,
        items: [...res.medias, ...(prev?.items || [])],
        prevCursor: res.prevCursor,
      }));
    } catch (error) {
      console.error(error);
    } finally {
      setPrevLoading(false);
    }
  };

  const handleGetNext = async (mediaId: string) => {
    if (!currentConvMedias?.nextCursor || !activeConversationId) return;
    try {
      setNextLoading(true);
      const res = await fileService.getMedias(activeConversationId, {
        cursor: currentConvMedias?.nextCursor,
        direction: 'next',
        mediaId,
      });
      setMedia(activeConversationId, (prev) => ({
        ...prev,
        items: [...(prev?.items || []), ...res.medias],
        nextCursor: res.nextCursor,
      }));
    } catch (error) {
      console.error(error);
    } finally {
      setNextLoading(false);
    }
  };
  console.log(medias);

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          aria-describedby={undefined}
          className="w-full max-w-full! h-screen flex flex-col"
        >
          <DialogHeader className="shrink">
            <DialogTitle>MOJI</DialogTitle>
          </DialogHeader>
          <div className="w-full grow overflow-hidden">
            {currentConvMedias?.items?.length ? (
              <MediaCarousel
                key="carousel-main"
                slides={currentConvMedias?.items}
                defaultSelect={currentMedia}
                onClickFirst={handleGetPrev}
                onClickLast={handleGetNext}
                prevLoading={prevLoading}
                nextLoading={nextLoading}
              />
            ) : (
              <MediaCarousel
                key="carousel-temp"
                slides={[currentMedia]}
                defaultSelect={currentMedia}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
