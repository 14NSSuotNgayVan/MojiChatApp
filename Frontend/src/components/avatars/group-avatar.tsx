import type { Participant } from '../../types/chat.ts';
import { Avatar } from './avatar.tsx';
import { useChatStore } from '../../stores/useChatStore.ts';
import { cn } from '@/lib/utils.ts';

export const GroupAvatar = ({
  participants,
  avtUrl,
  className,
}: {
  participants: Participant[];
  avtUrl?: string;
  className?: string;
}) => {
  const { users } = useChatStore();
  if (avtUrl) return <img src={avtUrl}></img>;

  const filteredParticipants = participants.filter((p) => users[p?._id]?.avtUrl).slice(0, 2);

  return (
    <div className={cn('overflow-hidden w-12 h-12 relative shrink-0', className)}>
      <Avatar
        name={users[filteredParticipants[0]?._id]?.displayName}
        avatarUrl={users[filteredParticipants[0]?._id]?.avtUrl}
        className="w-2/3 h-2/3 absolute top-0 right-0 border-2 border-background"
      />
      <Avatar
        name={users[filteredParticipants[1]?._id]?.displayName}
        avatarUrl={users[filteredParticipants[1]?._id]?.avtUrl}
        className="w-2/3 h-2/3 absolute bottom-0 left-0 border-2 border-background"
      />
    </div>
  );
};
