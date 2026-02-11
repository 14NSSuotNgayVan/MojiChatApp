import { MediaGalleryDialog } from '@/components/gallery/media-gallery.tsx';
import { useChatStore } from '@/stores/useChatStore.ts';
import type { Media } from '@/types/chat.ts';
import { ChevronLeft, Play } from 'lucide-react';
import { useState } from 'react';

type Props = {
  onReturn: () => void;
};

export const SidebarGallery = ({ onReturn }: Props) => {
  const { medias, activeConversationId } = useChatStore();
  const currentConvMedia = activeConversationId ? medias[activeConversationId] : null;
  const [openGallery, setOpenGallery] = useState<boolean>(false);
  const [selectedMedia, setSelectedMedia] = useState<Media | null>();

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
    <>
      {openGallery && selectedMedia && (
        <MediaGalleryDialog
          open={openGallery}
          onOpenChange={setOpenGallery}
          currentMedia={selectedMedia}
        />
      )}
      <div className="flex flex-col h-full select-none">
        <div className="flex px-4 h-16 items-center select-none shrink-0">
          <button
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive cursor-pointer text-muted-foreground hover:bg-accent hover:text-foreground dark:text-foreground dark:hover:bg-accent/50 dark:hover:text-primary size-7"
            onClick={onReturn}
          >
            <ChevronLeft />
          </button>
          <p className="text-center text-lg font-semibold grow">Ảnh và phương tiện</p>
        </div>
        <div className="px-2 pb-2 grow overflow-y-auto">
          <div className="grid grid-cols-3 gap-1">
            {currentConvMedia?.items?.map((i) => (
              <div
                className="col-span-1 aspect-square rounded-sm overflow-hidden hover:cursor-pointer shrink-0"
                onClick={() => {
                  setOpenGallery(true);
                  setSelectedMedia(i);
                }}
              >
                {renderMedia(i)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
