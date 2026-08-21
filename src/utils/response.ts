import { Response } from "express";

export type TMeta = {
  page?: number;
  limit?: number;
  total?: number;
  totalPage?: number;
  totalPages?: number;
};

export type TResponse<T> = {
  statusCode: number;
  success: boolean;
  message?: string;
  meta?: TMeta;
  data?: T | null;
};

const sendResponse = <T>(res: Response, data: TResponse<T>): void => {
  res.status(data.statusCode).json({
    success: data.success,
    statusCode: data.statusCode,
    message: data.message || "Success",
    meta: data.meta || undefined,
    data: data.data !== undefined ? data.data : null,
  });
};

export default sendResponse;
