import { Router } from "express";
import authRoutes from "../app/module/auth/auth.route.js";
import workAreaRoutes from "../app/module/workArea/workArea.route.js";

const router: Router = Router();

router.use("/auth", authRoutes);
router.use("/work-area", workAreaRoutes);

export const routers: Router = router;
export default router;

