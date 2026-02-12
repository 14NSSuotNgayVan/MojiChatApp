import MediaCarousel from '@/components/gallery/carousel';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog.tsx';
import { mergeById } from '@/lib/utils.ts';
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
  const currentConvMedia = activeConversationId ? medias?.[activeConversationId] : null;

  const [loading, setLoading] = useState<boolean>(false);
  const [prevLoading, setPrevLoading] = useState<boolean>(false);
  const [nextLoading, setNextLoading] = useState<boolean>(false);

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
  };

  useEffect(() => {
    const handleGetGalleryById = async () => {
      try {
        setLoading(true);
        const res = await fileService.getMediasByMediaId(currentMedia._id, { limit: 2 });
        setMedia(activeConversationId!, (prev) => ({
          ...prev,
          items: res.medias,
          nextCursor: res.nextCursor,
          prevCursor: res.prevCursor,
        }));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (!currentConvMedia) {
      handleGetGalleryById();
      return;
    }

    const handleGetGalleryByRange = async (
      startId: string,
      endId: string,
      direction: 'next' | 'prev'
    ) => {
      try {
        setLoading(true);
        const res = await fileService.getMediasByRange(activeConversationId!, {
          startId,
          endId,
          direction,
        });
        setMedia(activeConversationId!, (prev) => ({
          ...prev,
          items:
            direction === 'prev'
              ? mergeById(res.medias, prev?.items || [])
              : mergeById(prev?.items || [], res.medias),
          nextCursor: direction === 'next' ? res?.nextCursor : prev?.nextCursor,
          prevCursor: direction === 'prev' ? res?.prevCursor : prev?.prevCursor,
        }));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    const isExisted = currentConvMedia.items.findIndex((i) => i._id === currentMedia._id) == -1;

    if (isExisted) {
      if (
        //onLeft
        currentConvMedia?.prevCursor?.createdAt &&
        new Date(currentMedia.createdAt) <= new Date(currentConvMedia?.prevCursor.createdAt)
      ) {
        handleGetGalleryByRange(currentMedia._id, currentConvMedia.prevCursor._id, 'prev');
      }
      if (
        //onRight
        currentConvMedia?.nextCursor?.createdAt &&
        new Date(currentMedia.createdAt) >= new Date(currentConvMedia?.nextCursor.createdAt)
      ) {
        handleGetGalleryByRange(currentConvMedia.nextCursor._id, currentMedia._id, 'next');
      }
    }
  }, []);

  const handleGetPrev = async (mediaId: string) => {
    if (!currentConvMedia?.prevCursor || !activeConversationId) return;
    try {
      setPrevLoading(true);
      const res = await fileService.getMedias(activeConversationId, {
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
    if (!currentConvMedia?.nextCursor || !activeConversationId) return;
    try {
      setNextLoading(true);
      const res = await fileService.getMedias(activeConversationId, {
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
            {currentConvMedia?.items?.length && !loading ? (
              <MediaCarousel
                key="carousel-main"
                slides={currentConvMedia?.items}
                defaultSelect={currentMedia}
                onClickFirst={handleGetPrev}
                onClickLast={handleGetNext}
                prevLoading={prevLoading}
                nextLoading={nextLoading}
                prevCursor={currentConvMedia?.prevCursor}
                nextCursor={currentConvMedia?.nextCursor}
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
