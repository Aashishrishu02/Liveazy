
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getWhatsAppSettings() {
    const setting = await this.prisma.siteSetting.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        whatsappNumber: '919423838109',
      },
    });

    return {
      whatsappNumber: setting.whatsappNumber,
      whatsappMessage: setting.whatsappMessage,
    };
  }

  async updateWhatsAppSettings(
    whatsappNumber?: string,
    whatsappMessage?: string,
  ) {
    if (
      whatsappNumber === undefined &&
      whatsappMessage === undefined
    ) {
      throw new BadRequestException(
        'WhatsApp number or message is required',
      );
    }

    const updateData: {
      whatsappNumber?: string;
      whatsappMessage?: string;
    } = {};

    if (whatsappNumber !== undefined) {
      if (typeof whatsappNumber !== 'string') {
        throw new BadRequestException(
          'WhatsApp number must be a string',
        );
      }

      const number = whatsappNumber.replace(/\D/g, '');

      if (number.length < 10 || number.length > 15) {
        throw new BadRequestException(
          'Enter a valid WhatsApp number',
        );
      }

      updateData.whatsappNumber = number;
    }

    if (whatsappMessage !== undefined) {
      if (
        typeof whatsappMessage !== 'string' ||
        !whatsappMessage.trim()
      ) {
        throw new BadRequestException(
          'WhatsApp message cannot be empty',
        );
      }

      updateData.whatsappMessage = whatsappMessage.trim();
    }

    const setting = await this.prisma.siteSetting.upsert({
      where: { id: 1 },
      update: updateData,
      create: {
        id: 1,
        whatsappNumber:
          updateData.whatsappNumber ?? '919423838109',
        whatsappMessage:
          updateData.whatsappMessage ??
          'Hi LIVEAZY! I am interested in renting {productName}. Please share the rental price and availability.',
      },
    });

    return {
      whatsappNumber: setting.whatsappNumber,
      whatsappMessage: setting.whatsappMessage,
    };
  }
}
