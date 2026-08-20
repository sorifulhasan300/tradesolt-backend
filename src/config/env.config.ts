import dotenv from 'dotenv';
import { z } from 'zod';
import AppError from '../errors/AppError.js';

dotenv.config();

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z
    .string({ message: 'DATABASE_URL is required' })
    .url('DATABASE_URL must be a valid URL'),
  BETTER_AUTH_SECRET: z
    .string({ message: 'BETTER_AUTH_SECRET is required' })
    .min(1, 'BETTER_AUTH_SECRET cannot be empty'),
  BETTER_AUTH_URL: z
    .string({ message: 'BETTER_AUTH_URL is required' })
    .url('BETTER_AUTH_URL must be a valid URL'),
  STRIPE_SECRET_KEY: z
    .string({ message: 'STRIPE_SECRET_KEY is required' })
    .min(1, 'STRIPE_SECRET_KEY cannot be empty'),
  STRIPE_WEBHOOK_SECRET: z
    .string({ message: 'STRIPE_WEBHOOK_SECRET is required' })
    .min(1, 'STRIPE_WEBHOOK_SECRET cannot be empty'),
  CLIENT_URL: z
    .string({ message: 'CLIENT_URL is required' })
    .url('CLIENT_URL must be a valid URL'),
  BACKEND_URL: z
    .string({ message: 'BACKEND_URL is required' })
    .url('BACKEND_URL must be a valid URL'),
  EMAIL_USER: z.string().optional().default(''),
  EMAIL_PASS: z.string().optional().default(''),
  EMAIL_HOST: z.string().optional().default('smtp.gmail.com'),
  EMAIL_PORT: z.coerce.number().optional().default(587),
  EMAIL_FROM: z.string().optional().default('TradeSlot <no-reply@tradeslot.com>'),
});


export type EnvVars = z.infer<typeof envSchema>;

const validateEnv = (): EnvVars => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Environment Variable Validation Error:');
      const formattedErrors = error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      console.error(JSON.stringify(formattedErrors, null, 2));
      process.exit(1);
    }
    throw new AppError(500, 'Unexpected error during environment variable parsing');
  }
};

export const envVars: EnvVars = validateEnv();
export default envVars;
