import { StatusCodes } from 'http-status-codes';
import { CommunicationChannel } from '../../../generated/prisma/client.js';
import ApiError from '../../../errors/ApiError.js';
import prisma from '../../../lib/prisma.js';
import {
  TReceiveWebChatbotMessage,
  TReceiveWhatsAppMessage,
} from './message.validation.js';

export interface INormalizedMessagePayload {
  channel: CommunicationChannel;
  externalSenderId: string;
  messageContent: string;
  rawPayload: any;
}

/**
 * Inserts normalized message into the ChannelMessage database table.
 */
const createNormalizedMessage = async (payload: INormalizedMessagePayload) => {
  const channelMessage = await prisma.channelMessage.create({
    data: {
      channel: payload.channel,
      externalSenderId: payload.externalSenderId,
      messageContent: payload.messageContent,
      rawPayload: payload.rawPayload ?? {},
    },
  });

  return channelMessage;
};


const processWebChatbotMessage = async (payload: TReceiveWebChatbotMessage) => {
  return await createNormalizedMessage({
    channel: CommunicationChannel.WEB_CHATBOT,
    externalSenderId: payload.senderId,
    messageContent: payload.message,
    rawPayload: payload,
  });
};

const processWhatsAppMessage = async (payload: TReceiveWhatsAppMessage) => {
  let externalSenderId: string | undefined;
  let messageContent: string | undefined;

  const rawData = payload as any;

  if (rawData.from && rawData.text) {
    externalSenderId = rawData.from;
    if (typeof rawData.text === 'string') {
      messageContent = rawData.text;
    } else if (typeof rawData.text === 'object' && rawData.text?.body) {
      messageContent = rawData.text.body;
    }
  } 
  
  // Meta Cloud API format: { entry: [ { changes: [ { value: { messages: [ ... ] } } ] } ] }
  else if (rawData.entry && Array.isArray(rawData.entry)) {
    const messageObj = rawData.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (messageObj) {
      externalSenderId = messageObj.from;
      messageContent = messageObj.text?.body || messageObj.caption;
    }
  }

  if (!externalSenderId || !messageContent) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Unable to extract sender identity or message content from WhatsApp payload'
    );
  }

  return await createNormalizedMessage({
    channel: CommunicationChannel.WHATSAPP,
    externalSenderId,
    messageContent,
    rawPayload: payload,
  });
};

export const messageService = {
  createNormalizedMessage,
  processWebChatbotMessage,
  processWhatsAppMessage,
};

export default messageService;
