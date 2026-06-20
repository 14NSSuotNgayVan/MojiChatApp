import { ToggleTheme } from '@/components/toggle-theme.tsx';
import { MojiLogo } from '@/components/brand/moji-logo';
import { AuthBrandPanel } from '@/components/auth/auth-brand-panel';

type AuthLayoutProps = {
  children: React.ReactNode;
};

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="auth-split-shell animated-bg dark:bg-login relative min-h-[100dvh] overflow-hidden">
      <div className="auth-grain pointer-events-none absolute inset-0 opacity-[0.04] dark:opacity-[0.07]" aria-hidden />

      <aside className="auth-brand-side hidden lg:block">
        <AuthBrandPanel />
      </aside>

      <main className="auth-form-side">
        <header className="auth-form-topbar">
          <MojiLogo size="sm" showWordmark variant="mark" className="items-start lg:hidden" />
          <ToggleTheme />
        </header>

        <div className="auth-form-side__inner">{children}</div>
      </main>
    </div>
  );
};
