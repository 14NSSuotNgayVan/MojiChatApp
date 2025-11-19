import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { WaveCard } from "./ui/WaveCard";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  username: z.string().min(1, "Tên đăng nhập là bắt buộc"),
  displayName: z.string().min(1, "Tên hiển thị là bắt buộc"),
  email: z.email("Email không đúng định dạng").min(1, "Email là bắt buộc"),
  password: z.string().min(8, "Mật khẩu là bắt buộc"),
  confirmPassword: z.string().min(8, "Mật khẩu xác nhận là bắt buộc"),
});

type singinSchema = z.infer<typeof schema>;

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<singinSchema>({
    resolver: zodResolver(schema),
  });

  const handleSubmitForm = (data: singinSchema) => {};

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form
            className="p-6 md:p-8"
            onSubmit={handleSubmit(handleSubmitForm)}
          >
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <svg
                  fill="var(--primary)"
                  viewBox="0 0 32 32"
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-14 mx-auto my-1 block md:hidden"
                >
                  <title>slack</title>
                  <path d="M19.955 23.108c-1.74 0-3.151-1.411-3.151-3.151s1.411-3.151 3.151-3.151h7.889c1.74 0 3.151 1.411 3.151 3.151s-1.411 3.151-3.151 3.151v0zM19.955 24.693c1.739 0 3.149 1.41 3.149 3.149s-1.41 3.149-3.149 3.149c-1.738 0-3.148-1.408-3.149-3.146v-3.152zM23.108 12.044c0 1.74-1.411 3.151-3.151 3.151s-3.151-1.411-3.151-3.151v0-7.888c0-1.74 1.411-3.151 3.151-3.151s3.151 1.411 3.151 3.151v0zM24.693 12.044c0.001-1.738 1.41-3.147 3.148-3.147s3.148 1.41 3.148 3.149c0 1.738-1.408 3.147-3.145 3.149h-3.152zM12.044 8.893c1.736 0.005 3.142 1.413 3.142 3.15s-1.406 3.146-3.142 3.15h-7.888c-1.736-0.005-3.142-1.413-3.142-3.15s1.406-3.146 3.142-3.15h0zM12.044 7.305c-1.736-0.002-3.143-1.41-3.143-3.147 0-1.738 1.409-3.147 3.147-3.147s3.145 1.408 3.147 3.144v3.149zM8.893 19.955c0.005-1.736 1.413-3.142 3.15-3.142s3.146 1.406 3.15 3.142v7.889c-0.005 1.736-1.413 3.142-3.15 3.142s-3.146-1.406-3.15-3.142v-0zM7.305 19.955c-0.001 1.737-1.41 3.145-3.147 3.145s-3.147-1.409-3.147-3.147c0-1.738 1.408-3.146 3.145-3.147h3.149z"></path>
                </svg>
                <h1 className="text-2xl font-bold">Đăng ký</h1>
                <p className="text-muted-foreground text-sm text-balance">
                  Hãy nhập thông tin dưới đây để tạo tài khoản
                </p>
              </div>
              <Field>
                <Field className="grid md:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="username">Tên đăng nhập</FieldLabel>
                    <Input
                      id="username"
                      {...register("username")}
                      type="string"
                      placeholder="user_123"
                    />
                    {errors?.username && (
                      <FieldDescription className="text-accent">
                        {errors?.username?.message}
                      </FieldDescription>
                    )}
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="displayName">Tên hiển thị</FieldLabel>
                    <Input
                      id="displayName"
                      {...register("displayName")}
                      type="string"
                      placeholder="User 123"
                    />

                    {errors?.displayName && (
                      <FieldDescription className="text-accent">
                        {errors?.displayName?.message}
                      </FieldDescription>
                    )}
                  </Field>
                </Field>
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  {...register("email")}
                  type="email"
                  placeholder="m@example.com"
                />

                {errors?.email && (
                  <FieldDescription className="text-accent">
                    {errors?.email?.message}
                  </FieldDescription>
                )}
              </Field>
              <Field>
                <Field className="grid md:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="password">Mật khẩu</FieldLabel>
                    <Input
                      id="password"
                      {...register("password")}
                      type="password"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="confirm_password">
                      Xác nhận mật khẩu
                    </FieldLabel>
                    <Input
                      id="confirm_password"
                      {...register("confirmPassword")}
                      type="password"
                    />
                  </Field>
                </Field>
                {(errors?.password || errors?.confirmPassword) && (
                  <FieldDescription className="text-accent">
                    {errors?.password?.message ||
                      errors?.confirmPassword?.message}
                  </FieldDescription>
                )}
              </Field>
              <Field>
                <Button type="submit">Tạo tài khoản</Button>
              </Field>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                Hoặc tiếp tục với
              </FieldSeparator>
              <Field className="grid grid-cols-3 gap-4">
                <Button variant="outline" type="button">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
                      fill="currentColor"
                    />
                  </svg>
                  <span className="sr-only">Apple</span>
                </Button>
                <Button variant="outline" type="button">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                  <span className="sr-only">Google</span>
                </Button>
                <Button variant="outline" type="button">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86 5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843a3.743 3.743 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93-1.047 0-2.088.467-3.053 1.308-.652.57-1.257 1.29-1.82 2.05-.69-.875-1.335-1.547-1.958-2.056-1.182-.966-2.315-1.303-3.454-1.303zm10.16 2.053c1.147 0 2.188.758 2.992 1.999 1.132 1.748 1.647 4.195 1.647 6.4 0 1.548-.368 2.9-1.839 2.9-.58 0-1.027-.23-1.664-1.004-.496-.601-1.343-1.878-2.832-4.358l-.617-1.028a44.908 44.908 0 0 0-1.255-1.98c.07-.109.141-.224.211-.327 1.12-1.667 2.118-2.602 3.358-2.602zm-10.201.553c1.265 0 2.058.791 2.675 1.446.307.327.737.871 1.234 1.579l-1.02 1.566c-.757 1.163-1.882 3.017-2.837 4.338-1.191 1.649-1.81 1.817-2.486 1.817-.524 0-1.038-.237-1.383-.794-.263-.426-.464-1.13-.464-2.046 0-2.221.63-4.535 1.66-6.088.454-.687.964-1.226 1.533-1.533a2.264 2.264 0 0 1 1.088-.285z"
                      fill="currentColor"
                    />
                  </svg>
                  <span className="sr-only">Meta</span>
                </Button>
              </Field>
              <FieldDescription className="text-center">
                Bạn đã có tài khoản? <a href="#">Đăng nhập</a>
              </FieldDescription>
            </FieldGroup>
          </form>
          <div className="bg-muted relative hidden md:block">
            <WaveCard />
          </div>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </FieldDescription>
    </div>
  );
}
