import { Router } from "express";
import validationMiddleware from "../../../middleware/validate.middleware.js";
import { checkAuth } from "../../../middleware/auth.middleware.js";
import { UserRoles } from "../../../types/role.types.js";
import {
  createBookingSchema,
  updateBookingStatusSchema,
} from "./booking.validation.js";
import { bookingController } from "./booking.controller.js";

const router: Router = Router();

router.post(
  "/",
  checkAuth(),
  validationMiddleware(createBookingSchema),
  bookingController.createBooking,
);

router.get("/", checkAuth(), bookingController.getAllBookings);

router.get(
  "/trader/:traderId",
  checkAuth(UserRoles.TRADER, UserRoles.PLATFORM_ADMIN),
  bookingController.getTraderBookingsById,
);

router.get("/slots/:traderId", bookingController.getAvailableSlots);

router.get("/:bookingId", checkAuth(), bookingController.getBookingById);

router.patch(
  "/:bookingId/status",
  checkAuth(UserRoles.TRADER),
  validationMiddleware(updateBookingStatusSchema),
  bookingController.updateBookingStatus,
);

export const bookingRoutes: Router = router;
export default router;
