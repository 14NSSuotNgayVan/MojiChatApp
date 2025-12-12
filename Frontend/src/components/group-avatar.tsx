import React from "react";
import type { Participant } from "../types/chat.ts";
import { Avatar } from "./avatar.tsx";

export const GroupAvatar = ({
  participants,
  avtUrl,
}: {
  participants: Participant[];
  avtUrl?: string;
}) => {
  if (avtUrl) return <img src={avtUrl}></img>;

  const filteredParticipants = participants.filter((p) => p.avtUrl).slice(0, 2);

  return (
    <div className="overflow-hidden w-12 h-12 relative shrink-0">
      <Avatar
        name={filteredParticipants[0]?.displayName}
        avatarUrl={filteredParticipants[0]?.avtUrl}
        className="w-8 h-8 absolute top-0 right-0 border-2 border-background"
      />
      <Avatar
        name={filteredParticipants[1]?.displayName}
        avatarUrl={filteredParticipants[1]?.avtUrl}
        className="w-8 h-8 absolute bottom-0 left-0 border-2 border-background"
      />
    </div>
  );
};
