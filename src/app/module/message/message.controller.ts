import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../utils/catch.async.js";
import sendResponse from "../../../utils/response.js";
import { messageService } from "./message.service.js";

const handleWebChatbotMessage = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    console.log("Received web chatbot message:", req.body);
    console.log(req.user?.id)
    const result = await messageService.processWebChatbotMessage(req.body);

    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "Web chatbot message received and normalized successfully",
      data: result,
    });
  },
);

const handleWhatsAppMessage = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const result = await messageService.processWhatsAppMessage(req.body);

    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "WhatsApp message received and normalized successfully",
      data: result,
    });
  },
);

export const messageController = {
  handleWebChatbotMessage,
  handleWhatsAppMessage,
};

export default messageController;
