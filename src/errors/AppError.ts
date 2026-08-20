import ApiError from './ApiError.js';

export class AppError extends ApiError {
  constructor(statusCode: number, message: string, stack = '') {
    super(statusCode, message, stack);
  }
}

export default AppError;
