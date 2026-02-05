import MediaCarousel from '@/components/gallery/carousel';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog.tsx';
import { fileService } from '@/services/fileService.ts';
import { type Media } from '@/types/chat.ts';
import { useEffect, useState } from 'react';

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentMedia: Media;
};

export const MediaGalleryDialog = ({ open, onOpenChange, currentMedia }: DialogProps) => {
  const [data, setData] = useState<Media[]>([]);

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
        setData(res);
      } catch (error) {
        console.error(error);
      }
    };
    handleGetGalleryById();
  }, [currentMedia._id]);

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
                defaultSelectIndex={data.findIndex((i) => i._id === currentMedia._id)}
              />
            ) : (
              <MediaCarousel
                key="carousel-temp"
                slides={[currentMedia]}
                defaultSelect={currentMedia}
                defaultSelectIndex={0}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
