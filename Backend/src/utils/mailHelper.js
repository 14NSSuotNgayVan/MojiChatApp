import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const MAIL_FROM = process.env.MAIL_FROM || 'noreply@moji.local';

let transporter = null;

const getTransporter = () => {
    if (transporter) return transporter;
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
        return null;
    }
    transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465,
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS,
        },
    });
    return transporter;
};

export const sendPasswordResetEmail = async ({ to, resetUrl }) => {
    const mailer = getTransporter();
    const subject = 'Đặt lại mật khẩu MOJI';
    const text = `Bạn đã yêu cầu đặt lại mật khẩu MOJI.\n\nNhấn vào liên kết sau (có hiệu lực 1 giờ):\n${resetUrl}\n\nNếu bạn không yêu cầu, hãy bỏ qua email này.`;

    if (!mailer) {
        console.info('[MOJI mail dev fallback] Password reset link for', to, ':', resetUrl);
        return { devFallback: true };
    }

    await mailer.sendMail({
        from: MAIL_FROM,
        to,
        subject,
        text,
    });
    return { devFallback: false };
};
