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

export default function PrivacyPage() {
  return (
    <LegalLayout title="Chính sách bảo mật">
      <section>
        <h2 className="text-lg font-medium text-foreground mb-2">1. Dữ liệu thu thập</h2>
        <p>
          MOJI thu thập thông tin bạn cung cấp khi đăng ký (tên, email, ảnh đại diện) và dữ liệu sử
          dụng cần thiết để vận hành dịch vụ chat. Đây là bản placeholder — cập nhật trước khi go-live.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-medium text-foreground mb-2">2. Cách sử dụng</h2>
        <p>
          Dữ liệu được dùng để xác thực tài khoản, đồng bộ tin nhắn, cải thiện trải nghiệm và hỗ trợ
          kỹ thuật. Chúng tôi không bán dữ liệu cá nhân cho bên thứ ba.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-medium text-foreground mb-2">3. Bảo mật</h2>
        <p>
          Mật khẩu được mã hóa. Phiên đăng nhập sử dụng token bảo mật. Bạn nên đăng xuất trên thiết
          bị dùng chung.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-medium text-foreground mb-2">4. Quyền của bạn</h2>
        <p>
          Bạn có thể yêu cầu truy cập, chỉnh sửa hoặc xóa dữ liệu cá nhân bằng cách liên hệ đội ngũ
          MOJI (email hỗ trợ — cập nhật sau).
        </p>
      </section>
    </LegalLayout>
  );
}
