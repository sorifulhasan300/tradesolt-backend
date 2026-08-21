import { Router } from 'express';
import validationMiddleware from '../../../middleware/validate.middleware.js';
import { checkAuth } from '../../../middleware/auth.middleware.js';
import { UserRoles } from '../../../types/role.types.js';
import { createPaymentIntentSchema } from './payment.validation.js';
import { paymentController } from './payment.controller.js';

const router: Router = Router();

// POST /api/v1/payments/onboard — Trader creates Stripe Express account & gets onboarding link
router.post(
  '/onboard',
  checkAuth(UserRoles.TRADER),
  paymentController.onboardTrader,
);

// POST /api/v1/payments/create-intent — Create PaymentIntent for a confirmed booking
router.post(
  '/create-intent',
  checkAuth(),
  validationMiddleware(createPaymentIntentSchema),
  paymentController.createPaymentIntent,
);

// GET /api/v1/payments/dashboard — Get Stripe Express dashboard login link
router.get(
  '/dashboard',
  checkAuth(UserRoles.TRADER),
  paymentController.getStripeDashboard,
);

export const paymentRoutes: Router = router;
export default router;
