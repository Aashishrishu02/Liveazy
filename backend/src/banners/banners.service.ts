
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { globalEtagCache } from '../common/services/etag-cache.service';

export type BannerWriteInput = {
  image?: string;
  images?: string[];
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
  private cachedActiveBanner: unknown = undefined;
  private activeBannerExpiresAt = 0;

  private cachedPublicBanners: unknown = null;
  private publicBannersExpiresAt = 0;

  private cachedAdminBanners: unknown = null;
  private adminBannersExpiresAt = 0;

  constructor(private readonly prisma: PrismaService) {}

  private invalidateCache() {
    this.cachedActiveBanner = undefined;
    this.activeBannerExpiresAt = 0;
    this.cachedPublicBanners = null;
    this.publicBannersExpiresAt = 0;
    this.cachedAdminBanners = null;
    this.adminBannersExpiresAt = 0;
    globalEtagCache.invalidate('banners');
  }

  private readonly bannerInclude = {
    images: {
      orderBy: { sortOrder: 'asc' as const },
    },
  };

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
  ): void {
    if (startsAt && endsAt && endsAt <= startsAt) {
      throw new BadRequestException(
        'Banner end date must be after its start date.',
      );
    }
  }

  private normalizeImages(images?: string[]): string[] | undefined {
    if (images === undefined) return undefined;

    if (!Array.isArray(images)) {
      throw new BadRequestException('Images must be an array.');
    }

    const normalized = images.map((url) => {
      if (typeof url !== 'string' || !url.trim()) {
        throw new BadRequestException(
          'Every banner image must have a valid URL.',
        );
      }

      return url.trim();
    });

    if (normalized.length === 0) {
      throw new BadRequestException(
        'At least one banner image is required.',
      );
    }

    return normalized;
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

  async getActiveBanner() {
    const now = Date.now();
    if (this.cachedActiveBanner !== undefined && now < this.activeBannerExpiresAt) {
      return this.cachedActiveBanner;
    }

    const banner = await this.prisma.banner.findFirst({
      where: this.getPublishWindow(),
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
      include: this.bannerInclude,
    });

    this.cachedActiveBanner = banner;
    this.activeBannerExpiresAt = now + 60000;
    return banner;
  }

  async getPublicBanners() {
    const now = Date.now();
    if (this.cachedPublicBanners && now < this.publicBannersExpiresAt) {
      return this.cachedPublicBanners;
    }

    const banners = await this.prisma.banner.findMany({
      where: {
        ...this.getPublishWindow(),
        placement: 'HOMEPAGE_HERO',
      },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
      include: this.bannerInclude,
    });

    this.cachedPublicBanners = banners;
    this.publicBannersExpiresAt = now + 60000;
    return banners;
  }

  async findAllForAdmin() {
    const now = Date.now();
    if (this.cachedAdminBanners && now < this.adminBannersExpiresAt) {
      return this.cachedAdminBanners;
    }

    const banners = await this.prisma.banner.findMany({
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
      include: this.bannerInclude,
    });

    this.cachedAdminBanners = banners;
    this.adminBannersExpiresAt = now + 60000;
    return banners;
  }

  async createBanner(
    image: string,
    options: BannerWriteInput = {},
  ) {
    const images = this.normalizeImages(options.images);

    const legacyImage =
      typeof image === 'string' ? image.trim() : '';

    const primaryImage = images?.[0] ?? legacyImage;

    if (!primaryImage) {
      throw new BadRequestException('Banner image is required.');
    }

    const startsAt = this.parseDate(options.startsAt) ?? null;
    const endsAt = this.parseDate(options.endsAt) ?? null;

    this.validateSchedule(startsAt, endsAt);

    const created = await this.prisma.banner.create({
      data: {
        image: primaryImage,
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
        ...(images !== undefined
          ? {
              images: {
                create: images.map((imageUrl, sortOrder) => ({
                  imageUrl,
                  sortOrder,
                })),
              },
            }
          : {}),
      },
      include: this.bannerInclude,
    });

    this.invalidateCache();
    return created;
  }

  async updateBanner(id: string, data: BannerWriteInput) {
    const existing = await this.prisma.banner.findUnique({
      where: { id },
      include: this.bannerInclude,
    });

    if (!existing) {
      throw new NotFoundException('Banner not found.');
    }

    const images = this.normalizeImages(data.images);

    const startsAt =
      data.startsAt !== undefined
        ? this.parseDate(data.startsAt) ?? null
        : existing.startsAt;

    const endsAt =
      data.endsAt !== undefined
        ? this.parseDate(data.endsAt) ?? null
        : existing.endsAt;

    this.validateSchedule(startsAt, endsAt);

    const suppliedImage =
      data.image !== undefined ? data.image.trim() : undefined;

    if (suppliedImage === '' && images === undefined) {
      throw new BadRequestException('Banner image cannot be empty.');
    }

    const primaryImage = images?.[0] ?? suppliedImage;

    const updated = await this.prisma.$transaction(async (tx) => {
      if (images !== undefined) {
        await tx.bannerImage.deleteMany({
          where: { bannerId: id },
        });

        await tx.bannerImage.createMany({
          data: images.map((imageUrl, sortOrder) => ({
            bannerId: id,
            imageUrl,
            sortOrder,
          })),
        });
      }

      return tx.banner.update({
        where: { id },
        data: {
          ...(primaryImage !== undefined
            ? { image: primaryImage }
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
        include: this.bannerInclude,
      });
    });

    this.invalidateCache();
    return updated;
  }

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

  async deleteBanner(id: string) {
    const existing = await this.prisma.banner.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Banner not found.');
    }

    const deleted = await this.prisma.banner.delete({
      where: { id },
    });

    this.invalidateCache();
    return deleted;
  }

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
