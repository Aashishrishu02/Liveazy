
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TrendingRentalsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly productInclude = {
    category: true,
    images: { orderBy: { sortOrder: 'asc' as const } },
  };

  async getPublicSection() {
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
      return {
        isActive: false,
        heading: setting?.heading ?? 'Trending Rentals in Your City',
        subtitle: setting?.subtitle ?? 'Handpicked rentals for your home.',
        products: [],
      };
    }

    return {
      id: setting.id,
      heading: setting.heading,
      subtitle: setting.subtitle,
      isActive: setting.isActive,
      products: setting.products.map((item) => ({
        ...item.product,
        trendingSortOrder: item.sortOrder,
      })),
    };
  }

  async getAdminSection() {
    const setting = await this.ensureSetting();

    return this.prisma.trendingRentalSetting.findUnique({
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

    return this.prisma.trendingRentalSetting.update({
      where: { id: 1 },
      data,
    });
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

    return this.getAdminSection();
  }
}
