import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/stores/useAuthStore";
import { Link, useNavigate } from "react-router";
import { ArrowRight, Loader2, Mail, User } from "lucide-react";
import { AuthPasswordInput } from "@/components/auth/auth-password-input";
import { GoogleIcon, MetaIcon } from "@/components/auth/auth-oauth-icons";

const schema = z
  .object({
    username: z.string().min(1, "Tên đăng nhập là bắt buộc"),
    displayName: z.string().min(1, "Tên hiển thị là bắt buộc"),
    email: z.email("Email không đúng định dạng").min(1, "Email là bắt buộc"),
    password: z.string().min(8, "Mật khẩu là bắt buộc"),
    confirmPassword: z.string().min(8, "Mật khẩu xác nhận là bắt buộc"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu không khớp",
    path: ["confirmPassword"],
  });

type singupSchema = z.infer<typeof schema>;

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { signUp, signInWithGoogle, signInWithFacebook, loading } = useAuthStore();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<singupSchema>({
    resolver: zodResolver(schema),
  });

  const handleSubmitForm = async (data: singupSchema) => {
    const { username, displayName, email, password } = data;
    const success = await signUp(username, email, password, displayName);
    if (success) navigate("/signin?registered=1");
  };

  return (
    <div className={cn("auth-signin auth-signin--scroll", className)} {...props}>
      <div className="auth-signin__intro auth-reveal">
        <p className="auth-signin__eyebrow">Tham gia MOJI</p>
        <h1 className="auth-signin__title">
          Tạo
          <br />
          <span className="italic font-medium">tài khoản.</span>
        </h1>
        <p className="auth-signin__subtitle">
          Vài bước nhanh để bắt đầu trò chuyện cùng bạn bè.
        </p>
      </div>

      <form
        className="auth-signin__form auth-reveal auth-reveal--delay-1"
        onSubmit={handleSubmit(handleSubmitForm)}
      >
        <FieldGroup className="gap-5 max-lg:gap-3.5">
          <Field className="grid gap-4 sm:grid-cols-2">
            <Field className="gap-2">
              <FieldLabel htmlFor="username">Tên đăng nhập</FieldLabel>
              <div className="auth-input-wrap">
                <User className="auth-input-wrap__icon" aria-hidden />
                <Input
                  id="username"
                  {...register("username")}
                  type="text"
                  placeholder="user_123"
                  autoComplete="username"
                  className="auth-input h-12 max-lg:h-11 border-0 bg-transparent pl-10 shadow-none focus-visible:ring-0"
                />
              </div>
              {errors?.username && (
                <FieldDescription className="text-destructive">{errors.username.message}</FieldDescription>
              )}
            </Field>
            <Field className="gap-2">
              <FieldLabel htmlFor="displayName">Tên hiển thị</FieldLabel>
              <div className="auth-input-wrap">
                <User className="auth-input-wrap__icon" aria-hidden />
                <Input
                  id="displayName"
                  {...register("displayName")}
                  type="text"
                  placeholder="User 123"
                  autoComplete="name"
                  className="auth-input h-12 max-lg:h-11 border-0 bg-transparent pl-10 shadow-none focus-visible:ring-0"
                />
              </div>
              {errors?.displayName && (
                <FieldDescription className="text-destructive">{errors.displayName.message}</FieldDescription>
              )}
            </Field>
          </Field>

          <Field className="gap-2">
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <div className="auth-input-wrap">
              <Mail className="auth-input-wrap__icon" aria-hidden />
              <Input
                id="email"
                {...register("email")}
                type="email"
                placeholder="m@example.com"
                autoComplete="email"
                className="auth-input h-12 max-lg:h-11 border-0 bg-transparent pl-10 shadow-none focus-visible:ring-0"
              />
            </div>
            {errors?.email && (
              <FieldDescription className="text-destructive">{errors.email.message}</FieldDescription>
            )}
          </Field>

          <Field className="grid gap-4 sm:grid-cols-2">
            <Field className="gap-2">
              <FieldLabel htmlFor="password">Mật khẩu</FieldLabel>
              <AuthPasswordInput id="password" autoComplete="new-password" {...register("password")} />
            </Field>
            <Field className="gap-2">
              <FieldLabel htmlFor="confirm_password">Xác nhận mật khẩu</FieldLabel>
              <AuthPasswordInput
                id="confirm_password"
                autoComplete="new-password"
                {...register("confirmPassword")}
              />
            </Field>
          </Field>
          {(errors?.password || errors?.confirmPassword) && (
            <FieldDescription className="text-destructive">
              {errors?.password?.message || errors?.confirmPassword?.message}
            </FieldDescription>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="auth-submit-btn h-12 max-lg:h-11 w-full rounded-xl text-base font-medium active:scale-[0.98]"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" />
                Đang tạo tài khoản...
              </>
            ) : (
              <>
                Tạo tài khoản
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </FieldGroup>
      </form>

      <div className="auth-signin__oauth auth-reveal auth-reveal--delay-2">
        <div className="auth-signin__divider">
          <span>hoặc</span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <Button
            variant="outline"
            type="button"
            disabled={loading}
            onClick={signInWithGoogle}
            className="auth-oauth-btn h-11 max-lg:h-10 rounded-xl"
          >
            <GoogleIcon />
            Google
          </Button>
          <Button
            variant="outline"
            type="button"
            disabled={loading}
            onClick={signInWithFacebook}
            className="auth-oauth-btn h-11 max-lg:h-10 rounded-xl"
          >
            <MetaIcon />
            Meta
          </Button>
        </div>
      </div>

      <p className="auth-signin__footer auth-reveal auth-reveal--delay-3">
        Đã có tài khoản?{" "}
        <Link to="/signin" className="auth-signin__link">
          Đăng nhập
          <ArrowRight className="size-3.5" />
        </Link>
      </p>

      <p className="auth-signin__legal auth-reveal auth-reveal--delay-3">
        Bằng cách tiếp tục, bạn đồng ý với{" "}
        <Link to="/terms">Điều khoản</Link> và <Link to="/privacy">Chính sách</Link>.
      </p>
    </div>
  );
}
