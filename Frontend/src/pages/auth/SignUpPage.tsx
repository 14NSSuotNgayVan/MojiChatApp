import { SignupForm } from '@/components/auth/signup-form';
import { AuthLayout } from '@/components/auth/auth-layout';

const SignUpPage = () => {
  return (
    <AuthLayout>
      <SignupForm />
    </AuthLayout>
  );
};

export default SignUpPage;
