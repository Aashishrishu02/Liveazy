
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
  constructor(private readonly prisma: PrismaService) {}

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
    return this.prisma.banner.findFirst({
      where: this.getPublishWindow(),
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
      include: this.bannerInclude,
    });
  }

  async getPublicBanners() {
    return this.prisma.banner.findMany({
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
  }

  async findAllForAdmin() {
    const banners = await this.prisma.banner.findMany({
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
      include: this.bannerInclude,
    });

    // TEMPORARY DEBUG LOG: check whether image relations are returned.
    console.log(
      'BANNER IMAGE RELATIONS:',
      JSON.stringify(
        banners.map((banner) => ({
          id: banner.id,
          image: banner.image,
          images: banner.images,
        })),
        null,
        2,
      ),
    );

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

    return this.prisma.banner.create({
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

    return this.prisma.$transaction(async (tx) => {
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

    return this.prisma.banner.delete({
      where: { id },
    });
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
