import { cn } from '@/lib/utils';

type MojiLogoProps = {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showWordmark?: boolean;
};

const sizeMap = {
  sm: 'w-8',
  md: 'w-14',
  lg: 'w-16',
  xl: 'w-20',
};

export const MojiLogo = ({ size = 'md', className, showWordmark = false }: MojiLogoProps) => {
  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <img src="/logo.svg" alt="MOJI" className={cn(sizeMap[size], 'block')} />
      {showWordmark && (
        <span className="text-2xl font-bold text-primary tracking-tight">MOJI</span>
      )}
    </div>
  );
};
