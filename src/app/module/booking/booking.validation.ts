import { z } from 'zod';

export const createBookingSchema = z
  .object({
    traderId: z.string().min(1, 'Trader ID is required'),
    customerName: z.string().min(1, 'Customer name is required'),
    customerPhone: z.string().min(1, 'Customer phone is required'),
    customerEmail: z.string().email('Invalid email').optional().or(z.literal('')).nullable(),
    originChannel: z
      .enum([
        'WHATSAPP',
        'WEB_CHAT',
        'WEB_CHATBOT',
        'SMS',
        'TELEGRAM',
        'EMAIL',
        'VOICE',
      ])
      .optional(),
    channel: z.string().optional(),
    startTime: z.string().min(1, 'startTime is required'),
    endTime: z.string().optional(),
    bufferMinutes: z.number().int().min(0).optional().default(30),
    flatBookingFee: z.number().min(0).optional(),
    feeAmount: z.number().min(0).optional(),
    jobAmount: z.number().min(0).optional().default(0),
  })
  .transform((data) => {
    let originChannel = data.originChannel;
    if (!originChannel) {
      if (data.channel === 'WHATSAPP') originChannel = 'WHATSAPP';
      else if (data.channel === 'WEB_CHAT' || data.channel === 'DIRECT') originChannel = 'WEB_CHAT';
      else originChannel = 'WEB_CHATBOT';
    }

    const flatBookingFee = Math.round(data.flatBookingFee ?? data.feeAmount ?? 0);

    const startDate = new Date(data.startTime);
    const endDate = data.endTime
      ? new Date(data.endTime)
      : new Date(startDate.getTime() + 2 * 3600 * 1000);

    return {
      traderId: data.traderId,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail || undefined,
      originChannel,
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      bufferMinutes: data.bufferMinutes ?? 30,
      flatBookingFee,
      jobAmount: Math.round(data.jobAmount ?? 0),
    };
  });

export type TCreateBooking = z.infer<typeof createBookingSchema>;

export const updateBookingStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
});

export type TUpdateBookingStatus = z.infer<typeof updateBookingStatusSchema>;

