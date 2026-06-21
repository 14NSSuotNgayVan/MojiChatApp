import { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type AuthPasswordInputProps = Omit<
  React.ComponentProps<typeof Input>,
  'type'
> & {
  showToggle?: boolean;
};

export function AuthPasswordInput({
  className,
  showToggle = true,
  id,
  ...props
}: AuthPasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="auth-input-wrap">
      <Lock className="auth-input-wrap__icon" aria-hidden />
      <Input
        id={id}
        type={visible ? 'text' : 'password'}
        className={cn(
          'auth-input h-12 max-lg:h-11 border-0 bg-transparent pl-10 shadow-none focus-visible:ring-0',
          showToggle && 'pr-10',
          className
        )}
        {...props}
      />
      {showToggle && (
        <button
          type="button"
          className="absolute right-3 top-1/2 z-10 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          tabIndex={-1}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      )}
    </div>
  );
}
