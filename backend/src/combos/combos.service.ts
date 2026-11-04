import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateComboDto } from './dto/create-combo.dto';
import { UpdateComboDto } from './dto/update-combo.dto';
import { globalEtagCache } from '../common/services/etag-cache.service';

@Injectable()
export class CombosService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicCombos() {
    const now = new Date();
    return this.prisma.comboOffer.findMany({
      where: {
        isActive: true,
        OR: [
          { validUntil: null },
          { validUntil: { gt: now } },
        ],
      },
      include: {
        products: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findAll() {
    return this.prisma.comboOffer.findMany({
      include: {
        products: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOne(id: string) {
    const combo = await this.prisma.comboOffer.findUnique({
      where: { id },
      include: {
        products: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!combo) {
      throw new NotFoundException(`Combo offer with ID ${id} not found`);
    }

    return combo;
  }

  async create(dto: CreateComboDto) {
    globalEtagCache.invalidate('combos');
    const discount =
      dto.discountPercent ??
      (dto.originalPrice > dto.specialPrice
        ? Math.round(((dto.originalPrice - dto.specialPrice) / dto.originalPrice) * 100)
        : 0);

    return this.prisma.comboOffer.create({
      data: {
        title: dto.title,
        description: dto.description,
        image: dto.image,
        originalPrice: dto.originalPrice,
        specialPrice: dto.specialPrice,
        discountPercent: discount,
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
        products: dto.productIds && dto.productIds.length > 0
          ? {
              create: dto.productIds.map((pId, idx) => ({
                productId: pId,
                sortOrder: idx,
              })),
            }
          : undefined,
      },
      include: {
        products: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async update(id: string, dto: UpdateComboDto) {
    await this.findOne(id);
    globalEtagCache.invalidate('combos');

    const discount =
      dto.discountPercent !== undefined
        ? dto.discountPercent
        : dto.originalPrice && dto.specialPrice && dto.originalPrice > dto.specialPrice
        ? Math.round(((dto.originalPrice - dto.specialPrice) / dto.originalPrice) * 100)
        : undefined;

    return this.prisma.$transaction(async (tx) => {
      if (dto.productIds !== undefined) {
        await tx.comboOfferProduct.deleteMany({
          where: { comboOfferId: id },
        });

        if (dto.productIds.length > 0) {
          await tx.comboOfferProduct.createMany({
            data: dto.productIds.map((pId, idx) => ({
              comboOfferId: id,
              productId: pId,
              sortOrder: idx,
            })),
          });
        }
      }

      return tx.comboOffer.update({
        where: { id },
        data: {
          title: dto.title,
          description: dto.description,
          image: dto.image,
          originalPrice: dto.originalPrice,
          specialPrice: dto.specialPrice,
          discountPercent: discount,
          isActive: dto.isActive,
          sortOrder: dto.sortOrder,
          validUntil: dto.validUntil !== undefined ? (dto.validUntil ? new Date(dto.validUntil) : null) : undefined,
        },
        include: {
          products: {
            include: {
              product: true,
            },
          },
        },
      });
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    globalEtagCache.invalidate('combos');
    return this.prisma.comboOffer.delete({
      where: { id },
    });
  }
}
