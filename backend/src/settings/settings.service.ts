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

export interface SocialSettingsResponse {
  facebookUrl: string;
  instagramUrl: string;
  whatsappNumber: string;
}

function validateAndNormalizeUrl(urlStr: string, fieldName: string): string {
  const trimmed = urlStr.trim();
  if (!trimmed) {
    return '';
  }

  const candidate =
    trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : `https://${trimmed}`;

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error();
    }
    if (!parsed.hostname || !parsed.hostname.includes('.')) {
      throw new Error();
    }
    return candidate;
  } catch {
    throw new BadRequestException(`Enter a valid URL for ${fieldName}.`);
  }
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
  private cachedSocialSettings: SocialSettingsResponse | null = null;
  private cacheExpiresAt = 0;

  constructor(private readonly prisma: PrismaService) {}

  private invalidateCache() {
    this.cachedSettings = null;
    this.cachedSocialSettings = null;
    this.cacheExpiresAt = 0;
    globalEtagCache.invalidate('settings');
  }

  async getWhatsAppSettings(): Promise<WhatsAppSettingsResponse> {
    const now = Date.now();
    if (this.cachedSettings && now < this.cacheExpiresAt) {
      return this.cachedSettings;
    }

    let setting = await this.prisma.siteSetting.findFirst({
      orderBy: { id: 'asc' },
    });

    if (!setting) {
      setting = await this.prisma.siteSetting.create({
        data: {
          whatsappNumber: DEFAULT_WHATSAPP_NUMBER,
          whatsappMessage: '',
          facebookUrl: '',
          instagramUrl: '',
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

    const existing = await this.prisma.siteSetting.findFirst({
      orderBy: { id: 'asc' },
    });
    const targetId = existing?.id ?? 1;

    const setting = await this.prisma.siteSetting.upsert({
      where: { id: targetId },
      update: updateData,
      create: {
        id: targetId,
        whatsappNumber:
          updateData.whatsappNumber ?? DEFAULT_WHATSAPP_NUMBER,
        whatsappMessage: updateData.whatsappMessage ?? '',
        facebookUrl: '',
        instagramUrl: '',
      },
    });

    this.invalidateCache();

    return {
      whatsappNumber: setting.whatsappNumber,
      whatsappMessage: setting.whatsappMessage,
    };
  }

  async getSocialSettings(): Promise<SocialSettingsResponse> {
    const now = Date.now();
    if (this.cachedSocialSettings && now < this.cacheExpiresAt) {
      return this.cachedSocialSettings;
    }

    let setting = await this.prisma.siteSetting.findFirst({
      orderBy: { id: 'asc' },
    });

    if (!setting) {
      setting = await this.prisma.siteSetting.create({
        data: {
          whatsappNumber: DEFAULT_WHATSAPP_NUMBER,
          whatsappMessage: '',
          facebookUrl: '',
          instagramUrl: '',
        },
      });
    }

    const response: SocialSettingsResponse = {
      facebookUrl: setting.facebookUrl ?? '',
      instagramUrl: setting.instagramUrl ?? '',
      whatsappNumber: setting.whatsappNumber ?? DEFAULT_WHATSAPP_NUMBER,
    };

    this.cachedSocialSettings = response;
    this.cacheExpiresAt = now + 60000;
    return response;
  }

  async updateSocialSettings(dto: {
    facebookUrl?: unknown;
    instagramUrl?: unknown;
    whatsappNumber?: unknown;
  }): Promise<SocialSettingsResponse> {
    if (!dto || typeof dto !== 'object') {
      throw new BadRequestException('Request body is required.');
    }

    const { facebookUrl, instagramUrl, whatsappNumber } = dto;

    if (
      facebookUrl === undefined &&
      instagramUrl === undefined &&
      whatsappNumber === undefined
    ) {
      throw new BadRequestException(
        'Provide at least one setting (facebookUrl, instagramUrl, or whatsappNumber) to update.',
      );
    }

    const updateData: {
      facebookUrl?: string;
      instagramUrl?: string;
      whatsappNumber?: string;
    } = {};

    if (facebookUrl !== undefined) {
      if (typeof facebookUrl !== 'string' && facebookUrl !== null) {
        throw new BadRequestException('Facebook URL must be a string.');
      }
      const trimmed = typeof facebookUrl === 'string' ? facebookUrl.trim() : '';
      if (!trimmed) {
        updateData.facebookUrl = '';
      } else {
        if (trimmed.length > 2048) {
          throw new BadRequestException(
            'Facebook URL must be 2048 characters or fewer.',
          );
        }
        updateData.facebookUrl = validateAndNormalizeUrl(trimmed, 'Facebook URL');
      }
    }

    if (instagramUrl !== undefined) {
      if (typeof instagramUrl !== 'string' && instagramUrl !== null) {
        throw new BadRequestException('Instagram URL must be a string.');
      }
      const trimmed = typeof instagramUrl === 'string' ? instagramUrl.trim() : '';
      if (!trimmed) {
        updateData.instagramUrl = '';
      } else {
        if (trimmed.length > 2048) {
          throw new BadRequestException(
            'Instagram URL must be 2048 characters or fewer.',
          );
        }
        updateData.instagramUrl = validateAndNormalizeUrl(trimmed, 'Instagram URL');
      }
    }

    if (whatsappNumber !== undefined) {
      if (typeof whatsappNumber !== 'string' && whatsappNumber !== null) {
        throw new BadRequestException('WhatsApp number must be a string.');
      }
      const trimmed = typeof whatsappNumber === 'string' ? whatsappNumber.trim() : '';
      if (!trimmed) {
        updateData.whatsappNumber = '';
      } else {
        const digits = trimmed.replace(/\D/g, '');
        if (digits.length < 10 || digits.length > 15) {
          throw new BadRequestException(
            'Enter a valid WhatsApp number with 10–15 digits including the country code.',
          );
        }
        updateData.whatsappNumber = digits;
      }
    }

    const existing = await this.prisma.siteSetting.findFirst({
      orderBy: { id: 'asc' },
    });
    const targetId = existing?.id ?? 1;

    const setting = await this.prisma.siteSetting.upsert({
      where: { id: targetId },
      update: updateData,
      create: {
        id: targetId,
        whatsappNumber:
          updateData.whatsappNumber ?? DEFAULT_WHATSAPP_NUMBER,
        whatsappMessage: '',
        facebookUrl: updateData.facebookUrl ?? '',
        instagramUrl: updateData.instagramUrl ?? '',
      },
    });

    this.invalidateCache();

    return {
      facebookUrl: setting.facebookUrl ?? '',
      instagramUrl: setting.instagramUrl ?? '',
      whatsappNumber: setting.whatsappNumber ?? '',
    };
  }
}