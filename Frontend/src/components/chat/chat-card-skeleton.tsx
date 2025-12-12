import { Skeleton } from "../ui/skeleton.tsx";

export const ChatCardSkeleton = () => {
  return (
    <div className="flex items-center space-x-4">
      <Skeleton className="shrink-0 h-12 w-12 rounded-full" />
      <div className="space-y-2 w-full">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
      </div>
      <div className="space-y-2 flex flex-col items-end">
        <Skeleton className="h-4 w-8" />
        <Skeleton className="h-4 w-4" />
      </div>
    </div>
  );
};
