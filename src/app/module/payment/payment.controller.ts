import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../utils/catch.async.js';
import sendResponse from '../../../utils/response.js';
import ApiError from '../../../errors/ApiError.js';
import { paymentService } from './payment.service.js';

const onboardTrader = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new ApiError(
      StatusCodes.UNAUTHORIZED,
      'User authentication required',
    );
  }

  const result = await paymentService.createStripeConnectAccount(userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Stripe Connect onboarding link generated successfully',
    data: result,
  });
});

const createPaymentIntent = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentService.createPaymentIntentForBooking(
    req.body.bookingId,
  );

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Payment intent created successfully',
    data: result,
  });
});

const getStripeDashboard = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new ApiError(
      StatusCodes.UNAUTHORIZED,
      'User authentication required',
    );
  }

  const result = await paymentService.getStripeConnectDashboardLink(userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Stripe dashboard link generated successfully',
    data: result,
  });
});

const getAllPayments = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentService.getAllPaymentsFromDB(
    req.query,
    req.user,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Payments fetched successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const paymentController = {
  onboardTrader,
  createPaymentIntent,
  getStripeDashboard,
  getAllPayments,
};

export default paymentController;
