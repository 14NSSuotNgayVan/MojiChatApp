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
  const [data, setData] = useState<Media[]>([]);
  const [nextCursor, setNextCursor] = useState<string>('');
  const [prevCursor, setPrevCursor] = useState<string>('');
  const { activeConversationId } = useChatStore();
  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      setData([]);
    }
  };

  useEffect(() => {
    const handleGetGalleryById = async () => {
      try {
        const res = await fileService.getMediasByMediaId(currentMedia._id);
        setData(res.medias);
        setNextCursor(res.nextCursor);
        setPrevCursor(res.prevCursor);
      } catch (error) {
        console.error(error);
      }
    };
    handleGetGalleryById();
  }, [currentMedia._id]);

  const handleGetPrev = async () => {
    if (!prevCursor || !activeConversationId) return;
    try {
      const res = await fileService.getMedias(activeConversationId, {
        cursor: prevCursor,
        direction: 'prev',
      });
      setData((prev) => [...res.medias, ...prev]);
      setPrevCursor(res.prevCursor);
    } catch (error) {
      console.error(error);
    }
  };

  const handleGetNext = async () => {
    if (!nextCursor || !activeConversationId) return;
    try {
      const res = await fileService.getMedias(activeConversationId, {
        cursor: nextCursor,
        direction: 'next',
      });
      setData((prev) => [...prev, ...res.medias]);
      setNextCursor(res.nextCursor);
    } catch (error) {
      console.error(error);
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
            {data?.length ? (
              <MediaCarousel
                key="carousel-main"
                slides={data}
                defaultSelect={currentMedia}
                onClickFirst={handleGetPrev}
                onClickLast={handleGetNext}
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
