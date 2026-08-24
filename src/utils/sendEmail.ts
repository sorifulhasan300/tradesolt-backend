import nodemailer from 'nodemailer';
import envVars from '../config/env.config.js';

export interface ISendEmailPayload {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export const sendEmail = async ({ to, subject, text, html }: ISendEmailPayload): Promise<void> => {
  if (!envVars.EMAIL_USER || !envVars.EMAIL_PASS) {
    console.warn('----------------------------------------------------');
    console.warn('[Email Warning]: EMAIL_USER or EMAIL_PASS environment variable is missing.');
    console.warn(`Simulated OTP sending for ${to}:`);
    if (text) console.warn(text);
    console.warn('----------------------------------------------------');
    if (envVars.NODE_ENV === 'production') {
      throw new Error('Email credentials (EMAIL_USER / EMAIL_PASS) are not configured on production server.');
    }
    return;
  }

  try {
    const isSecurePort = Number(envVars.EMAIL_PORT) === 465;

    // Align sender format to match authenticated Gmail account to prevent SPF/DKIM rejection or Gmail 553 error
    const sender = (envVars.EMAIL_HOST?.includes('gmail') && envVars.EMAIL_USER)
      ? `"TradeSlot" <${envVars.EMAIL_USER}>`
      : (envVars.EMAIL_FROM || `"TradeSlot" <${envVars.EMAIL_USER}>`);

    const transporter = nodemailer.createTransport({
      host: envVars.EMAIL_HOST || 'smtp.gmail.com',
      port: Number(envVars.EMAIL_PORT) || 587,
      secure: isSecurePort,
      auth: {
        user: envVars.EMAIL_USER,
        pass: envVars.EMAIL_PASS,
      },
      connectionTimeout: 10000, // 10s connection timeout for Vercel serverless
      greetingTimeout: 10000,   // 10s greeting timeout
      socketTimeout: 15000,     // 15s socket timeout
      tls: {
        rejectUnauthorized: false,
      },
    });

    const info = await transporter.sendMail({
      from: sender,
      to,
      subject,
      text,
      html,
    });

    console.log(`[Email Sent Successfully] MessageID: ${info.messageId} | To: ${to}`);
  } catch (error: any) {
    console.error(`[Email Sending Error]:`, error?.message || error);
    throw new Error(`Email delivery failed: ${error?.message || 'SMTP server rejected request'}`);
  }
};

export const sendVerificationOtpEmail = async (email: string, otp: string): Promise<void> => {
  const subject = 'Your TradeSlot Verification Code';
  const text = `Your verification code is: ${otp}. It will expire in 5 minutes.`;
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
      <h2 style="color: #1e293b; margin-top: 0; text-align: center;">Verify Your Email</h2>
      <p style="color: #475569; font-size: 16px; line-height: 1.5;">
        Welcome to <strong>TradeSlot</strong>! Use the 6-digit verification code below to verify your email address.
      </p>
      <div style="background-color: #f1f5f9; padding: 18px; border-radius: 8px; text-align: center; margin: 24px 0;">
        <span style="font-family: monospace; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #0f172a;">${otp}</span>
      </div>
      <p style="color: #64748b; font-size: 14px;">
        This code is valid for 5 minutes. If you did not request this email, please ignore it.
      </p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-bottom: 0;">
        &copy; TradeSlot Backend Services. All rights reserved.
      </p>
    </div>
  `;

  await sendEmail({ to: email, subject, text, html });
};

export default sendEmail;
