import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_WHATSAPP_NUMBER = '919423838109';
const MAX_MESSAGE_LENGTH = 1024;

const LEGACY_DEFAULT_MESSAGES = new Set([
  'Hi LIVEAZY!',
  'Hi LIVEAZY! I am interested in renting {productName}. Could you please share availability, monthly rent, security deposit, and delivery details?',
  'Hi LIVEAZY! I am interested in renting {productName}. Please share the rental price and availability.',
  'I want to rent this product: {productName}. Please share more details.',
]);

export interface WhatsAppSettingsResponse {
  whatsappNumber: string;
  whatsappMessage: string;
}


function isLegacyWhatsAppMessage(message: string): boolean {
  const normalized = message.trim().toLowerCase();

  if (!normalized) {
    return true;
  }

  if (LEGACY_DEFAULT_MESSAGES.has(message.trim())) {
    return true;
  }

  // Detect the previous generated message with automatically appended details.
  const hasOldMessagePrefix =
    normalized.startsWith('i want to rent this product:');

  const hasProductDetailsBlock =
    normalized.includes('product name:') &&
    normalized.includes('product id:') &&
    normalized.includes('category:') &&
    normalized.includes('rental duration:') &&
    normalized.includes('monthly rent:') &&
    normalized.includes('refundable deposit:');

  return hasOldMessagePrefix || hasProductDetailsBlock;
}

import { globalEtagCache } from '../common/services/etag-cache.service';

@Injectable()
export class SettingsService {
  private cachedSettings: WhatsAppSettingsResponse | null = null;
  private cacheExpiresAt = 0;

  constructor(private readonly prisma: PrismaService) {}

  private invalidateCache() {
    this.cachedSettings = null;
    this.cacheExpiresAt = 0;
    globalEtagCache.invalidate('settings');
  }

  async getWhatsAppSettings(): Promise<WhatsAppSettingsResponse> {
    const now = Date.now();
    if (this.cachedSettings && now < this.cacheExpiresAt) {
      return this.cachedSettings;
    }

    let setting = await this.prisma.siteSetting.findUnique({
      where: { id: 1 },
    });

    if (!setting) {
      setting = await this.prisma.siteSetting.upsert({
        where: { id: 1 },
        update: {},
        create: {
          id: 1,
          whatsappNumber: DEFAULT_WHATSAPP_NUMBER,
          whatsappMessage: '',
        },
      });
    }

    const storedMessage = setting.whatsappMessage ?? '';
    const isLegacyMessage = isLegacyWhatsAppMessage(storedMessage);

    // Clear only the recognised old template, not the WhatsApp number.
    if (isLegacyMessage && storedMessage !== '') {
      setting = await this.prisma.siteSetting.update({
        where: { id: setting.id },
        data: { whatsappMessage: '' },
      });
    }

    const response: WhatsAppSettingsResponse = {
      whatsappNumber: setting.whatsappNumber,
      whatsappMessage: isLegacyMessage ? '' : storedMessage,
    };

    this.cachedSettings = response;
    this.cacheExpiresAt = now + 60000;
    return response;
  }

  async updateWhatsAppSettings(
    whatsappNumber?: unknown,
    whatsappMessage?: unknown,
  ): Promise<WhatsAppSettingsResponse> {
    if (
      whatsappNumber === undefined &&
      whatsappMessage === undefined
    ) {
      throw new BadRequestException(
        'WhatsApp number or message is required.',
      );
    }

    const updateData: {
      whatsappNumber?: string;
      whatsappMessage?: string;
    } = {};

    if (whatsappNumber !== undefined) {
      if (typeof whatsappNumber !== 'string') {
        throw new BadRequestException(
          'WhatsApp number must be a string.',
        );
      }

      const digits = whatsappNumber.replace(/\D/g, '');

      if (digits.length < 10 || digits.length > 15) {
        throw new BadRequestException(
          'Enter a valid WhatsApp number with 10–15 digits including the country code.',
        );
      }

      updateData.whatsappNumber = digits;
    }

    if (whatsappMessage !== undefined) {
      if (typeof whatsappMessage !== 'string') {
        throw new BadRequestException(
          'WhatsApp message must be a string.',
        );
      }

      const message = whatsappMessage.trim();

      if (!message) {
        throw new BadRequestException(
          'WhatsApp message cannot be empty.',
        );
      }

      if (message.length > MAX_MESSAGE_LENGTH) {
        throw new BadRequestException(
          `WhatsApp message must be ${MAX_MESSAGE_LENGTH} characters or fewer.`,
        );
      }

      updateData.whatsappMessage = message;
    }

    // Clean any legacy template before applying the admin's new settings.
    await this.getWhatsAppSettings();

    const setting = await this.prisma.siteSetting.upsert({
      where: { id: 1 },
      update: updateData,
      create: {
        id: 1,
        whatsappNumber:
          updateData.whatsappNumber ?? DEFAULT_WHATSAPP_NUMBER,
        whatsappMessage: updateData.whatsappMessage ?? '',
      },
    });

    this.invalidateCache();

    return {
      whatsappNumber: setting.whatsappNumber,
      whatsappMessage: setting.whatsappMessage,
    };
  }
}