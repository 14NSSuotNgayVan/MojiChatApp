import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover.tsx';
import { CircleX, ImagePlus, Play, Send, Smile } from 'lucide-react';
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
  type: 'image' | 'video';
  duration?: number;
  poster?: string;
};

export const ChatWindowFooter = () => {
  const [value, setValue] = useState<string>('');
  const [files, setFiles] = useState<UploadImage[]>([]);
  const [fileInputKey, setFileInputKey] = useState<string>(crypto.randomUUID());
  const { activeConversationId, activeConversation, sendDirectMessage, sendGroupMessage } =
    useChatStore();
  const { user } = useAuthStore();

  const { getRootProps, getInputProps, isDragAccept } = useDropzone({
    accept: {
      'image/*': [],
      'video/*': [],
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
                type: file.type === 'video/mp4' ? 'video' : 'image',
              },
            ]);
          }
          try {
            // 2️⃣ upload Cloudinary
            const res = await handleUploadMedia(file);

            // 3️⃣ update publicUrl
            setFiles((prev) =>
              prev.map((file) =>
                file.id === id
                  ? {
                      ...file,
                      publicUrl: res.secure_url,
                      publicId: res.public_id,
                      poster: `${res.url.split('/video/upload')[0]}/video/upload/so_1/${res.public_id}.jpg`,
                      duration: res?.duration,
                      status: 'done',
                    }
                  : file
              )
            );
          } catch (err) {
            console.log(err);
            setFiles((prev) =>
              prev.map((file) => (file.id === id ? { ...file, status: 'error' } : file))
            );
          }
        };
        reader.readAsDataURL(file);
      });
    },
  });

  const handleSendMessage = async () => {
    const content = value;
    const media = files?.map((file) => ({
      url: file.publicUrl!,
      type: file?.type,
      poster: file?.poster,
      duration: file?.duration,
    }));
    setValue('');
    setFiles([]);
    setFileInputKey(crypto.randomUUID());
    if (activeConversation?.type === 'direct') {
      const friend = activeConversation.participants.find((u) => u._id !== user!._id);

      await sendDirectMessage(activeConversationId!, friend!._id, content, media);
    } else {
      await sendGroupMessage(activeConversationId!, content, media);
    }
  };

  const handleUploadMedia = async (file: File) => {
    try {
      if (!activeConversationId) return;
      const res = await fileService.uploadMedia(file, activeConversationId);
      return res;
    } catch (error) {
      console.error('Lỗi khi gọi handleUploadMedia:', error);
    }
  };

  const handleDeleteImage = (file: UploadImage) => {
    setFiles((prev) => prev.filter((f) => f.id !== file.id));
    URL.revokeObjectURL(file.preview);
    setFileInputKey(crypto.randomUUID());

    if (!file.publicId) return;
    try {
      fileService.deleteFile(file.publicId, file.type);
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
    (value.trim() && !files?.length) ||
    (files?.length && files?.every((f) => f?.status === 'done'));

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
          {files.map((file) => (
            <div className="relative shrink-0" key={file.id}>
              {/* progress */}
              <div
                className={cn(
                  'absolute top-1/2 right-1/2 translate-x-1/2 -translate-y-1/2 z-30',
                  file.status === 'done' && 'progress-faded-out'
                )}
              >
                <CircularProgress
                  className="stroke-gray-500"
                  progressClassName="stroke-white"
                  size={40}
                  strokeWidth={4}
                  value={getProgress(file.status)}
                />
              </div>
              {/* nút xóa */}
              <CircleX
                className="absolute right-0 z-10 size-4 text-white bg-muted-foreground dark:bg-muted-foreground/50 rounded-full cursor-pointer"
                onClick={() => handleDeleteImage(file)}
              />
              {file.type === 'image' ? (
                <img src={file.preview} className="w-14 h-14 rounded-md object-contain border" />
              ) : (
                <>
                  <video
                    poster={file?.poster}
                    className="w-14 h-14 rounded-md object-contain border"
                  >
                    <source src={file.preview}></source>
                  </video>
                  <Play className="size-4 absolute inset-0 top-1/2 left-1/2 -translate-1/2" />
                </>
              )}
            </div>
          ))}
        </div>
        <input id="chat-file-input" key={fileInputKey} {...getInputProps()}></input>

        {/* Input nhập tin nhắn */}
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.repeat) {
              e.preventDefault();
              handleSendMessage();
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
        onClick={handleSendMessage}
        disabled={!isSendable}
      >
        <Send />
      </Button>
    </footer>
  );
};
