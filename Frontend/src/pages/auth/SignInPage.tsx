import { SigninForm } from '@/components/auth/signin-form';
import { AuthLayout } from '@/components/auth/auth-layout';
import { useAuthStore } from '@/stores/useAuthStore';
import { ArrowRight } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';

const SignInPage = () => {
  const { accessToken, setAccessToken, getProfile } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const handleNavigateHome = () => {
    navigate('/');
  };

  useEffect(() => {
    if (searchParams.get('registered') === '1') {
      toast.success('Đăng ký thành công! Hãy đăng nhập để tiếp tục.');
      navigate('/signin', { replace: true });
      return;
    }

    const oauthStatus = searchParams.get('oauth');
    if (!oauthStatus) return;

    if (oauthStatus === 'success') {
      const token = searchParams.get('accessToken');
      if (!token) {
        toast.error('Đăng nhập OAuth thất bại: thiếu token.');
        navigate('/signin', { replace: true });
        return;
      }
      void (async () => {
        try {
          setAccessToken(token);
          await getProfile();
          toast.success('Đăng nhập thành công!');
          navigate('/', { replace: true });
        } catch (error) {
          console.error(error);
          toast.error('Không thể lấy thông tin người dùng sau khi đăng nhập OAuth.');
          navigate('/signin', { replace: true });
        }
      })();
      return;
    }

    const provider = searchParams.get('provider');
    const reason = searchParams.get('reason');
    toast.error(`Đăng nhập ${provider || 'OAuth'} thất bại${reason ? `: ${reason}` : '.'}`);
    navigate('/signin', { replace: true });
  }, [getProfile, navigate, searchParams, setAccessToken]);

  return (
    <AuthLayout>
      {!accessToken ? (
        <SigninForm />
      ) : (
        <div className="auth-signin__logged-in auth-reveal">
          <h3 className="auth-signin__title text-2xl sm:text-3xl">
            Bạn đã
            <br />
            <span className="italic font-medium">đăng nhập.</span>
          </h3>
          <p className="auth-signin__subtitle mb-6">
            Nhấn bên dưới để quay lại ứng dụng chat.
          </p>
          <button
            type="button"
            onClick={handleNavigateHome}
            className="auth-submit-btn inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-base font-medium text-primary-foreground active:scale-[0.98]"
          >
            Vào MOJI
            <ArrowRight className="size-4" />
          </button>
        </div>
      )}
    </AuthLayout>
  );
};

export default SignInPage;
