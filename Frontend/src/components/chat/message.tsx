import { useState } from "react";
import { useChatStore } from "../../stores/useChatStore.ts";
import type { Message, MessageGroup } from "../../types/chat.ts";
import { Avatar } from "../avatar.tsx";
import dayjs from "dayjs";
import { cn, getMessageTime } from "../../lib/utils.ts";

type IndexMessageType = "first" | "middle" | "last" | "single";

const getMessageIndexType = (idx: number, total: number): IndexMessageType => {
  if (idx === 0 && total === 1) return "single";
  if (idx === 0) return "first";
  if (idx === total - 1) return "last";
  return "middle";
};

export const FriendMessage = ({
  message,
  indexMessageType,
}: {
  message: Message;
  indexMessageType: IndexMessageType;
}) => {
  const { activeConversation } = useChatStore();
  const indexType = {
    isFirst: indexMessageType === "first",
    isMiddle: indexMessageType === "middle",
    isLast: indexMessageType === "last",
    isSingle: indexMessageType === "single",
  };
  const participants = activeConversation?.participants;
  const sender = participants?.find((p) => p._id === message.senderId);
  const [isShowDes, setIsShowDes] = useState<boolean>(
    indexType.isFirst || indexType.isSingle
  );

  const handleToggleMessage = () => {
    if (indexType.isFirst || indexType.isSingle) return;
    setIsShowDes((prev) => !prev);
  };

  return (
    <>
      <p
        className={cn(
          "text-sm text-muted-foreground text-center hidden opacity-0 translate-y-4 transition-all duration-500 ease-out",
          isShowDes && "block opacity-100 translate-y-0"
        )}
      >
        {getMessageTime(message.createdAt)}
      </p>
      {isShowDes && (
        <p className="max-w-2/3 ml-14 text-sm text-muted-foreground">
          {sender?.displayName}
        </p>
      )}
      <div className="flex max-w-2/3 gap-2">
        {indexType.isLast || indexType.isSingle ? (
          <Avatar name={sender?.displayName!} avatarUrl={sender?.avtUrl} />
        ) : (
          <div className="w-10"></div>
        )}
        <div
          className={cn(
            "bg-secondary px-3 py-2 hover:bg-accent",
            indexType.isSingle && "rounded-2xl",
            indexType.isFirst && "rounded-3xl rounded-bl-sm",
            indexType.isLast && "rounded-3xl rounded-tl-sm",
            indexType.isMiddle && "rounded-3xl rounded-tl-sm rounded-bl-sm",
            isShowDes && !indexType.isFirst && "rounded-2xl"
          )}
          onClick={handleToggleMessage}
        >
          {message.content}
        </div>
      </div>
    </>
  );
};

export const FriendMessageGroup = ({ group }: { group: MessageGroup }) => {
  return (
    <div className="flex flex-col gap-1">
      {group.messages.map((mg, idx) => (
        <FriendMessage
          message={mg}
          indexMessageType={getMessageIndexType(idx, group.messages.length)}
          key={mg._id}
        />
      ))}
    </div>
  );
};

export const OwnerMessage = ({
  message,
  indexMessageType,
}: {
  message: Message;
  indexMessageType: IndexMessageType;
}) => {
  const indexType = {
    isFirst: indexMessageType === "first",
    isMiddle: indexMessageType === "middle",
    isLast: indexMessageType === "last",
    isSingle: indexMessageType === "single",
  };
  const [isShowDes, setIsShowDes] = useState<boolean>(
    indexType.isFirst || indexType.isSingle
  );

  const handleToggleMessage = () => {
    if (indexType.isFirst || indexType.isSingle) return;
    setIsShowDes((prev) => !prev);
  };

  return (
    <>
      <p
        className={cn(
          "text-sm text-muted-foreground text-center hidden opacity-0 translate-y-4 transition-all duration-500 ease-out",
          isShowDes && "block opacity-100 translate-y-0"
        )}
      >
        {getMessageTime(message.createdAt)}
      </p>
      <div className="self-end mw-2/3">
        <div
          className={cn(
            "bg-primary/40 px-3 py-2 hover:bg-accent",
            indexType.isSingle && "rounded-2xl",
            indexType.isFirst && "rounded-3xl rounded-br-sm",
            indexType.isLast && "rounded-3xl rounded-tr-sm",
            indexType.isMiddle && "rounded-3xl rounded-tr-sm rounded-br-sm",
            isShowDes && !indexType.isFirst && "rounded-2xl"
          )}
          onClick={handleToggleMessage}
        >
          {message.content}
        </div>
      </div>
    </>
  );
};

export const OwnerMessageGroup = ({ group }: { group: MessageGroup }) => {
  return (
    <div className="flex flex-col gap-1">
      {group.messages.map((mg, idx) => (
        <OwnerMessage
          message={mg}
          indexMessageType={getMessageIndexType(idx, group.messages.length)}
          key={mg._id}
        />
      ))}
    </div>
  );
};
