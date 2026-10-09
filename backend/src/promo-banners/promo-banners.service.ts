
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PromoBannersService {
  constructor(private readonly prisma: PrismaService) {}

  // Public homepage: active promo banners only
  async findActive() {
    return this.prisma.promoBanner.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  // Admin: all promo banners
  async findAll() {
    return this.prisma.promoBanner.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  // Create a promo banner
  async create(body: {
    image?: string;
    label?: string;
    heading?: string;
    subtitle?: string;
    buttonText?: string;
    buttonLink?: string;
    isActive?: boolean;
    sortOrder?: number;
  }) {
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
      },
    });
  }

  // Update a promo banner
  async update(
    id: string,
    body: {
      image?: string;
      label?: string;
      heading?: string;
      subtitle?: string;
      buttonText?: string;
      buttonLink?: string;
      isActive?: boolean;
      sortOrder?: number;
    },
  ) {
    const existing = await this.prisma.promoBanner.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Promo banner not found');
    }

    this.validate(body, true);

    return this.prisma.promoBanner.update({
      where: { id },
      data: {
        ...(body.image !== undefined && { image: body.image.trim() }),
        ...(body.label !== undefined && { label: body.label.trim() }),
        ...(body.heading !== undefined && { heading: body.heading.trim() }),
        ...(body.subtitle !== undefined && { subtitle: body.subtitle.trim() }),
        ...(body.buttonText !== undefined && {
          buttonText: body.buttonText.trim(),
        }),
        ...(body.buttonLink !== undefined && {
          buttonLink: body.buttonLink.trim(),
        }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.promoBanner.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Promo banner not found');
    }

    return this.prisma.promoBanner.delete({ where: { id } });
  }

  private validate(
    body: {
      image?: string;
      label?: string;
      heading?: string;
      subtitle?: string;
      buttonText?: string;
      sortOrder?: number;
    },
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
          throw new BadRequestException(`${field} is required`);
        }
      }
    }

    if (
      body.sortOrder !== undefined &&
      (!Number.isInteger(body.sortOrder) || body.sortOrder < 0)
    ) {
      throw new BadRequestException('sortOrder must be a non-negative integer');
    }
  }
}
