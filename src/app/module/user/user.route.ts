import { Router } from "express";
import validationMiddleware from "../../../middleware/validate.middleware.js";
import { checkAuth } from "../../../middleware/auth.middleware.js";
import { UserRoles } from "../../../types/role.types.js";
import {
  updateUserStatusSchema,
  updateUserRoleSchema,
} from "./user.validation.js";
import { userController } from "./user.controller.js";

const router: Router = Router();

// GET /api/v1/users (Protected: PLATFORM_ADMIN)
router.get(
  "/",
  checkAuth(UserRoles.PLATFORM_ADMIN),
  userController.getAllUsers,
);

// GET /api/v1/users/business/technicians (Protected: BUSINESS_ADMIN, PLATFORM_ADMIN)
router.get(
  "/business/technicians",
  checkAuth(UserRoles.BUSINESS_ADMIN, UserRoles.PLATFORM_ADMIN),
  userController.getBusinessTechnicians,
);

// PATCH /api/v1/users/:id/status (Protected: PLATFORM_ADMIN)
router.patch(
  "/:id/status",
  checkAuth(UserRoles.PLATFORM_ADMIN),
  validationMiddleware(updateUserStatusSchema),
  userController.updateUserStatus,
);

// PATCH /api/v1/users/:id/role (Protected: PLATFORM_ADMIN)
router.patch(
  "/:id/role",
  checkAuth(UserRoles.PLATFORM_ADMIN),
  validationMiddleware(updateUserRoleSchema),
  userController.updateUserRole,
);

export const userRoutes: Router = router;
export default router;
