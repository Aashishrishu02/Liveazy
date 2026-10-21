
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
  constructor(private readonly prisma: PrismaService) {}

  // Public website: return active promo banners.
  async findActive(placement?: string) {
    return this.prisma.promoBanner.findMany({
      where: {
        isActive: true,
        ...(placement ? { placement } : {}),
      },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  }

  // Admin: return all banners, including inactive banners.
  async findAll() {
    return this.prisma.promoBanner.findMany({
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  }

  // Create a promo banner.
  async create(body: PromoBannerInput) {
    this.validate(body);

    return this.prisma.promoBanner.create({
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

    return this.prisma.promoBanner.update({
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
  }

  // Delete an existing promo banner.
  async remove(id: string) {
    const existing = await this.prisma.promoBanner.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Promo banner not found.');
    }

    return this.prisma.promoBanner.delete({
      where: { id },
    });
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
