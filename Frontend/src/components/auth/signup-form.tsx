import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/stores/useAuthStore";
import { Link } from "react-router";

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
    path: ["confirmPassword"], // Lỗi sẽ show ở field confirmPassword
  });

type singupSchema = z.infer<typeof schema>;

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { signUp, signInWithGoogle, signInWithFacebook, loading } = useAuthStore();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<singupSchema>({
    resolver: zodResolver(schema),
  });

  const handleSubmitForm = async (data: singupSchema) => {
    const { username, displayName, email, password } = data;
    await signUp(username, email, password, displayName);
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
        <FieldGroup className="gap-5">
          <Field className="grid gap-4 sm:grid-cols-2">
            <Field className="gap-2">
              <FieldLabel htmlFor="username">Tên đăng nhập</FieldLabel>
              <Input id="username" {...register("username")} type="text" placeholder="user_123" className="h-11" />
              {errors?.username && (
                <FieldDescription className="text-destructive">{errors.username.message}</FieldDescription>
              )}
            </Field>
            <Field className="gap-2">
              <FieldLabel htmlFor="displayName">Tên hiển thị</FieldLabel>
              <Input id="displayName" {...register("displayName")} type="text" placeholder="User 123" className="h-11" />
              {errors?.displayName && (
                <FieldDescription className="text-destructive">{errors.displayName.message}</FieldDescription>
              )}
            </Field>
          </Field>

          <Field className="gap-2">
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input id="email" {...register("email")} type="email" placeholder="m@example.com" className="h-11" />
            {errors?.email && (
              <FieldDescription className="text-destructive">{errors.email.message}</FieldDescription>
            )}
          </Field>

          <Field className="grid gap-4 sm:grid-cols-2">
            <Field className="gap-2">
              <FieldLabel htmlFor="password">Mật khẩu</FieldLabel>
              <Input id="password" {...register("password")} type="password" className="h-11" />
            </Field>
            <Field className="gap-2">
              <FieldLabel htmlFor="confirm_password">Xác nhận mật khẩu</FieldLabel>
              <Input id="confirm_password" {...register("confirmPassword")} type="password" className="h-11" />
            </Field>
          </Field>
          {(errors?.password || errors?.confirmPassword) && (
            <FieldDescription className="text-destructive">
              {errors?.password?.message || errors?.confirmPassword?.message}
            </FieldDescription>
          )}

          <Button type="submit" disabled={loading} className="auth-submit-btn h-12 w-full rounded-xl">
            Tạo tài khoản
          </Button>

          <FieldSeparator>
            Hoặc tiếp tục với
          </FieldSeparator>

          <Field className="grid grid-cols-2 gap-3">
            <Button variant="outline" type="button" onClick={signInWithGoogle} className="auth-oauth-btn h-11 rounded-xl">
              Google
            </Button>
            <Button variant="outline" type="button" onClick={signInWithFacebook} className="auth-oauth-btn h-11 rounded-xl">
              Meta
            </Button>
          </Field>

          <FieldDescription className="text-center text-sm">
            Đã có tài khoản?{" "}
            <Link to="/signin" className="auth-signin__link">
              Đăng nhập
            </Link>
          </FieldDescription>
        </FieldGroup>
      </form>

      <p className="auth-signin__legal auth-reveal auth-reveal--delay-3">
        Bằng cách tiếp tục, bạn đồng ý với <a href="#">Điều khoản</a> và <a href="#">Chính sách</a>.
      </p>
    </div>
  );
}
