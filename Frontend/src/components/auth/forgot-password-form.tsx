import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link } from 'react-router';
import { ArrowLeft, ArrowRight, Loader2, Mail } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useState } from 'react';

const schema = z.object({
  email: z.email('Email không đúng định dạng').min(1, 'Email là bắt buộc'),
});

type FormData = z.infer<typeof schema>;

export function ForgotPasswordForm({ className, ...props }: React.ComponentProps<'div'>) {
  const { requestPasswordReset, loading } = useAuthStore();
  const [submitted, setSubmitted] = useState(false);
  const { register, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    const ok = await requestPasswordReset(data.email);
    if (ok) setSubmitted(true);
  };

  return (
    <div className={cn('auth-signin auth-signin--fit', className)} {...props}>
      <div className="auth-signin__intro auth-reveal">
        <p className="auth-signin__eyebrow">Khôi phục tài khoản</p>
        <h1 className="auth-signin__title">
          Quên{' '}
          <span className="italic font-medium">mật khẩu?</span>
        </h1>
        <p className="auth-signin__subtitle">
          {submitted
            ? 'Nếu email tồn tại, chúng tôi đã gửi liên kết đặt lại mật khẩu. Kiểm tra hộp thư của bạn.'
            : 'Nhập email đã đăng ký — chúng tôi sẽ gửi liên kết đặt lại mật khẩu.'}
        </p>
      </div>

      {!submitted ? (
        <form className="auth-signin__form auth-reveal auth-reveal--delay-1" onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup className="gap-5">
            <Field className="gap-2">
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <div className="auth-input-wrap">
                <Mail className="auth-input-wrap__icon" aria-hidden />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="m@example.com"
                  className="auth-input h-12 max-lg:h-11 border-0 bg-transparent pl-10 shadow-none focus-visible:ring-0"
                  {...register('email')}
                />
              </div>
            </Field>
            <Button
              type="submit"
              disabled={loading}
              className="auth-submit-btn h-12 w-full rounded-xl font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  Gửi liên kết
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </FieldGroup>
        </form>
      ) : null}

      <p className="auth-signin__footer auth-reveal auth-reveal--delay-2">
        <Link to="/signin" className="auth-signin__link">
          <ArrowLeft className="size-3.5" />
          Quay lại đăng nhập
        </Link>
      </p>
    </div>
  );
}
