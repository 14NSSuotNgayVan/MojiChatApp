import { Link } from 'react-router';
import { MojiLogo } from '@/components/brand/moji-logo';
import { ToggleTheme } from '@/components/toggle-theme';

function LegalLayout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="flex items-center justify-between px-6 py-4 border-b">
        <Link to="/signin">
          <MojiLogo size="sm" showWordmark variant="mark" className="items-start" />
        </Link>
        <ToggleTheme />
      </header>
      <main className="max-w-2xl mx-auto px-6 py-12">
        <p className="app-welcome__eyebrow mb-2">MOJI</p>
        <h1 className="text-3xl font-semibold tracking-tight mb-8">{title}</h1>
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-muted-foreground leading-relaxed">
          {children}
        </div>
        <p className="mt-10 text-sm">
          <Link to="/signin" className="text-primary font-medium hover:underline">
            Quay lại đăng nhập
          </Link>
        </p>
      </main>
    </div>
  );
}

export default function TermsPage() {
  return (
    <LegalLayout title="Điều khoản sử dụng">
      <section>
        <h2 className="text-lg font-medium text-foreground mb-2">1. Giới thiệu</h2>
        <p>
          Chào mừng bạn đến với MOJI. Bằng việc sử dụng dịch vụ, bạn đồng ý tuân thủ các điều khoản
          dưới đây. Đây là bản placeholder — vui lòng cập nhật nội dung pháp lý chính thức trước khi
          phát hành công khai.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-medium text-foreground mb-2">2. Tài khoản</h2>
        <p>
          Bạn chịu trách nhiệm bảo mật thông tin đăng nhập và mọi hoạt động diễn ra trên tài khoản
          của mình. Không chia sẻ mật khẩu hoặc cho phép người khác truy cập tài khoản MOJI.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-medium text-foreground mb-2">3. Nội dung & hành vi</h2>
        <p>
          Không sử dụng MOJI để gửi nội dung vi phạm pháp luật, quấy rối, spam hoặc xâm phạm quyền
          của người khác. Chúng tôi có quyền tạm ngưng tài khoản vi phạm.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-medium text-foreground mb-2">4. Liên hệ</h2>
        <p>
          Mọi thắc mắc về điều khoản, vui lòng liên hệ qua email hỗ trợ chính thức của MOJI (cập nhật
          sau).
        </p>
      </section>
    </LegalLayout>
  );
}
