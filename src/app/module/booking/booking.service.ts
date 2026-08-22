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
    .search(["customerName", "customerEmail", "customerPhone"])
    .filter(["status", "originChannel", "traderId"])
    .dateRange("startTime", "startDate", "endDate")
    .numericRange("totalAmount", "minAmount", "maxAmount")
    .sort("startTime", "desc")
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

  const data = await prisma.booking.findMany({
    where: { traderId },
    include: {
      payment: true,
    },
  });

  return data;
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

const getAvailableSlotsFromDB = async (
  traderIdInput: string,
  dateInput?: string,
) => {
  let trader = await prisma.traderProfile.findUnique({
    where: { id: traderIdInput },
  });

  if (!trader) {
    trader = await prisma.traderProfile.findUnique({
      where: { userId: traderIdInput },
    });
  }

  const targetDate = dateInput ? new Date(dateInput) : new Date();
  const dateStr = targetDate.toISOString().split('T')[0];

  const slotHours = [8, 10, 13, 15];
  const slots = slotHours.map((hour) => {
    const start = new Date(`${dateStr}T${String(hour).padStart(2, '0')}:00:00.000Z`);
    const end = new Date(start.getTime() + 2 * 3600 * 1000);
    const bufferEnd = new Date(end.getTime() + 30 * 60 * 1000);
    return {
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      bufferEndTime: bufferEnd.toISOString(),
      available: true,
    };
  });

  if (trader) {
    const existingBookings = await prisma.booking.findMany({
      where: {
        traderId: trader.id,
        status: { not: BookingStatus.CANCELLED },
      },
    });

    for (const slot of slots) {
      const slotStartMs = new Date(slot.startTime).getTime();
      const slotEndMs = new Date(slot.endTime).getTime();

      for (const booking of existingBookings) {
        const bStartMs = booking.startTime.getTime();
        const bEndWithBufMs = booking.endTime.getTime() + booking.bufferMinutes * 60 * 1000;

        if (bStartMs < slotEndMs && slotStartMs < bEndWithBufMs) {
          slot.available = false;
          break;
        }
      }
    }
  }

  return slots;
};

export const bookingService = {
  createBookingInDB,
  getAllBookingsFromDB,
  getTraderBookingsFromDB,
  updateBookingStatusInDB,
  getBookingByIdFromDB,
  getAvailableSlotsFromDB,
};

export default bookingService;

