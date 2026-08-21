import { Router } from 'express';
import validationMiddleware from '../../../middleware/validate.middleware.js';
import {
  receiveWebChatbotMessageSchema,
  receiveWhatsAppMessageSchema,
} from './message.validation.js';
import { messageController } from './message.controller.js';

const router: Router = Router();

router.post(
  '/chatbot',
  validationMiddleware(receiveWebChatbotMessageSchema),
  messageController.handleWebChatbotMessage
);

router.post(
  '/whatsapp',
  validationMiddleware(receiveWhatsAppMessageSchema),
  messageController.handleWhatsAppMessage
);

export const messageRoutes: Router = router;
export default router;
