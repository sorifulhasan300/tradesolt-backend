import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';

export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    statusCode: StatusCodes.NOT_FOUND,
    message: 'API Not Found',
    errorMessages: [
      {
        path: req.originalUrl,
        message: `The requested path '${req.originalUrl}' with method '${req.method}' was not found on this server.`,
      },
    ],
  });
};

export default notFoundHandler;
