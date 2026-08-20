import { z } from 'zod';

export const setWorkAreaSchema = z.object({
  date: z
    .string({ message: 'Date is required' })
    .refine(
      (val) => /^\d{4}-\d{2}-\d{2}/.test(val) && !isNaN(Date.parse(val)),
      {
        message: 'Date must be a valid ISO Date string (e.g., "2026-08-21")',
      }
    ),
  zoneName: z
    .string({ message: 'Zone name is required' })
    .trim()
    .min(1, 'Zone name must be a non-empty string'),
  latitude: z
    .number({ message: 'Latitude must be a number' })
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90')
    .optional(),
  longitude: z
    .number({ message: 'Longitude must be a number' })
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180')
    .optional(),
});

export type TSetWorkArea = z.infer<typeof setWorkAreaSchema>;
