import { z } from 'zod';

export const verifyEmailSchema = z.object({
  email: z
    .string({ message: 'Email is required' })
    .email('Invalid email address'),
  otp: z
    .union([z.string(), z.number()], {
      message: 'OTP code is required',
    })
    .transform((val) => String(val).trim())
    .refine((val) => /^\d{6}$/.test(val), {
      message: 'OTP code must be exactly 6 digits',
    }),
});

export const resendOtpSchema = z.object({
  email: z
    .string({ message: 'Email is required' })
    .email('Invalid email address'),
});

export type TVerifyEmail = z.infer<typeof verifyEmailSchema>;
export type TResendOtp = z.infer<typeof resendOtpSchema>;
