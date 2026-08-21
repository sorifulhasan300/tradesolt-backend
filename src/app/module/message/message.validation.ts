import { z } from 'zod';

export const receiveWebChatbotMessageSchema = z.object({
  senderId: z
    .string({
      message: 'Sender ID is required',
    })
    .min(1, 'Sender ID cannot be empty'),
  message: z
    .string({
      message: 'Message content is required',
    })
    .min(1, 'Message content cannot be empty'),
});

const directWhatsAppMessageSchema = z.object({
  from: z
    .string({
      message: 'Sender phone number (from) is required',
    })
    .min(1, 'Sender phone number cannot be empty'),
  text: z.union(
    [
      z.string().min(1, 'Text message cannot be empty'),
      z.object({
        body: z.string().min(1, 'Text body cannot be empty'),
      }),
    ],
    {
      message: 'Message text must be a string or object containing body',
    }
  ),
});

const metaWhatsAppMessageSchema = z.object({
  object: z.string().optional(),
  entry: z
    .array(
      z.object({
        id: z.string().optional(),
        changes: z
          .array(
            z.object({
              value: z.object({
                messaging_product: z.string().optional(),
                metadata: z.record(z.string(), z.any()).optional(),
                contacts: z.array(z.any()).optional(),
                messages: z
                  .array(
                    z.object({
                      from: z.string({ message: 'From phone number is required' }),
                      id: z.string().optional(),
                      timestamp: z.string().optional(),
                      type: z.string().optional(),
                      text: z
                        .object({
                          body: z.string(),
                        })
                        .optional(),
                    })
                  )
                  .min(1, 'At least one message is required'),
              }),
              field: z.string().optional(),
            })
          )
          .min(1, 'At least one change entry is required'),
      })
    )
    .min(1, 'At least one entry is required'),
});

export const receiveWhatsAppMessageSchema = z.union([
  directWhatsAppMessageSchema,
  metaWhatsAppMessageSchema,
]);

export type TReceiveWebChatbotMessage = z.infer<typeof receiveWebChatbotMessageSchema>;
export type TReceiveWhatsAppMessage = z.infer<typeof receiveWhatsAppMessageSchema>;
