import { Router } from "express";
import authRoutes from "../app/module/auth/auth.route.js";
import workAreaRoutes from "../app/module/workArea/workArea.route.js";
import messageRoutes from "../app/module/message/message.route.js";
import bookingRoutes from "../app/module/booking/booking.route.js";
import paymentRoutes from "../app/module/payment/payment.route.js";

const router: Router = Router();

router.use("/auth", authRoutes);
router.use("/work-area", workAreaRoutes);
router.use("/messages", messageRoutes);
router.use("/bookings", bookingRoutes);
router.use("/payments", paymentRoutes);

export const routers: Router = router;
export default router;


