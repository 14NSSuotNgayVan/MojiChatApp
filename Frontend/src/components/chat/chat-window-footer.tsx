import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover.tsx';
import { CircleX, ImagePlus, Send, Smile } from 'lucide-react';
import { EmojiPicker, EmojiPickerContent, EmojiPickerSearch } from '../ui/emoji-picker.tsx';
import { Button } from '../ui/button.tsx';
import { Input } from '../ui/input.tsx';
import { useChatStore } from '../../stores/useChatStore.ts';
import { useAuthStore } from '../../stores/useAuthStore.ts';
import { fileService } from '@/services/fileService.ts';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils.ts';
import CircularProgress from '@/components/progress-10.tsx';

type UploadImage = {
  id: string;
  file: File;
  preview: string; // base64 từ FileReader
  publicUrl?: string; // url Cloudinary
  publicId?: string; // id Cloudinary
  status: 'pending' | 'uploading' | 'done' | 'error';
};

export const ChatWindowFooter = () => {
  const [value, setValue] = useState<string>('');
  const [files, setFiles] = useState<UploadImage[]>([]);

  const { activeConversationId, activeConversation, sendDirectMessage, sendGroupMessage } =
    useChatStore();
  const { user } = useAuthStore();

  const { getRootProps, getInputProps, isDragAccept } = useDropzone({
    accept: {
      'image/*': [],
    },
    noClick: true,
    noKeyboard: true,
    onDrop(acceptedFiles) {
      if (!acceptedFiles?.length) return;

      acceptedFiles.forEach((file) => {
        const id = crypto.randomUUID();
        const reader = new FileReader();
        reader.onload = async (e) => {
          if (typeof e.target?.result === 'string') {
            setFiles((prev) => [
              ...prev,
              {
                id,
                file,
                preview: (e.target?.result as string) || '',
                status: 'uploading',
              },
            ]);
          }
          try {
            // 2️⃣ upload Cloudinary
            const res = await handleUploadImage(file);

            // 3️⃣ update publicUrl
            setFiles((prev) =>
              prev.map((img) =>
                img.id === id
                  ? {
                      ...img,
                      publicUrl: res.secure_url,
                      publicId: res.public_id,
                      status: 'done',
                    }
                  : img
              )
            );
          } catch (err) {
            console.log(err);
            setFiles((prev) =>
              prev.map((img) => (img.id === id ? { ...img, status: 'error' } : img))
            );
          }
        };
        reader.readAsDataURL(file);
      });
    },
  });

  const handleSendMessgae = async () => {
    const content = value;
    const imgUrls = files?.map((i) => i.publicUrl!);
    setValue('');
    setFiles([]);
    if (activeConversation?.type === 'direct') {
      const friend = activeConversation.participants.find((u) => u._id !== user!._id);

      await sendDirectMessage(activeConversationId!, friend!._id, content, imgUrls);
    } else {
      await sendGroupMessage(activeConversationId!, content, imgUrls);
    }
  };

  const handleUploadImage = async (file: File) => {
    try {
      if (!activeConversationId) return;
      const res = await fileService.uploadImage(file, activeConversationId);
      return res;
    } catch (error) {
      console.error('Lỗi khi gọi handleUploadImage:', error);
    }
  };

  const handleDeleteImage = (img: UploadImage) => {
    setFiles((prev) => prev.filter((f) => f.id !== img.id));
    if (!img.publicId) return;
    try {
      fileService.deleteFile(img.publicId);
    } catch (error) {
      console.log(error);
    }
  };

  const getProgress = (status: 'pending' | 'uploading' | 'done' | 'error') => {
    switch (status) {
      case 'pending': {
        return 0;
      }
      case 'uploading': {
        return 20;
      }
      case 'done': {
        return 100;
      }
      case 'error': {
        return 0;
      }
      default: {
        return 0;
      }
    }
  };

  const isSendable =
    value.trim() || (files?.length ? files?.every((f) => f?.status === 'done') : false);

  return (
    <footer className="p-2 flex border-t gap-2 items-center">
      <label
        htmlFor="chat-file-input"
        className="hover:bg-accent transition-colors p-2 rounded-md cursor-pointer"
      >
        <ImagePlus className="size-4" />
      </label>
      {/* Vùng drop ảnh */}
      <div
        className={cn(
          'flex-1 relative rounded-md',
          isDragAccept &&
            'bg-accent after:border-accent-foreground after:absolute after:inset-0 after:border-dashed after:border after:rounded-md'
        )}
        {...getRootProps()}
      >
        {/* vùng xem trước ảnh */}
        <div className="absolute pt-2 mx-4 flex gap-2 overflow-x-auto">
          {files.map((i) => (
            <div className="relative shrink-0">
              {/* progress */}
              <div
                className={cn(
                  'absolute top-1/2 right-1/2 translate-x-1/2 -translate-y-1/2 z-30',
                  i.status === 'done' && 'progress-faded-out'
                )}
              >
                <CircularProgress
                  className="stroke-gray-500"
                  progressClassName="stroke-white"
                  size={40}
                  strokeWidth={4}
                  value={getProgress(i.status)}
                />
              </div>
              {/* nút xóa */}
              <CircleX
                className="absolute right-0 size-4 text-white bg-muted-foreground dark:bg-muted-foreground/50 rounded-full cursor-pointer"
                onClick={() => handleDeleteImage(i)}
              />
              <img src={i.preview} className="w-14 h-14 rounded-md object-contain border" />
            </div>
          ))}
        </div>
        <input id="chat-file-input" {...getInputProps()}></input>

        {/* Input nhập tin nhắn */}
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.repeat) {
              e.preventDefault();
              handleSendMessgae();
            }
          }}
          className={cn('pr-8 h-10', !!files?.length && 'h-28 pt-18 transition-all')}
        ></Input>

        {/* Modal icon */}
        <Popover>
          <PopoverTrigger
            asChild
            className="cursor-pointer absolute bottom-1.5 right-0.5 resize-none"
          >
            <Smile className="hover:bg-accent size-7 transition-colors p-1 rounded-full" />
          </PopoverTrigger>
          <PopoverContent className="w-fit p-0 m-2" align="end">
            <EmojiPicker
              className="h-[342px]"
              onEmojiSelect={({ emoji }) => {
                setValue((prev) => prev + emoji);
              }}
            >
              <EmojiPickerSearch />
              <EmojiPickerContent />
            </EmojiPicker>
          </PopoverContent>
        </Popover>
      </div>
      <Button
        size="sm"
        variant="ghost"
        className="hover:bg-accent transition-colors size-9 p-2"
        onClick={handleSendMessgae}
        disabled={!isSendable}
      >
        <Send />
      </Button>
    </footer>
  );
};
