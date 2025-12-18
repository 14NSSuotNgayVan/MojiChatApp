import { cn, getAcronym, stringToHexColor } from "../lib/utils.ts";
import { useSocketStore } from "../stores/useSocketStore.ts";

export const Avatar = ({
  avatarUrl,
  name,
  className,
}: {
  name: string;
  avatarUrl?: string | null;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "rounded-full overflow-hidden w-10 h-10 shrink-0",
        className
      )}
    >
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
