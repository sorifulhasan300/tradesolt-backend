import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../utils/catch.async.js";
import sendResponse from "../../../utils/response.js";
import ApiError from "../../../errors/ApiError.js";
import { bookingService } from "./booking.service.js";

const createBooking = catchAsync(async (req: Request, res: Response) => {
  const result = await bookingService.createBookingInDB(req.body);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Booking created successfully",
    data: result,
  });
});

const getAllBookings = catchAsync(async (req: Request, res: Response) => {
  const result = await bookingService.getAllBookingsFromDB(req.query);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Bookings fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getTraderBookingsById = catchAsync(
  async (req: Request, res: Response) => {
    const traderId = req.params.traderId as string;
    const result = await bookingService.getTraderBookingsFromDB(traderId);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Trader bookings fetched successfully",
      data: result,
    });
  },
);

const updateBookingStatus = catchAsync(async (req: Request, res: Response) => {
  const bookingId = req.params.bookingId as string;
  const { status } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    throw new ApiError(
      StatusCodes.UNAUTHORIZED,
      "User authentication required",
    );
  }

  const result = await bookingService.updateBookingStatusInDB(
    bookingId,
    status,
    userId,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Booking status updated successfully",
    data: result,
  });
});

const getBookingById = catchAsync(async (req: Request, res: Response) => {
  const bookingId = req.params.bookingId as string;
  const result = await bookingService.getBookingByIdFromDB(bookingId);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Booking fetched successfully",
    data: result,
  });
});

export const bookingController = {
  createBooking,
  getAllBookings,
  getTraderBookingsById,
  updateBookingStatus,
  getBookingById,
};

export default bookingController;
