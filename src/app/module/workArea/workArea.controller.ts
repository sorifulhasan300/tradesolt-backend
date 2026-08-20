import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../utils/catch.async.js';
import sendResponse from '../../../utils/response.js';
import ApiError from '../../../errors/ApiError.js';
import { workAreaService } from './workArea.service.js';

const setWorkArea = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;

  if (!userId) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'User is not authenticated');
  }

  const result = await workAreaService.setDailyWorkAreaInDB(userId, req.body);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Trader daily work area setup successfully',
    data: result,
  });
});

export const workAreaController = {
  setWorkArea,
};

export default workAreaController;
