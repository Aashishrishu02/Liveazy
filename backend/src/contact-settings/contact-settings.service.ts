import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const EDITABLE_FIELDS = [
  'pageTitle',
  'pageDescription',
  'supportEmail',
  'supportPhone',
  'serviceLocations',
  'supportHours',
] as const;

import { globalEtagCache } from '../common/services/etag-cache.service';

type EditableField = (typeof EDITABLE_FIELDS)[number];

@Injectable()
export class ContactSettingsService {
  private cache: unknown = null;
  private cacheExpiresAt = 0;

  constructor(private readonly prisma: PrismaService) {}

  private invalidateCache() {
    this.cache = null;
    this.cacheExpiresAt = 0;
    globalEtagCache.invalidate('contact-settings');
  }

  async getSettings() {
    const now = Date.now();
    if (this.cache && now < this.cacheExpiresAt) {
      return this.cache;
    }

    const existing = await this.prisma.contactPageSetting.findUnique({
      where: { id: 1 },
    });

    if (existing) {
      this.cache = existing;
      this.cacheExpiresAt = now + 60000;
      return existing;
    }

    const created = await this.prisma.contactPageSetting.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1 },
    });

    this.cache = created;
    this.cacheExpiresAt = now + 60000;
    return created;
  }

  async updateSettings(input: Record<string, unknown>) {
    const updateData: Partial<Record<EditableField, string>> = {};

    for (const key of EDITABLE_FIELDS) {
      const value = input[key];

      if (value === undefined) {
        continue;
      }

      if (typeof value !== 'string') {
        throw new BadRequestException(
          `${key} must be a string.`,
        );
      }

      const trimmedValue = value.trim();

      if (trimmedValue.length > 2000) {
        throw new BadRequestException(
          `${key} must not exceed 2000 characters.`,
        );
      }

      updateData[key] = trimmedValue;
    }

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException(
        'Provide at least one valid contact setting to update.',
      );
    }

    const result = await this.prisma.contactPageSetting.upsert({
      where: { id: 1 },
      update: updateData,
      create: {
        id: 1,
        ...updateData,
      },
    });

    this.invalidateCache();
    return result;
  }
}