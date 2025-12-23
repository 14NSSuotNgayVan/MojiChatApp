import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover.tsx";
import { ImagePlus, Send, Smile } from "lucide-react";
import {
  EmojiPicker,
  EmojiPickerContent,
  EmojiPickerSearch,
} from "../ui/emoji-picker.tsx";
import { Button } from "../ui/button.tsx";
import { Input } from "../ui/input.tsx";
import { useChatStore } from "../../stores/useChatStore.ts";
import { useAuthStore } from "../../stores/useAuthStore.ts";
export const ChatWindowFooter = () => {
  const [value, setValue] = useState<string>("");
  const {
    activeConversationId,
    activeConversation,
    sendDirectMessage,
    sendGroupMessage,
  } = useChatStore();
  const { user } = useAuthStore();

  const handleSendMessgae = async () => {
    debugger;
    const content = value;
    setValue("");
    if (activeConversation?.type === "direct") {
      const friend = activeConversation.participants.find(
        (u) => u._id !== user!._id
      );

      await sendDirectMessage(activeConversationId!, friend!._id, content);
    } else {
      await sendGroupMessage(activeConversationId!, content);
    }
  };

  return (
    <footer className="p-2 flex border-t gap-2 items-center">
      <Button
        variant="ghost"
        className="hover:bg-accent transition-colors size-9 p-2"
      >
        <ImagePlus />
      </Button>
      <div className="flex-1 relative">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.repeat) {
              e.preventDefault();
              handleSendMessgae();
            }
          }}
          className="pr-8 h-10"
        ></Input>
        <Popover>
          <PopoverTrigger
            asChild
            className="cursor-pointer absolute top-1/2 right-0 -translate-y-1/2 resize-none"
          >
            <Button
              variant="ghost"
              className="hover:bg-accent transition-colors size-9 p-2"
            >
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
