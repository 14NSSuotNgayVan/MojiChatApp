export const ChatInsertSkeleton = () => {
  return (
    <div className="flex p-4 grow flex-col gap-4 overflow-scroll">
      <div className="flex w-2/3 gap-2">
        <div className="bg-muted/50 aspect-video rounded-full w-12 h-12" />
        <div className="bg-muted/50 aspect-video rounded-xl grow h-20" />
      </div>
      {/* owner message */}
      <div className="flex w-2/3 gap-2 flex-row-reverse self-end">
        <div className="bg-muted/50 aspect-video rounded-xl grow h-20" />
      </div>
      <div className="flex w-1/3 gap-2 flex-row-reverse self-end">
        <div className="bg-muted/50 aspect-video rounded-xl grow h-12" />
      </div>
      <div className="flex w-2/3 gap-2 flex-row-reverse self-end">
        <div className="bg-muted/50 aspect-video rounded-xl grow h-12" />
      </div>

      <div className="flex w-2/3 gap-2">
        <div className="bg-muted/50 aspect-video rounded-full w-12 h-12" />
        <div className="bg-muted/50 aspect-video rounded-xl grow h-20" />
      </div>
      {/* owner message */}
      <div className="flex w-1/3 gap-2 flex-row-reverse self-end">
        <div className="bg-muted/50 aspect-video rounded-xl grow h-12" />
      </div>
    </div>
  );
};
