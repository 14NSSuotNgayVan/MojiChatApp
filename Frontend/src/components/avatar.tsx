import type { ReactNode } from "react";
import {
  cn,
  getAcronym,
  getMessageTime,
  stringToHexColor,
} from "../lib/utils.ts";
import { useSocketStore } from "../stores/useSocketStore.ts";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip.tsx";

export const Avatar = ({
  avatarUrl,
  name,
  className,
  layer
}: {
  name: string;
  avatarUrl?: string | null;
  className?: string;
  layer?: ReactNode
}) => {
  return (
    <div
      className={cn(
        "rounded-full overflow-hidden w-10 h-10 shrink-0",
        className
      )}
    >
      {layer && layer}
      {avatarUrl ? (
        <img className="w-full h-full object-cover" src={avatarUrl}></img>
      ) : (
        <div
          className="w-full h-full flex items-center justify-center font-semibold"
          style={stringToHexColor(getAcronym(name || ""))}
        >
          {String(name)
            .split(" ")
            .slice(0, 2)
            .map((word) => word.charAt(0))
            .join("")}
        </div>
      )}
    </div>
  );
};

export const OnlineAvatar = ({
  avatarUrl,
  name,
  className,
  userId,
}: {
  name: string;
  avatarUrl?: string | null;
  userId: string;
  className?: string;
}) => {
  const { onlineUsers } = useSocketStore();
  const isOnline = onlineUsers.includes(userId);

  return (
    <div className={cn("relative", className)}>
      <Avatar avatarUrl={avatarUrl} name={name} />
      <div
        className={cn(
          "rounded-full border-2 border-background w-3 h-3 absolute bottom-0 right-0",
          isOnline ? "bg-green-500" : "bg-gray-300"
        )}
      ></div>
    </div>
  );
};
interface SeenUser {
  userId: string;
  displayName: string;
  avtUrl?: string | null;
  lastSeenAt: Date;
}
export const SeenAvatars = ({ seenUsers }: { seenUsers: SeenUser[] }) => {
  const SHOW_LIMIT = 4;

  const showUser = seenUsers.slice(0, SHOW_LIMIT - 1);
  const hiddenUser = seenUsers.slice(SHOW_LIMIT - 1);

  return (
    <div className="flex items-center justify-end gap-[0.5px]">
      {!!hiddenUser?.length && (
        <Tooltip>
          <TooltipTrigger className="bg-accent text-accent-foreground rounded-full px-2 text-xs">
            +{hiddenUser?.length}
          </TooltipTrigger>
          <TooltipContent align="end">
            {hiddenUser.map((user) => (
              <p>{user.displayName}</p>
            ))}
          </TooltipContent>
        </Tooltip>
      )}
      {showUser.map((user) => (
        <Tooltip>
          <TooltipTrigger>
            <Avatar
              name={user.displayName}
              avatarUrl={user.avtUrl}
              className="size-4"
            />
          </TooltipTrigger>
          <TooltipContent align="end">
            <p>
              {user.displayName} Đã xem {getMessageTime(user.lastSeenAt, true)}
            </p>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
};
