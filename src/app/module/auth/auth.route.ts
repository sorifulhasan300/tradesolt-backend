import { Router } from 'express';
import validationMiddleware from '../../../middleware/validate.middleware.js';
import { resendOtpSchema, verifyEmailSchema } from './auth.validation.js';
import { authController } from './auth.controller.js';

const router: Router = Router();

router.post('/resend-otp', validationMiddleware(resendOtpSchema), authController.resendOtp);
router.post('/verify-email', validationMiddleware(verifyEmailSchema), authController.verifyEmail);
router.get('/traders', authController.getAllTraders);

export const authRoutes: Router = router;
export default router;
