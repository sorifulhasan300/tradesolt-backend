import { Router, Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import ApiError from "../errors/ApiError.js";

const router: Router = Router();

router.get("/", (req: Request, res: Response) => {
  res.json({
    status: "success",
    message: "TradeSlot API v1 Endpoint",
  });
});

// Test Endpoint: Intentionally trigger a 400 Bad Request
router.post(
  "/test-error-400",
  (req: Request, res: Response, next: NextFunction) => {
    next(
      new ApiError(
        StatusCodes.BAD_REQUEST,
        "Test 400 Bad Request for audit logger",
      ),
    );
  },
);

// Test Endpoint: Intentionally trigger a 500 Internal Server Error
router.get(
  "/test-error-500",
  (req: Request, res: Response, next: NextFunction) => {
    next(
      new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Test 500 Server Error for audit logger",
      ),
    );
  },
);

export default router;
