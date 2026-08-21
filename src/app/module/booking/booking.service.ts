import { StatusCodes } from "http-status-codes";
import prisma from "../../../lib/prisma.js";
import ApiError from "../../../errors/ApiError.js";
import { BookingStatus } from "../../../generated/prisma/client.js";
import { TCreateBooking } from "./booking.validation.js";
import QueryBuilder from "../../../utils/queryBuilder.js";

const createBookingInDB = async (payload: TCreateBooking) => {
  // 1. Validate Trader Exists in TraderProfile table (checks TraderProfile ID or User ID)
  let trader = await prisma.traderProfile.findUnique({
    where: { id: payload.traderId },
  });

  if (!trader) {
    trader = await prisma.traderProfile.findUnique({
      where: { userId: payload.traderId },
    });
  }

  if (!trader) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      `Trader with ID ${payload.traderId} not found.`,
    );
  }

  // Use the verified TraderProfile ID
  const traderId = trader.id;

  const newStartTime = new Date(payload.startTime);
  const newEndTime = new Date(payload.endTime);

  if (newEndTime <= newStartTime) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "endTime must be after startTime",
    );
  }

  // 2. Slot Conflict Detection
  // Fetch non-cancelled bookings for the trader
  const existingBookings = await prisma.booking.findMany({
    where: {
      traderId,
      status: { not: BookingStatus.CANCELLED },
    },
  });

  const newStartMs = newStartTime.getTime();
  const newEndMs = newEndTime.getTime();

  for (const existing of existingBookings) {
    const existingStartMs = existing.startTime.getTime();
    const existingEndWithBufferMs =
      existing.endTime.getTime() + existing.bufferMinutes * 60 * 1000;

    // Overlap logic: existingStart < newEnd AND newStart < existingEndWithBuffer
    if (existingStartMs < newEndMs && newStartMs < existingEndWithBufferMs) {
      throw new ApiError(
        StatusCodes.CONFLICT,
        "Time slot conflicts with an existing booking. Please choose a different time.",
      );
    }
  }

  // 3. Calculate totalAmount (flatBookingFee + jobAmount)
  const totalAmount = payload.flatBookingFee + payload.jobAmount;

  // 4. Create booking record
  const newBooking = await prisma.booking.create({
    data: {
      traderId,
      customerName: payload.customerName,
      customerPhone: payload.customerPhone,
      customerEmail: payload.customerEmail,
      originChannel: payload.originChannel,
      startTime: newStartTime,
      endTime: newEndTime,
      bufferMinutes: payload.bufferMinutes,
      flatBookingFee: payload.flatBookingFee,
      jobAmount: payload.jobAmount,
      totalAmount,
    },
  });

  return newBooking;
};

const getAllBookingsFromDB = async (query: Record<string, unknown> = {}) => {
  const queryBuilder = new QueryBuilder(query)
    .search(['customerName', 'customerEmail', 'customerPhone'])
    .filter(['status', 'originChannel', 'traderId'])
    .dateRange('startTime', 'startDate', 'endDate')
    .numericRange('totalAmount', 'minAmount', 'maxAmount')
    .sort('startTime', 'desc')
    .paginate();

  const where = queryBuilder.getWhere();
  const orderBy = queryBuilder.getOrderBy();
  const { skip, take } = queryBuilder.getPaginationParams();

  const [data, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        trader: true,
        payment: true,
      },
    }),
    prisma.booking.count({ where }),
  ]);

  const meta = queryBuilder.getMeta(total);

  return { meta, data };
};

const getTraderBookingsFromDB = async (
  traderIdInput: string,
  queryInput?: Record<string, unknown> | string,
) => {
  // 1. Validate Trader Exists in TraderProfile table (by TraderProfile ID or User ID)
  let trader = await prisma.traderProfile.findUnique({
    where: { id: traderIdInput },
  });

  if (!trader) {
    trader = await prisma.traderProfile.findUnique({
      where: { userId: traderIdInput },
    });
  }

  if (!trader) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      `Trader with ID ${traderIdInput} not found.`,
    );
  }

  const traderId = trader.id;

  let query: Record<string, unknown> = {};
  if (typeof queryInput === "string") {
    query = { startDate: queryInput, endDate: queryInput };
  } else if (queryInput && typeof queryInput === "object") {
    query = { ...queryInput };
    if (query.date && typeof query.date === "string") {
      query.startDate = query.startDate || query.date;
      query.endDate = query.endDate || query.date;
    }
  }

  const queryBuilder = new QueryBuilder(query)
    .addWhereCondition({ traderId })
    .search(['customerName', 'customerEmail', 'customerPhone'])
    .filter(['status', 'originChannel'])
    .dateRange('startTime', 'startDate', 'endDate')
    .numericRange('totalAmount', 'minAmount', 'maxAmount')
    .sort('startTime', 'asc')
    .paginate();

  const where = queryBuilder.getWhere();
  const orderBy = queryBuilder.getOrderBy();
  const { skip, take } = queryBuilder.getPaginationParams();

  const [data, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        payment: true,
      },
    }),
    prisma.booking.count({ where }),
  ]);

  const meta = queryBuilder.getMeta(total);

  return { meta, data };
};

const updateBookingStatusInDB = async (
  bookingId: string,
  status: string,
  userId: string,
) => {
  // 1. Find booking with trader profile included
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { trader: true },
  });

  if (!booking) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Booking not found");
  }

  // 2. Verify authorization
  if (booking.trader.userId !== userId) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "You are not authorized to update this booking",
    );
  }

  // 3. Update status
  const updatedBooking = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: status as BookingStatus },
  });

  return updatedBooking;
};

const getBookingByIdFromDB = async (bookingId: string) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      trader: true,
      payment: true,
    },
  });

  if (!booking) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Booking not found");
  }

  return booking;
};

export const bookingService = {
  createBookingInDB,
  getAllBookingsFromDB,
  getTraderBookingsFromDB,
  updateBookingStatusInDB,
  getBookingByIdFromDB,
};

export default bookingService;

