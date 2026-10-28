
import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import { globalEtagCache } from '../common/services/etag-cache.service';

@Injectable()
export class TrendingRentalsService {
  private publicCache: unknown = null;
  private publicCacheExpiresAt = 0;
  private adminCache: unknown = null;
  private adminCacheExpiresAt = 0;

  constructor(private readonly prisma: PrismaService) {}

  private invalidateCache() {
    this.publicCache = null;
    this.publicCacheExpiresAt = 0;
    this.adminCache = null;
    this.adminCacheExpiresAt = 0;
    globalEtagCache.invalidate('trending-rentals');
  }

  private readonly productInclude = {
    category: true,
    images: { orderBy: { sortOrder: 'asc' as const } },
  };

  async getPublicSection() {
    const now = Date.now();
    if (this.publicCache && now < this.publicCacheExpiresAt) {
      return this.publicCache;
    }

    const setting = await this.prisma.trendingRentalSetting.findUnique({
      where: { id: 1 },
      include: {
        products: {
          where: { product: { isActive: true } },
          orderBy: { sortOrder: 'asc' },
          include: {
            product: { include: this.productInclude },
          },
        },
      },
    });

    if (!setting || !setting.isActive) {
      const emptyResult = {
        isActive: false,
        heading: setting?.heading ?? 'Trending Rentals in Your City',
        subtitle: setting?.subtitle ?? 'Handpicked rentals for your home.',
        products: [],
      };
      this.publicCache = emptyResult;
      this.publicCacheExpiresAt = now + 60000;
      return emptyResult;
    }

    const result = {
      id: setting.id,
      heading: setting.heading,
      subtitle: setting.subtitle,
      isActive: setting.isActive,
      products: setting.products.map((item) => ({
        ...item.product,
        trendingSortOrder: item.sortOrder,
      })),
    };

    this.publicCache = result;
    this.publicCacheExpiresAt = now + 60000;
    return result;
  }

  async getAdminSection() {
    const now = Date.now();
    if (this.adminCache && now < this.adminCacheExpiresAt) {
      return this.adminCache;
    }

    let result = await this.prisma.trendingRentalSetting.findUnique({
      where: { id: 1 },
      include: {
        products: {
          orderBy: { sortOrder: 'asc' },
          include: {
            product: { include: this.productInclude },
          },
        },
      },
    });

    if (!result) {
      const setting = await this.ensureSetting();
      result = await this.prisma.trendingRentalSetting.findUnique({
        where: { id: setting.id },
        include: {
          products: {
            orderBy: { sortOrder: 'asc' },
            include: {
              product: { include: this.productInclude },
            },
          },
        },
      });
    }

    this.adminCache = result;
    this.adminCacheExpiresAt = now + 60000;
    return result;
  }

  private async ensureSetting() {
    return this.prisma.trendingRentalSetting.upsert({
      where: { id: 1 },
      create: { id: 1 },
      update: {},
    });
  }

  async updateSettings(input: {
    heading?: string;
    subtitle?: string;
    isActive?: boolean;
  }) {
    const data: {
      heading?: string;
      subtitle?: string;
      isActive?: boolean;
    } = {};

    if (input.heading !== undefined) {
      const heading = input.heading.trim();
      if (!heading) {
        throw new BadRequestException('Heading cannot be empty');
      }
      data.heading = heading;
    }

    if (input.subtitle !== undefined) {
      const subtitle = input.subtitle.trim();
      if (!subtitle) {
        throw new BadRequestException('Subtitle cannot be empty');
      }
      data.subtitle = subtitle;
    }

    if (input.isActive !== undefined) {
      data.isActive = input.isActive;
    }

    await this.ensureSetting();

    const updated = await this.prisma.trendingRentalSetting.update({
      where: { id: 1 },
      data,
    });

    this.invalidateCache();
    return updated;
  }

  async updateProducts(input: { productIds: string[] }) {
    if (!Array.isArray(input.productIds)) {
      throw new BadRequestException('productIds must be an array');
    }

    if (new Set(input.productIds).size !== input.productIds.length) {
      throw new BadRequestException('Duplicate product IDs are not allowed');
    }

    const productIds = input.productIds;

    if (productIds.length > 4) {
      throw new BadRequestException(
        'You can select a maximum of 4 trending products',
      );
    }

    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('One or more product IDs are invalid');
    }

    const setting = await this.ensureSetting();

    await this.prisma.$transaction(async (tx) => {
      await tx.trendingRentalProduct.deleteMany({
        where: { settingId: setting.id },
      });

      if (productIds.length) {
        await tx.trendingRentalProduct.createMany({
          data: productIds.map((productId, sortOrder) => ({
            settingId: setting.id,
            productId,
            sortOrder,
          })),
        });
      }
    });

    this.invalidateCache();
    return this.getAdminSection();
  }
}
