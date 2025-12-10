import { SigninForm } from "@/components/auth/signin-form";
import { useAuthStore } from "@/stores/useAuthStore";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router";
import { ToggleTheme } from "../../components/toggle-theme.tsx";
const SignInPage = () => {
  const { accessToken } = useAuthStore();
  const navigate = useNavigate();
  const handleNavigateHome = () => {
    navigate("/");
  };
  return (
    <div className="animated-bg dark:bg-login flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="absolute top-2 right-2">
        <ToggleTheme />
      </div>
      <div className="w-full max-w-sm md:max-w-4xl">
        {!accessToken ? (
          <SigninForm />
        ) : (
          <div
            className={`backdrop-blur-md rounded-2xl p-8 transition-all duration-700 border dark:bg-white/10 dark:border-white/20 hover:bg-white/15 bg-white/40 border-white/40 hover:scale-105 hover:shadow-xl`}
            onClick={handleNavigateHome}
          >
            <h3
              className={`text-xl font-bold mb-2 transition-colors duration-700 dark:text-white text-gray-900`}
            >
              Bạn đã đăng nhập.
            </h3>
            <p
              className={`transition-colors duration-700 dark:text-gray-300 text-gray-600 flex justify-between`}
            >
              Quay trở lại trang chủ để sử dụng ứng dụng! <ArrowRight />
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignInPage;
