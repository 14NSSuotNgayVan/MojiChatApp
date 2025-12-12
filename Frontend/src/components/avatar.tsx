import { cn, getAcronym, stringToHexColor } from "../lib/utils.ts";

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
  isOnline,
}: {
  name: string;
  avatarUrl?: string | null;
  isOnline?: boolean;
  className?: string;
}) => {
  return (
    <div className={cn("relative", className)}>
      <Avatar avatarUrl={avatarUrl} name={name} />
      <div
        className={cn(
          "rounded-full border-2 border-background w-4 h-4 absolute bottom-0 right-0",
          isOnline ? "bg-emerald-400" : "bg-gray-600"
        )}
      ></div>
    </div>
  );
};
