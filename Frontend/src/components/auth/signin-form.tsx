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
import { ArrowRight, Loader2, Lock, User } from "lucide-react";

const schema = z.object({
  username: z.string().min(1, "Tên đăng nhập là bắt buộc"),
  password: z.string().min(1, "Mật khẩu là bắt buộc"),
});

type singinSchema = z.infer<typeof schema>;

function GoogleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden className="size-4">
      <path
        d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
        fill="currentColor"
      />
    </svg>
  );
}

function MetaIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden className="size-4">
      <path
        d="M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86 5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843a3.743 3.743 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93-1.047 0-2.088.467-3.053 1.308-.652.57-1.257 1.29-1.82 2.05-.69-.875-1.335-1.547-1.958-2.056-1.182-.966-2.315-1.303-3.454-1.303zm10.16 2.053c1.147 0 2.188.758 2.992 1.999 1.132 1.748 1.647 4.195 1.647 6.4 0 1.548-.368 2.9-1.839 2.9-.58 0-1.027-.23-1.664-1.004-.496-.601-1.343-1.878-2.832-4.358l-.617-1.028a44.908 44.908 0 0 0-1.255-1.98c.07-.109.141-.224.211-.327 1.12-1.667 2.118-2.602 3.358-2.602zm-10.201.553c1.265 0 2.058.791 2.675 1.446.307.327.737.871 1.234 1.579l-1.02 1.566c-.757 1.163-1.882 3.017-2.837 4.338-1.191 1.649-1.81 1.817-2.486 1.817-.524 0-1.038-.237-1.383-.794-.263-.426-.464-1.13-.464-2.046 0-2.221.63-4.535 1.66-6.088.454-.687.964-1.226 1.533-1.533a2.264 2.264 0 0 1 1.088-.285z"
        fill="currentColor"
      />
    </svg>
  );
}

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
            <FieldLabel htmlFor="password">Mật khẩu</FieldLabel>
            <div className="auth-input-wrap">
              <Lock className="auth-input-wrap__icon" aria-hidden />
              <Input
                id="password"
                {...register("password")}
                type="password"
                autoComplete="current-password"
                aria-invalid={!!errors.password || !loginSuccess}
                className="auth-input h-12 max-lg:h-11 border-0 bg-transparent pl-10 shadow-none focus-visible:ring-0"
              />
            </div>
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
        <a href="#">Điều khoản</a> và <a href="#">Chính sách</a>.
      </p>
    </div>
  );
}
