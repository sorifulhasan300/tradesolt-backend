import { Router } from "express";
import validationMiddleware from "../../../middleware/validate.middleware.js";
import { checkAuth } from "../../../middleware/auth.middleware.js";
import { UserRoles } from "../../../types/role.types.js";
import { setWorkAreaSchema } from "./workArea.validation.js";
import { workAreaController } from "./workArea.controller.js";

const router: Router = Router();

router.post(
  "/",
  checkAuth(UserRoles.TRADER),
  validationMiddleware(setWorkAreaSchema),
  workAreaController.setWorkArea,
);

router.get("/:traderId", workAreaController.getWorkArea);

export const workAreaRoutes: Router = router;
export default router;
