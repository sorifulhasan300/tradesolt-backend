import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../utils/catch.async.js";
import sendResponse from "../../../utils/response.js";
import ApiError from "../../../errors/ApiError.js";
import { userService } from "./user.service.js";
import { Role } from "../../../generated/prisma/client.js";

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.getAllUsersFromDB(req.query);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Users fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.id as string;
  const result = await userService.updateUserStatusInDB(userId, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User status updated successfully",
    data: result,
  });
});

const updateUserRole = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.id as string;
  const { role } = req.body;
  const result = await userService.updateUserRoleInDB(userId, role as Role);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User role updated successfully",
    data: result,
  });
});

const getBusinessTechnicians = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        "User authentication required",
      );
    }
    const result = await userService.getBusinessTechniciansFromDB(
      userId,
      req.query,
    );
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Business technicians fetched successfully",
      meta: result.meta,
      data: result.data,
    });
  },
);

export const userController = {
  getAllUsers,
  updateUserStatus,
  updateUserRole,
  getBusinessTechnicians,
};

export default userController;
