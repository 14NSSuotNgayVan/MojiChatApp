import { cn } from '@/lib/utils';
import { MojiLogoMark } from './moji-logo-mark';

type MojiLogoProps = {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showWordmark?: boolean;
  /** `app` = gradient tile. `mark` = icon only. */
  variant?: 'app' | 'mark';
  /** White mark for purple / dark backgrounds */
  tone?: 'default' | 'light';
};

const sizeMap = {
  sm: 'size-8',
  md: 'size-14',
  lg: 'size-16',
  xl: 'size-20',
} as const;

const wordmarkSizeMap = {
  sm: 'text-base',
  md: 'text-xl',
  lg: 'text-2xl',
  xl: 'text-3xl',
} as const;

export const MojiLogo = ({
  size = 'md',
  className,
  showWordmark = false,
  variant = 'app',
  tone = 'default',
}: MojiLogoProps) => {
  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <MojiLogoMark
        variant={variant}
        tone={tone}
        className={cn(sizeMap[size], variant === 'mark' && tone === 'default' && 'text-primary')}
      />
      {showWordmark && (
        <span
          className={cn(
            'font-semibold tracking-[-0.04em]',
            wordmarkSizeMap[size],
            tone === 'light' ? 'text-white' : 'text-foreground'
          )}
        >
          MOJI
        </span>
      )}
    </div>
  );
};
