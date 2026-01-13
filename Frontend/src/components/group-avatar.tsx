import type { Participant } from "../types/chat.ts";
import { Avatar } from "./avatar.tsx";
import { useChatStore } from "../stores/useChatStore.ts";

export const GroupAvatar = ({
  participants,
  avtUrl,
}: {
  participants: Participant[];
  avtUrl?: string;
}) => {
  const { users } = useChatStore()
  if (avtUrl) return <img src={avtUrl}></img>;

  const filteredParticipants = participants.filter((p) => users[p?._id]?.avtUrl).slice(0, 2);

  return (
    <div className="overflow-hidden w-12 h-12 relative shrink-0">
      <Avatar
        name={users[filteredParticipants[0]?._id]?.displayName}
        avatarUrl={users[filteredParticipants[0]?._id]?.avtUrl}
        className="w-8 h-8 absolute top-0 right-0 border-2 border-background"
      />
      <Avatar
        name={users[filteredParticipants[1]?._id]?.displayName}
        avatarUrl={users[filteredParticipants[1]?._id]?.avtUrl}
        className="w-8 h-8 absolute bottom-0 left-0 border-2 border-background"
      />
    </div>
  );
};
