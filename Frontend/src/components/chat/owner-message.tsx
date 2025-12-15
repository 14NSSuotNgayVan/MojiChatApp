import type { Message } from "../../types/chat.ts";
import dayjs from "dayjs";
interface Props {
  message: Message;
}
export const OwnerMessage = ({ message }: Props) => {
  return (
    <div className="self-end">
      <div className="bg-muted/50 rounded-xl p-2">
        {message.content}
        <span>{dayjs(message.createdAt).format("HH:mm")}</span>
      </div>
    </div>
  );
};
