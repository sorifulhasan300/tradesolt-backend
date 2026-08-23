import { StatusCodes } from "http-status-codes";
import prisma from "../../../lib/prisma.js";
import ApiError from "../../../errors/ApiError.js";
import QueryBuilder from "../../../utils/queryBuilder.js";
import { Role } from "../../../generated/prisma/client.js";
import { TUpdateUserStatus } from "./user.validation.js";

const getAllUsersFromDB = async (query: Record<string, unknown> = {}) => {
  const queryBuilder = new QueryBuilder(query)
    .search(["name", "email", "phone"])
    .filter(["role", "emailVerified"])
    .dateRange("createdAt", "startDate", "endDate")
    .sort("createdAt", "desc")
    .paginate();

  const where = queryBuilder.getWhere();
  const orderBy = queryBuilder.getOrderBy();
  const { skip, take } = queryBuilder.getPaginationParams();

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        traderProfile: {
          include: {
            business: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const meta = queryBuilder.getMeta(total);

  return { meta, data };
};

const updateUserStatusInDB = async (
  userId: string,
  payload: TUpdateUserStatus,
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  const updateData: { emailVerified?: boolean } = {};

  if (typeof payload.emailVerified === "boolean") {
    updateData.emailVerified = payload.emailVerified;
  } else if (payload.status) {
    const statusUpper = payload.status.toUpperCase();
    if (statusUpper === "SUSPENDED" || statusUpper === "INACTIVE") {
      updateData.emailVerified = false;
    } else if (statusUpper === "ACTIVE" || statusUpper === "VERIFIED") {
      updateData.emailVerified = true;
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    include: {
      traderProfile: true,
    },
  });

  return updatedUser;
};

const updateUserRoleInDB = async (userId: string, role: Role) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { traderProfile: true },
  });

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  if (role === "TRADER" && !user.traderProfile) {
    await prisma.traderProfile.create({
      data: {
        userId: user.id,
        displayName: user.name || user.email.split("@")[0] || "Trader Pro",
        bio: "Verified TradeSlot Professional",
      },
    });
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { role },
    include: {
      traderProfile: true,
    },
  });

  return updatedUser;
};

const getBusinessTechniciansFromDB = async (
  adminUserId: string,
  query: Record<string, unknown> = {},
) => {
  let targetBusinessId = query.businessId ? String(query.businessId) : undefined;

  if (!targetBusinessId && adminUserId) {
    const adminTraderProfile = await prisma.traderProfile.findUnique({
      where: { userId: adminUserId },
    });
    if (adminTraderProfile?.businessId) {
      targetBusinessId = adminTraderProfile.businessId;
    }
  }

  const queryBuilder = new QueryBuilder(query)
    .search(["name", "email", "phone", "traderProfile.displayName"])
    .filter(["emailVerified"])
    .sort("createdAt", "desc")
    .paginate();

  const whereConditions: Record<string, any> = {
    role: "TRADER",
  };

  if (targetBusinessId) {
    whereConditions.traderProfile = {
      businessId: targetBusinessId,
    };
  }

  queryBuilder.addWhereCondition(whereConditions);

  const where = queryBuilder.getWhere();
  const orderBy = queryBuilder.getOrderBy();
  const { skip, take } = queryBuilder.getPaginationParams();

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        traderProfile: {
          include: {
            business: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const meta = queryBuilder.getMeta(total);

  return { meta, data };
};

export const userService = {
  getAllUsersFromDB,
  updateUserStatusInDB,
  updateUserRoleInDB,
  getBusinessTechniciansFromDB,
};

export default userService;
