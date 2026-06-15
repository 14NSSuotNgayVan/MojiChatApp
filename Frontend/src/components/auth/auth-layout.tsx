import { ToggleTheme } from '@/components/toggle-theme.tsx';

type AuthLayoutProps = {
  children: React.ReactNode;
};

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="animated-bg dark:bg-login flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="absolute top-2 right-2">
        <ToggleTheme />
      </div>
      <div className="w-full max-w-sm md:max-w-4xl">{children}</div>
    </div>
  );
};
