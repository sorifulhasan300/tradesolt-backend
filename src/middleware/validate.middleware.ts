import { NextFunction, Request, Response } from "express";
import z from "zod";

const validationMiddleware = (schema: z.ZodObject) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.body.data) {
      req.body = JSON.parse(req.body.data);
    }
    const parseResult = schema.safeParse(req.body);
    if (!parseResult.success) {
      next(parseResult.error);
      return;
    }
    req.body = parseResult.data;
    next();
  };
};

export default validationMiddleware;
