import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type BannerWriteInput = {
  image?: string;
  topLabel?: string;
  heading?: string;
  subtitle?: string;
  button1Text?: string;
  button1Link?: string;
  button2Text?: string;
  button2Link?: string;
  isActive?: boolean;
  placement?: string;
  sortOrder?: number;
  startsAt?: string | Date | null;
  endsAt?: string | Date | null;
};

@Injectable()
export class BannersService {
  constructor(private readonly prisma: PrismaService) {}

  private parseDate(
    value: string | Date | null | undefined,
  ): Date | null | undefined {
    if (value === undefined) return undefined;
    if (value === null || value === '') return null;

    const date = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Invalid banner schedule date.');
    }

    return date;
  }

  private validateSchedule(
    startsAt: Date | null | undefined,
    endsAt: Date | null | undefined,
  ) {
    if (startsAt && endsAt && endsAt <= startsAt) {
      throw new BadRequestException(
        'Banner end date must be after its start date.',
      );
    }
  }

  private getPublishWindow(now = new Date()) {
    return {
      isActive: true,
      AND: [
        {
          OR: [
            { startsAt: null },
            { startsAt: { lte: now } },
          ],
        },
        {
          OR: [
            { endsAt: null },
            { endsAt: { gt: now } },
          ],
        },
      ],
    };
  }

  // Public: return the current highest-priority eligible banner.
  async getActiveBanner() {
    return this.prisma.banner.findFirst({
      where: this.getPublishWindow(),
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  }

  // Public: return every active banner within its scheduled window.
  async getPublicBanners() {
    return this.prisma.banner.findMany({
      where: this.getPublishWindow(),
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  }

  // Admin: return all banners, including inactive and scheduled ones.
  async findAllForAdmin() {
    return this.prisma.banner.findMany({
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  }

  // Create a new banner without deactivating existing banners.
  async createBanner(
    image: string,
    options: BannerWriteInput = {},
  ) {
    if (!image?.trim()) {
      throw new BadRequestException('Banner image is required.');
    }

    const startsAt = this.parseDate(options.startsAt) ?? null;
    const endsAt = this.parseDate(options.endsAt) ?? null;

    this.validateSchedule(startsAt, endsAt);

    return this.prisma.banner.create({
      data: {
        image: image.trim(),
        topLabel: options.topLabel,
        heading: options.heading,
        subtitle: options.subtitle,
        button1Text: options.button1Text,
        button1Link: options.button1Link,
        button2Text: options.button2Text,
        button2Link: options.button2Link,
        isActive: options.isActive ?? true,
        placement: options.placement ?? 'HOMEPAGE_HERO',
        sortOrder: options.sortOrder ?? 0,
        startsAt,
        endsAt,
      },
    });
  }

  // Admin: update an existing banner by ID.
  async updateBanner(id: string, data: BannerWriteInput) {
    const existing = await this.prisma.banner.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Banner not found.');
    }

    const startsAt =
      data.startsAt !== undefined
        ? this.parseDate(data.startsAt) ?? null
        : existing.startsAt;

    const endsAt =
      data.endsAt !== undefined
        ? this.parseDate(data.endsAt) ?? null
        : existing.endsAt;

    this.validateSchedule(startsAt, endsAt);

    return this.prisma.banner.update({
      where: { id },
      data: {
        ...(data.image !== undefined
          ? { image: data.image.trim() }
          : {}),
        ...(data.topLabel !== undefined
          ? { topLabel: data.topLabel }
          : {}),
        ...(data.heading !== undefined
          ? { heading: data.heading }
          : {}),
        ...(data.subtitle !== undefined
          ? { subtitle: data.subtitle }
          : {}),
        ...(data.button1Text !== undefined
          ? { button1Text: data.button1Text }
          : {}),
        ...(data.button1Link !== undefined
          ? { button1Link: data.button1Link }
          : {}),
        ...(data.button2Text !== undefined
          ? { button2Text: data.button2Text }
          : {}),
        ...(data.button2Link !== undefined
          ? { button2Link: data.button2Link }
          : {}),
        ...(data.isActive !== undefined
          ? { isActive: data.isActive }
          : {}),
        ...(data.placement !== undefined
          ? { placement: data.placement }
          : {}),
        ...(data.sortOrder !== undefined
          ? { sortOrder: data.sortOrder }
          : {}),
        ...(data.startsAt !== undefined
          ? { startsAt: this.parseDate(data.startsAt) ?? null }
          : {}),
        ...(data.endsAt !== undefined
          ? { endsAt: this.parseDate(data.endsAt) ?? null }
          : {}),
      },
    });
  }

  // Legacy endpoint: update the most recently created active banner.
  async updateActiveBanner(data: BannerWriteInput) {
    const activeBanner = await this.prisma.banner.findFirst({
      where: { isActive: true },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    if (!activeBanner) {
      throw new NotFoundException(
        'Please upload a banner image first.',
      );
    }

    return this.updateBanner(activeBanner.id, data);
  }

  // Admin: delete a banner record.
  async deleteBanner(id: string) {
    const existing = await this.prisma.banner.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Banner not found.');
    }

    return this.prisma.banner.delete({
      where: { id },
    });
  }

  // Public tracking endpoints: increment actual stored counters.
  async recordImpression(id: string) {
    return this.prisma.banner.update({
      where: { id },
      data: {
        impressions: { increment: 1 },
      },
      select: {
        id: true,
        impressions: true,
      },
    });
  }

  async recordClick(id: string) {
    return this.prisma.banner.update({
      where: { id },
      data: {
        clicks: { increment: 1 },
      },
      select: {
        id: true,
        clicks: true,
      },
    });
  }
}