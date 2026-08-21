import { z } from 'zod';

// For creating a payment intent for a confirmed booking
export const createPaymentIntentSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
});

export type TCreatePaymentIntent = z.infer<typeof createPaymentIntentSchema>;
