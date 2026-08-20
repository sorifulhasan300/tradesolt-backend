import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../lib/auth.js';
import ApiError from '../errors/ApiError.js';

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const sessionData = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!sessionData || !sessionData.session || !sessionData.user) {
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        'Unauthorized: Invalid or missing session token'
      );
    }

    req.user = sessionData.user;
    req.session = sessionData.session;

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      next(
        new ApiError(
          StatusCodes.UNAUTHORIZED,
          'Unauthorized: Authentication verification failed'
        )
      );
    }
  }
};

export default requireAuth;
