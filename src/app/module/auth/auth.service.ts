import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError.js';
import prisma from '../../../lib/prisma.js';
import { auth } from '../../../lib/auth.js';
import { sendEmail, sendVerificationOtpEmail } from '../../../utils/sendEmail.js';
import QueryBuilder from '../../../utils/queryBuilder.js';

const resendOtpIntoDB = async (email: string): Promise<void> => {
  // 1. Verify user exists in database
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User with this email address does not exist');
  }

  // 2. Check if user is already verified
  if (user.emailVerified) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Email address is already verified');
  }

  // 3. Trigger Better Auth's emailOTP plugin API to generate & send a fresh OTP
  try {
    await auth.api.sendVerificationOTP({
      body: {
        email,
        type: 'email-verification',
      },
    });
  } catch (error: any) {
    try {
      await auth.api.sendVerificationEmail({
        body: {
          email,
        },
      });
    } catch (fallbackErr: any) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        fallbackErr?.message || error?.message || 'Failed to resend verification OTP'
      );
    }
  }
};

const verifyEmailInDB = async (email: string, otp: string): Promise<void> => {
  // 1. Verify user exists in database
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User with this email address does not exist');
  }

  // 2. Check if user is already verified
  if (user.emailVerified) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Email address is already verified');
  }

  // 3. Verify OTP using Better Auth API
  try {
    const result = await auth.api.verifyEmailOTP({
      body: {
        email,
        otp,
      },
    });

    if (!result || (result as any).status === false) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid or expired OTP code');
    }
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      error?.message || 'Invalid or expired OTP code'
    );
  }
};

const getAllTradersFromDB = async (query: Record<string, unknown> = {}) => {
  const queryBuilder = new QueryBuilder(query)
    .search(['displayName', 'bio', 'user.name', 'user.email', 'user.phone'])
    .filter(['businessId'])
    .dateRange('createdAt', 'startDate', 'endDate')
    .sort('createdAt', 'desc')
    .paginate();

  const where = queryBuilder.getWhere();
  const orderBy = queryBuilder.getOrderBy();
  const { skip, take } = queryBuilder.getPaginationParams();

  const [data, total] = await Promise.all([
    prisma.traderProfile.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            image: true,
            role: true,
          },
        },
        dailyWorkAreas: true,
      },
    }),
    prisma.traderProfile.count({ where }),
  ]);

  const meta = queryBuilder.getMeta(total);

  return { meta, data };
};

export const authService = {
  resendOtpIntoDB,
  verifyEmailInDB,
  getAllTradersFromDB,
  sendEmail,
  sendVerificationOtpEmail,
};

export default authService;
