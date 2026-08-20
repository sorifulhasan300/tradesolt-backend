import { Router, Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import ApiError from '../errors/ApiError.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router: Router = Router();

router.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'success',
    message: 'TradeSlot API v1 Endpoint',
  });
});

/**
 * Protected Endpoint Example: Daily Work Area Configuration
 * Requires valid Better Auth session/bearer token.
 */
router.post('/work-area', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Work area set successfully',
      data: {
        userId: user?.id,
        email: user?.email,
        role: (user as any)?.role,
        workArea: req.body,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Test Endpoint: Intentionally trigger a 400 Bad Request
router.post(
  '/test-error-400',
  (req: Request, res: Response, next: NextFunction) => {
    next(
      new ApiError(
        StatusCodes.BAD_REQUEST,
        'Test 400 Bad Request for audit logger'
      )
    );
  }
);

// Test Endpoint: Intentionally trigger a 500 Internal Server Error
router.get(
  '/test-error-500',
  (req: Request, res: Response, next: NextFunction) => {
    next(
      new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Test 500 Server Error for audit logger'
      )
    );
  }
);

export default router;
