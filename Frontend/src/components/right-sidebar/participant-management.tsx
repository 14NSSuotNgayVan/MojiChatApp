import { Avatar } from '@/components/avatars/avatar.tsx';
import { cn } from '@/lib/utils.ts';
import { useChatStore } from '@/stores/useChatStore.ts';
import { ChevronLeft } from 'lucide-react';

type Props = {
  onReturn: () => void;
};
const ParticipantManagement = ({ onReturn }: Props) => {
  const { activeConversation, users } = useChatStore();
  const participants = activeConversation?.participants.map((p) => ({
    ...p,
    ...users[p._id],
    addedBy: p?.addedBy ? users?.[p.addedBy] : undefined,
  }));

  return (
    <>
      <div className="flex flex-col h-full select-none">
        <div className="flex px-4 h-16 items-center select-none shrink-0">
          <button
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive cursor-pointer text-muted-foreground hover:bg-accent hover:text-foreground dark:text-foreground dark:hover:bg-accent/50 dark:hover:text-primary size-7"
            onClick={onReturn}
          >
            <ChevronLeft />
          </button>
          <p className="text-center text-lg font-semibold grow">Thành viên đoạn chat</p>
        </div>
        <div className="px-2 pb-2 grow overflow-y-auto">
          {participants?.map((p) => (
            <div
              className={cn(
                'group/item flex w-full gap-2 px-2 py-2 hover:bg-accent/50 rounded-sm cursor-pointer'
              )}
            >
              <Avatar name={p?.displayName || ''} avatarUrl={p?.avtUrl} />
              <div className="space-y-1 flex-1 border-b border-b-accent shrink-0">
                <div className="font-medium truncate text-sm">
                  {p?.displayName}
                  {p.role === 'ADMIN' ? (
                    <span className="text-muted-foreground text-xs">
                      {' • '}
                      <span className="font-semibold">Quản trị viên</span>
                    </span>
                  ) : (
                    ''
                  )}
                </div>
                <div className={cn('text-muted-foreground text-xs truncate mb-0.5 flex gap-0.5')}>
                  <div className={'truncate max-w-1/2'}>{p?.email}</div>
                  {p.addedBy?._id && p.role !== 'ADMIN' ? (
                    <span className="text-muted-foreground text-xs">
                      {' • '}
                      <span className="font-semibold">{p.addedBy.displayName}</span> đã thêm.
                    </span>
                  ) : (
                    ''
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
export default ParticipantManagement;
