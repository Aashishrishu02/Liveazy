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

type EditableField = (typeof EDITABLE_FIELDS)[number];

@Injectable()
export class ContactSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings() {
    return this.prisma.contactPageSetting.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1 },
    });
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

    return this.prisma.contactPageSetting.upsert({
      where: { id: 1 },
      update: updateData,
      create: {
        id: 1,
        ...updateData,
      },
    });
  }
}