
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { globalEtagCache } from '../common/services/etag-cache.service';

export interface PromoBannerInput {
  image?: string;
  label?: string;
  heading?: string;
  subtitle?: string;
  buttonText?: string;
  buttonLink?: string;
  isActive?: boolean;
  sortOrder?: number;
  placement?: string;
}

@Injectable()
export class PromoBannersService {
  private activeCache = new Map<string, { data: unknown; expiresAt: number }>();
  private allCache: unknown = null;
  private allCacheExpiresAt = 0;

  constructor(private readonly prisma: PrismaService) {}

  private invalidateCache() {
    this.activeCache.clear();
    this.allCache = null;
    this.allCacheExpiresAt = 0;
    globalEtagCache.invalidate('promo-banners');
  }

  // Public website: return active promo banners.
  async findActive(placement?: string) {
    const key = placement || '__all__';
    const now = Date.now();
    const cached = this.activeCache.get(key);

    if (cached && now < cached.expiresAt) {
      return cached.data;
    }

    const banners = await this.prisma.promoBanner.findMany({
      where: {
        isActive: true,
        ...(placement ? { placement } : {}),
      },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    this.activeCache.set(key, { data: banners, expiresAt: now + 60000 });
    return banners;
  }

  // Admin: return all banners, including inactive banners.
  async findAll() {
    const now = Date.now();
    if (this.allCache && now < this.allCacheExpiresAt) {
      return this.allCache;
    }

    const banners = await this.prisma.promoBanner.findMany({
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    this.allCache = banners;
    this.allCacheExpiresAt = now + 60000;
    return banners;
  }

  // Create a promo banner.
  async create(body: PromoBannerInput) {
    this.validate(body);

    const created = await this.prisma.promoBanner.create({
      data: {
        image: body.image!.trim(),
        label: body.label!.trim(),
        heading: body.heading!.trim(),
        subtitle: body.subtitle!.trim(),
        buttonText: body.buttonText!.trim(),
        buttonLink: body.buttonLink?.trim() || '#products',
        isActive: body.isActive ?? true,
        sortOrder: body.sortOrder ?? 0,
        placement: body.placement?.trim() || 'HOMEPAGE_PROMO',
      },
    });

    this.invalidateCache();
    return created;
  }

  // Update an existing promo banner.
  async update(id: string, body: PromoBannerInput) {
    const existing = await this.prisma.promoBanner.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Promo banner not found.');
    }

    this.validate(body, true);

    const updated = await this.prisma.promoBanner.update({
      where: { id },
      data: {
        ...(body.image !== undefined && {
          image: body.image.trim(),
        }),
        ...(body.label !== undefined && {
          label: body.label.trim(),
        }),
        ...(body.heading !== undefined && {
          heading: body.heading.trim(),
        }),
        ...(body.subtitle !== undefined && {
          subtitle: body.subtitle.trim(),
        }),
        ...(body.buttonText !== undefined && {
          buttonText: body.buttonText.trim(),
        }),
        ...(body.buttonLink !== undefined && {
          buttonLink: body.buttonLink.trim(),
        }),
        ...(body.isActive !== undefined && {
          isActive: body.isActive,
        }),
        ...(body.sortOrder !== undefined && {
          sortOrder: body.sortOrder,
        }),
        ...(body.placement !== undefined && {
          placement: body.placement.trim(),
        }),
      },
    });

    this.invalidateCache();
    return updated;
  }

  // Delete an existing promo banner.
  async remove(id: string) {
    const existing = await this.prisma.promoBanner.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Promo banner not found.');
    }

    const deleted = await this.prisma.promoBanner.delete({
      where: { id },
    });

    this.invalidateCache();
    return deleted;
  }

  // Public: record a banner impression.
  async recordImpression(id: string) {
    const existing = await this.prisma.promoBanner.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Promo banner not found.');
    }

    return this.prisma.promoBanner.update({
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

  // Public: record a banner click.
  async recordClick(id: string) {
    const existing = await this.prisma.promoBanner.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Promo banner not found.');
    }

    return this.prisma.promoBanner.update({
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

  // Validate required fields and display order.
  private validate(
    body: PromoBannerInput,
    partial = false,
  ) {
    const requiredFields = [
      'image',
      'label',
      'heading',
      'subtitle',
      'buttonText',
    ] as const;

    for (const field of requiredFields) {
      const value = body[field];

      if (!partial || value !== undefined) {
        if (typeof value !== 'string' || !value.trim()) {
          throw new BadRequestException(
            `${field} is required.`,
          );
        }
      }
    }

    if (
      body.sortOrder !== undefined &&
      (!Number.isInteger(body.sortOrder) ||
        body.sortOrder < 0)
    ) {
      throw new BadRequestException(
        'sortOrder must be a non-negative integer.',
      );
    }

    if (
      body.placement !== undefined &&
      !body.placement.trim()
    ) {
      throw new BadRequestException(
        'placement cannot be empty.',
      );
    }
  }
}
