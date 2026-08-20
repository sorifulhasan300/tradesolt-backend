import { StatusCodes } from 'http-status-codes';
import { Prisma } from '../../../generated/prisma/client.js';
import ApiError from '../../../errors/ApiError.js';
import prisma from '../../../lib/prisma.js';
import { TSetWorkArea } from './workArea.validation.js';

const setDailyWorkAreaInDB = async (userId: string, payload: TSetWorkArea) => {
  const { date, zoneName, latitude, longitude } = payload;

  // 1. Find the linked TraderProfile for the authenticated user (or create if missing)
  let traderProfile = await prisma.traderProfile.findUnique({
    where: { userId },
  });

  if (!traderProfile) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        'User record not found'
      );
    }

    traderProfile = await prisma.traderProfile.create({
      data: {
        userId: user.id,
        displayName: user.name || user.email || 'Trader',
      },
    });
  }

  // Parse ISO Date string to JavaScript Date object
  const workDate = new Date(date);

  // Construct geometry JSON payload if latitude and longitude are supplied
  const geometryPayload: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput =
    latitude !== undefined && longitude !== undefined
      ? { type: 'Point', coordinates: [longitude, latitude], latitude, longitude }
      : Prisma.JsonNull;

  // 2. Upsert (Create or Update) the DailyWorkArea record for the given date
  const workArea = await prisma.dailyWorkArea.upsert({
    where: {
      traderId_date: {
        traderId: traderProfile.id,
        date: workDate,
      },
    },
    update: {
      zoneName,
      geometry: geometryPayload,
    },
    create: {
      traderId: traderProfile.id,
      date: workDate,
      zoneName,
      geometry: geometryPayload,
    },
  });

  return workArea;
};

export const workAreaService = {
  setDailyWorkAreaInDB,
};

export default workAreaService;
