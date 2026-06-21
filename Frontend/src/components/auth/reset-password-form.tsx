import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { AuthPasswordInput } from '@/components/auth/auth-password-input';

const schema = z
  .object({
    password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự'),
    confirmPassword: z.string().min(8, 'Xác nhận mật khẩu là bắt buộc'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu không khớp',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

export function ResetPasswordForm({ className, ...props }: React.ComponentProps<'div'>) {
  const { resetPassword, loading } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    if (!token) return;
    const ok = await resetPassword(token, data.password);
    if (ok) navigate('/signin');
  };

  if (!token) {
    return (
      <div className={cn('auth-signin auth-signin--fit', className)} {...props}>
        <div className="auth-signin__intro auth-reveal">
          <h1 className="auth-signin__title text-2xl">Liên kết không hợp lệ</h1>
          <p className="auth-signin__subtitle">Vui lòng yêu cầu liên kết đặt lại mật khẩu mới.</p>
        </div>
        <p className="auth-signin__footer">
          <Link to="/forgot-password" className="auth-signin__link">
            Yêu cầu liên kết mới
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className={cn('auth-signin auth-signin--fit', className)} {...props}>
      <div className="auth-signin__intro auth-reveal">
        <p className="auth-signin__eyebrow">Mật khẩu mới</p>
        <h1 className="auth-signin__title">
          Đặt lại{' '}
          <span className="italic font-medium">mật khẩu.</span>
        </h1>
        <p className="auth-signin__subtitle">Chọn mật khẩu mới cho tài khoản MOJI của bạn.</p>
      </div>

      <form className="auth-signin__form auth-reveal auth-reveal--delay-1" onSubmit={handleSubmit(onSubmit)}>
        <FieldGroup className="gap-5">
          <Field className="gap-2">
            <FieldLabel htmlFor="password">Mật khẩu mới</FieldLabel>
            <AuthPasswordInput id="password" autoComplete="new-password" {...register('password')} />
          </Field>
          <Field className="gap-2">
            <FieldLabel htmlFor="confirm_password">Xác nhận mật khẩu</FieldLabel>
            <AuthPasswordInput
              id="confirm_password"
              autoComplete="new-password"
              {...register('confirmPassword')}
            />
          </Field>
          {(errors.password || errors.confirmPassword) && (
            <FieldDescription className="text-destructive">
              {errors.password?.message || errors.confirmPassword?.message}
            </FieldDescription>
          )}
          <Button
            type="submit"
            disabled={loading}
            className="auth-submit-btn h-12 w-full rounded-xl font-medium"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                Cập nhật mật khẩu
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </FieldGroup>
      </form>

      <p className="auth-signin__footer auth-reveal auth-reveal--delay-2">
        <Link to="/signin" className="auth-signin__link">
          <ArrowLeft className="size-3.5" />
          Quay lại đăng nhập
        </Link>
      </p>
    </div>
  );
}
