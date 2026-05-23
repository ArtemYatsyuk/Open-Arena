import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;

  const useMock =
    !process.env.SMTP_HOST || (process.env.SMTP_HOST === 'localhost' && !process.env.SMTP_USER);

  if (useMock) {
    transporter = nodemailer.createTransport({ jsonTransport: true });
    transporter.sendMail = async (mail) => {
      console.log(`[Email Mock] To: ${mail.to}`);
      console.log(`[Email Mock] Subject: ${mail.subject}`);
      console.log(`[Email Mock] Body:\n${mail.text}`);
      return {} as any;
    };
  } else {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    } as nodemailer.TransportOptions);
  }

  return transporter;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  const t = getTransporter();
  const from = process.env.EMAIL_FROM || 'noreply@openarena.local';
  await t.sendMail({ from, ...options });
}

export async function sendVerificationEmail(to: string, token: string): Promise<void> {
  const baseUrl = process.env.APP_URL || 'http://localhost:5173';
  const link = `${baseUrl}/verify-email?token=${token}`;
  await sendEmail({
    to,
    subject: 'Verify your email address',
    text: `Click this link to verify your email: ${link}\n\nThe link expires in 24 hours.`,
    html: `<p>Click <a href="${link}">here</a> to verify your email.</p><p>The link expires in 24 hours.</p>`,
  });
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const baseUrl = process.env.APP_URL || 'http://localhost:5173';
  const link = `${baseUrl}/reset-password?token=${token}`;
  await sendEmail({
    to,
    subject: 'Reset your password',
    text: `Click this link to reset your password: ${link}\n\nThe link expires in 1 hour. If you didn't request this, ignore this email.`,
    html: `<p>Click <a href="${link}">here</a> to reset your password.</p><p>The link expires in 1 hour.</p>`,
  });
}
