import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../utils/catch.async.js';
import sendResponse from '../../../utils/response.js';
import { authService } from './auth.service.js';

const resendOtp = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  await authService.resendOtpIntoDB(email);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Verification OTP has been sent successfully to your email address',
    data: null,
  });
});

const verifyEmail = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { email, otp } = req.body;

  await authService.verifyEmailInDB(email, otp);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Email address verified successfully',
    data: null,
  });
});

const getAllTraders = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const result = await authService.getAllTradersFromDB(req.query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Traders fetched successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const authController = {
  resendOtp,
  verifyEmail,
  getAllTraders,
};

export default authController;
