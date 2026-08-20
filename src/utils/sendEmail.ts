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
    console.log('----------------------------------------------------');
    console.log('[Email Service Simulation (EMAIL_USER / EMAIL_PASS not set in .env)]');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    if (text) console.log(`Body (Text): ${text}`);
    console.log('----------------------------------------------------');
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: envVars.EMAIL_HOST || 'smtp.gmail.com',
      port: envVars.EMAIL_PORT || 587,
      secure: envVars.EMAIL_PORT === 465,
      auth: {
        user: envVars.EMAIL_USER,
        pass: envVars.EMAIL_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: envVars.EMAIL_FROM || `"TradeSlot" <${envVars.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });

    console.log(`[Email Sent Successfully] MessageID: ${info.messageId} | To: ${to}`);
  } catch (error: any) {
    console.error(`[Email Sending Error]:`, error?.message || error);
    console.log('----------------------------------------------------');
    console.log(`[Fallback Console Output]`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    if (text) console.log(`Body (Text): ${text}`);
    console.log('----------------------------------------------------');
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
