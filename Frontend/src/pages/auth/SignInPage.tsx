import { SigninForm } from '@/components/auth/signin-form';
import { AuthLayout } from '@/components/auth/auth-layout';
import { Card, CardContent } from '@/components/ui/card';
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
        <Card
          className="cursor-pointer border shadow-sm transition-shadow hover:border-primary/30 hover:shadow-md"
          onClick={handleNavigateHome}
        >
          <CardContent className="p-8">
            <h3 className="text-xl font-bold mb-2 text-foreground">Bạn đã đăng nhập.</h3>
            <p className="text-muted-foreground flex justify-between items-center">
              Quay trở lại ứng dụng! <ArrowRight />
            </p>
          </CardContent>
        </Card>
      )}
    </AuthLayout>
  );
};

export default SignInPage;
