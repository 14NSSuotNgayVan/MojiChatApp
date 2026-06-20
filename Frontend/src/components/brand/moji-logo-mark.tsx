import { cn } from '@/lib/utils';

type MojiLogoMarkProps = {
  className?: string;
  variant?: 'app' | 'mark';
  tone?: 'default' | 'light';
};

export function MojiLogoMark({
  className,
  variant = 'mark',
  tone = 'default',
}: MojiLogoMarkProps) {
  const onAppTile = variant === 'app';

  const bubbleBack = onAppTile || tone === 'light' ? '#ffffff' : 'currentColor';
  const bubbleFront = onAppTile || tone === 'light' ? '#ffffff' : 'currentColor';
  const backOpacity = onAppTile ? 0.82 : tone === 'light' ? 0.82 : 0.42;
  const frontOpacity = 1;

  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={cn('block shrink-0', className)}
    >
      {onAppTile && (
        <>
          <defs>
            <linearGradient id="moji-logo-bg" x1="6" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
              <stop stopColor="#7566a0" />
              <stop offset="1" stopColor="#a995c9" />
            </linearGradient>
          </defs>
          <rect width="32" height="32" rx="8" fill="url(#moji-logo-bg)" />
        </>
      )}

      <path
        d="M16.5 10C16.5 8.07 18.07 6.5 20 6.5H23.5C25.43 6.5 27 8.07 27 10V16C27 17.93 25.43 19.5 23.5 19.5H21.5L19.5 21.5V19.5H20C18.07 19.5 16.5 17.93 16.5 16V10Z"
        fill={bubbleBack}
        fillOpacity={backOpacity}
      />
      <path
        d="M5 13C5 11.07 6.57 9.5 8.5 9.5H14C15.93 9.5 17.5 11.07 17.5 13V19C17.5 20.93 15.93 22.5 14 22.5H10.5L8.5 24.5V22.5H8.5C6.57 22.5 5 20.93 5 19V13Z"
        fill={bubbleFront}
        fillOpacity={frontOpacity}
      />
      <circle cx="25.5" cy="8.5" r="2.5" fill="#f0c88d" />
    </svg>
  );
}
