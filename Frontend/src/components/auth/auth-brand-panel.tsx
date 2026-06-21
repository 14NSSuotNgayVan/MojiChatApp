import { MojiLogo } from '@/components/brand/moji-logo';

const previewMessages = [
  { id: 1, side: 'left' as const, name: 'Linh', initial: 'L', text: 'Tối nay vào MOJI nhé?', time: '21:04' },
  { id: 2, side: 'right' as const, text: 'Ok, mình online rồi!', time: '21:05' },
  { id: 3, side: 'left' as const, name: 'Linh', initial: 'L', text: 'Nhóm Dev đang chờ!', time: '21:06' },
] as const;

type AuthBrandPanelProps = {
  /** @deprecated use variant */
  compact?: boolean;
  variant?: 'desktop' | 'compact' | 'mobile';
};

export function AuthBrandPanel({ compact = false, variant }: AuthBrandPanelProps) {
  const resolvedVariant = variant ?? (compact ? 'compact' : 'desktop');
  const isMobile = resolvedVariant === 'mobile';
  const isCompact = resolvedVariant === 'compact';
  const isDesktop = resolvedVariant === 'desktop';

  const visibleMessages = isMobile
    ? previewMessages.slice(0, 2)
    : previewMessages;

  return (
    <div
      className={[
        'auth-brand-panel e-card playing relative flex overflow-hidden',
        isMobile && 'auth-brand-panel--mobile',
        isCompact && 'min-h-[220px] p-6',
        isDesktop && 'h-full flex-col p-8 md:p-10 lg:p-12',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="wave" aria-hidden />
      <div className="wave" aria-hidden />
      {!isMobile && (
        <>
          <div className="auth-brand-orb auth-brand-orb--1" aria-hidden />
          <div className="auth-brand-orb auth-brand-orb--2" aria-hidden />
        </>
      )}

      <div
        className={[
          'relative z-10 flex w-full',
          isMobile && 'flex-row items-center gap-3',
          isCompact && 'flex-col gap-4',
          isDesktop && 'h-full flex-col gap-8',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {isMobile && (
          <div className="auth-brand-panel__mobile-copy shrink-0">
            <p className="text-[0.65rem] font-medium uppercase tracking-[0.14em] text-white/55">
              MOJI Chat
            </p>
            <p className="mt-0.5 text-sm font-semibold leading-snug tracking-tight text-white">
              Kết nối
              <br />
              <span className="italic font-medium text-white/85">mọi lúc.</span>
            </p>
          </div>
        )}

        {!isMobile && (
          <MojiLogo
            size={isCompact ? 'sm' : 'lg'}
            showWordmark
            variant="mark"
            tone="light"
            className="items-start"
          />
        )}

        {isDesktop && (
          <div className="max-w-md space-y-4">
            <h2 className="text-[clamp(2rem,4vw,3.25rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-white">
              Nơi mọi cuộc
              <br />
              <span className="italic font-medium text-white/90">trò chuyện</span>{' '}
              bắt đầu.
            </h2>
            <p className="max-w-sm text-sm leading-relaxed text-white/70">
              MOJI — nhắn tin, nhóm chat và kết nối bạn bè trong một không gian gọn gàng.
            </p>
          </div>
        )}

        <div
          className={[
            'auth-chat-preview',
            isMobile && 'auth-chat-preview--mobile flex-1 min-w-0',
            isDesktop && 'mt-auto',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <div className="auth-chat-preview__chrome">
            <span className="auth-chat-preview__dot" />
            <span className="auth-chat-preview__dot" />
            <span className="auth-chat-preview__dot" />
            <span className="auth-chat-preview__title">MOJI Chat</span>
          </div>

          <div className="auth-chat-preview__body">
            {visibleMessages.map((msg, index) => (
              <div
                key={msg.id}
                className={`auth-chat-msg auth-chat-msg--${msg.side}`}
                style={{ animationDelay: `${index * 140}ms` }}
              >
                {msg.side === 'left' && 'initial' in msg && (
                  <div className="auth-chat-msg__avatar" aria-hidden>
                    {msg.initial}
                  </div>
                )}
                <div className="auth-chat-msg__stack">
                  {'name' in msg && msg.name && !isMobile && (
                    <span className="auth-chat-msg__name">{msg.name}</span>
                  )}
                  <div className="auth-chat-msg__bubble">{msg.text}</div>
                  {!isMobile && (
                    <span className="auth-chat-msg__time">{msg.time}</span>
                  )}
                </div>
                {msg.side === 'right' && (
                  <div className="auth-chat-msg__avatar auth-chat-msg__avatar--me" aria-hidden>
                    M
                  </div>
                )}
              </div>
            ))}

            {!isMobile && (
              <div className="auth-chat-typing" aria-hidden>
                <div className="auth-chat-msg__avatar">L</div>
                <div className="auth-chat-typing__bubble">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}
          </div>
        </div>

        {isDesktop && (
          <p className="text-xs text-white/45">by @Vananhdamm</p>
        )}
      </div>
    </div>
  );
}

/** @deprecated Use AuthBrandPanel */
export const WaveCard = AuthBrandPanel;
