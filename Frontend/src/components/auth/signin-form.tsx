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
import { useNavigate, Link } from "react-router";
import { useState } from "react";
import { ArrowRight, Loader2, User } from "lucide-react";
import { AuthPasswordInput } from "@/components/auth/auth-password-input";
import { GoogleIcon, MetaIcon } from "@/components/auth/auth-oauth-icons";

const schema = z.object({
  username: z.string().min(1, "Tên đăng nhập là bắt buộc"),
  password: z.string().min(1, "Mật khẩu là bắt buộc"),
});

type singinSchema = z.infer<typeof schema>;

export function SigninForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { signIn, signInWithGoogle, signInWithFacebook, loading } = useAuthStore();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<singinSchema>({
    resolver: zodResolver(schema),
  });
  const [loginSuccess, setIsLoginSuccess] = useState<boolean>(true);

  const handleSubmitForm = async (data: singinSchema) => {
    const { username, password } = data;
    const isLoginSuccess = await signIn(username, password);
    setIsLoginSuccess(isLoginSuccess);
    if (isLoginSuccess) navigate("/");
  };

  return (
    <div className={cn("auth-signin auth-signin--fit", className)} {...props}>
      <div className="auth-signin__intro auth-reveal">
        <p className="auth-signin__eyebrow">Đăng nhập MOJI</p>
        <h1 className="auth-signin__title">
          Chào mừng{" "}
          <span className="italic font-medium">trở lại.</span>
        </h1>
        <p className="auth-signin__subtitle">
          Tiếp tục cuộc trò chuyện — bạn bè đang chờ bên kia màn hình.
        </p>
      </div>

      <form
        className="auth-signin__form auth-reveal auth-reveal--delay-1"
        onSubmit={handleSubmit(handleSubmitForm)}
      >
        <FieldGroup className="gap-5 max-lg:gap-3.5">
          <Field className="gap-2">
            <FieldLabel htmlFor="username">Tên đăng nhập</FieldLabel>
            <div className="auth-input-wrap">
              <User className="auth-input-wrap__icon" aria-hidden />
              <Input
                id="username"
                {...register("username")}
                type="text"
                autoComplete="username"
                placeholder="user_123"
                aria-invalid={!!errors.username || !loginSuccess}
                className="auth-input h-12 max-lg:h-11 border-0 bg-transparent pl-10 shadow-none focus-visible:ring-0"
              />
            </div>
            {errors?.username && (
              <FieldDescription className="text-destructive">
                {errors.username.message}
              </FieldDescription>
            )}
          </Field>

          <Field className="gap-2">
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="password">Mật khẩu</FieldLabel>
              <Link
                to="/forgot-password"
                className="text-xs font-medium text-primary hover:underline"
              >
                Quên mật khẩu?
              </Link>
            </div>
            <AuthPasswordInput
              id="password"
              autoComplete="current-password"
              aria-invalid={!!errors.password || !loginSuccess}
              {...register("password")}
            />
            {errors?.password && (
              <FieldDescription className="text-destructive">
                {errors.password.message}
              </FieldDescription>
            )}
            {!loginSuccess && (
              <FieldDescription className="text-destructive">
                Sai thông tin đăng nhập. Vui lòng thử lại.
              </FieldDescription>
            )}
          </Field>

          <Button
            type="submit"
            size="lg"
            disabled={loading}
            className="auth-submit-btn h-12 max-lg:h-11 w-full rounded-xl text-base font-medium active:scale-[0.98]"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" />
                Đang đăng nhập...
              </>
            ) : (
              <>
                Vào MOJI
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
        Chưa có tài khoản?{" "}
        <Link to="/signup" className="auth-signin__link">
          Tạo tài khoản mới
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
