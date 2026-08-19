import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import ApiError from '../errors/ApiError.js';

export interface IGenericErrorMessage {
  path: string | number;
  message: string;
}

/**
 * Global Error Handler Middleware
 * Catches all uncaught operational and system errors across the application.
 */
export const globalErrorHandler: ErrorRequestHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR;
  let message = 'Something went wrong!';
  let errorMessages: IGenericErrorMessage[] = [];

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errorMessages = err?.message
      ? [
          {
            path: req.originalUrl,
            message: err.message,
          },
        ]
      : [];
  } else if (err?.name === 'PrismaClientKnownRequestError') {
    // Handle Prisma known request errors
    if (err.code === 'P2002') {
      statusCode = StatusCodes.CONFLICT;
      message = 'Duplicate field value entered (Unique constraint failure)';
      const target = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : err.meta?.target || 'field';
      errorMessages = [
        {
          path: target,
          message: `${target} already exists.`,
        },
      ];
    } else if (err.code === 'P2025') {
      statusCode = StatusCodes.NOT_FOUND;
      message = 'Record not found';
      errorMessages = [
        {
          path: req.originalUrl,
          message: err.meta?.cause || 'Requested record was not found in the database.',
        },
      ];
    } else {
      statusCode = StatusCodes.BAD_REQUEST;
      message = err.message;
      errorMessages = [
        {
          path: req.originalUrl,
          message: err.message,
        },
      ];
    }
  } else if (err instanceof Error) {
    message = err.message;
    errorMessages = err?.message
      ? [
          {
            path: req.originalUrl,
            message: err.message,
          },
        ]
      : [];
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errorMessages,
    stack: process.env.NODE_ENV !== 'production' ? err?.stack : undefined,
  });
};

export default globalErrorHandler;
