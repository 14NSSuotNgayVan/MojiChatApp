import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover.tsx';
import { ImagePlus, Send, Smile } from 'lucide-react';
import { EmojiPicker, EmojiPickerContent, EmojiPickerSearch } from '../ui/emoji-picker.tsx';
import { Button } from '../ui/button.tsx';
import { Input } from '../ui/input.tsx';
import { useChatStore } from '../../stores/useChatStore.ts';
import { useAuthStore } from '../../stores/useAuthStore.ts';
import { fileService } from '@/services/fileService.ts';
import { Dropzone, DropzoneContent } from '@/components/ui/shadcn-io/dropzone/index.tsx';
export const ChatWindowFooter = () => {
  const [value, setValue] = useState<string>('');
  const [files, setFiles] = useState<File[] | undefined>(undefined);

  const { activeConversationId, activeConversation, sendDirectMessage, sendGroupMessage } =
    useChatStore();
  const { user } = useAuthStore();

  const handleSendMessgae = async () => {
    const content = value;
    setValue('');
    if (activeConversation?.type === 'direct') {
      const friend = activeConversation.participants.find((u) => u._id !== user!._id);

      await sendDirectMessage(activeConversationId!, friend!._id, content);
    } else {
      await sendGroupMessage(activeConversationId!, content);
    }
  };

  // const handleUploadImage = async (files: File[]) => {
  //   try {
  //     const res = fileService.uploadImage();
  //   } catch (error) {
  //     console.error('Lỗi khi gọi handleUploadImage:', error);
  //   }
  // };

  return (
    <footer className="p-2 flex border-t gap-2 items-center">
      <Button variant="ghost" className="hover:bg-accent transition-colors size-9 p-2">
        {/* <Input
          id="chat-file-input"
          type="file"
          multiple
          value={files}
          onChange={(e) => console.log(e.target)}
          className="hidden"
        ></Input> */}
        <label htmlFor="chat-file-input">
          <ImagePlus />
        </label>
      </Button>
      <div className="flex-1 relative">
        <Dropzone
          accept={{ 'image/*': ['.png', '.jpg', '.jpeg'] }}
          onDrop={() => {}}
          onError={console.error}
          src={files}
        >
          <DropzoneContent>
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.repeat) {
                  e.preventDefault();
                  handleSendMessgae();
                }
              }}
              className="pr-8 h-10"
            ></Input>
          </DropzoneContent>
        </Dropzone>
        <Popover>
          <PopoverTrigger
            asChild
            className="cursor-pointer absolute top-1/2 right-0 -translate-y-1/2 resize-none"
          >
            <Button variant="ghost" className="hover:bg-accent transition-colors size-9 p-2">
              <Smile />
            </Button>
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
        disabled={!value.trim()}
      >
        <Send />
      </Button>
    </footer>
  );
};
