import { z } from 'zod';

export const createBookingSchema = z.object({
  traderId: z.string().min(1, 'Trader ID is required'),
  customerName: z.string().min(1, 'Customer name is required'),
  customerPhone: z.string().min(1, 'Customer phone is required'),
  customerEmail: z.string().email('Invalid email').optional(),
  originChannel: z.enum([
    'WHATSAPP',
    'WEB_CHAT',
    'WEB_CHATBOT',
    'SMS',
    'TELEGRAM',
    'EMAIL',
    'VOICE',
  ]),
  startTime: z.string().datetime({ message: 'startTime must be a valid ISO 8601 datetime' }),
  endTime: z.string().datetime({ message: 'endTime must be a valid ISO 8601 datetime' }),
  bufferMinutes: z.number().int().min(0).default(30),
  flatBookingFee: z.number().int().min(0, 'Booking fee must be non-negative'),
  jobAmount: z.number().int().min(0).default(0),
});

export type TCreateBooking = z.infer<typeof createBookingSchema>;

export const updateBookingStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
});

export type TUpdateBookingStatus = z.infer<typeof updateBookingStatusSchema>;
