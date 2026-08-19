import { Request, Response, NextFunction } from 'express';
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  res.status(404).json({
    success: false,
    statusCode: 404,
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
