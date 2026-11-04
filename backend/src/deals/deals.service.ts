import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { CategorySettingsDto } from './dto/category-settings.dto';
import { globalEtagCache } from '../common/services/etag-cache.service';

@Injectable()
export class DealsService {
  constructor(private readonly prisma: PrismaService) {}

  async getCurrentDeal() {
    const now = new Date();

    // 1. Try to find currently active and valid deal within scheduled window
    const currentDeal = await this.prisma.deal.findFirst({
      where: {
        isActive: true,
        startsAt: { lte: now },
        endsAt: { gt: now },
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
      orderBy: [
        { sortOrder: 'asc' },
        { endsAt: 'asc' },
      ],
    });

    if (currentDeal) {
      return {
        deal: currentDeal,
        status: 'ACTIVE' as const,
        expiresAt: currentDeal.endsAt,
        serverTime: now,
      };
    }

    // 2. If no currently active deal, look for next upcoming scheduled deal
    const upcomingDeal = await this.prisma.deal.findFirst({
      where: {
        isActive: true,
        startsAt: { gt: now },
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
      orderBy: [
        { startsAt: 'asc' },
      ],
    });

    return {
      deal: upcomingDeal,
      status: upcomingDeal ? ('UPCOMING' as const) : ('NONE' as const),
      expiresAt: upcomingDeal?.endsAt ?? null,
      startsAt: upcomingDeal?.startsAt ?? null,
      serverTime: now,
    };
  }

  async getPublicDeals() {
    const now = new Date();
    return this.prisma.deal.findMany({
      where: {
        isActive: true,
        startsAt: { lte: now },
        endsAt: { gt: now },
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
    return this.prisma.deal.findMany({
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
      orderBy: [
        { sortOrder: 'asc' },
        { startsAt: 'desc' },
      ],
    });
  }

  async findOne(id: string) {
    const deal = await this.prisma.deal.findUnique({
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

    if (!deal) {
      throw new NotFoundException(`Deal with ID ${id} not found`);
    }

    return deal;
  }

  async create(dto: CreateDealDto) {
    globalEtagCache.invalidate('deals');
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);

    if (endsAt <= startsAt) {
      throw new BadRequestException('Deal end date must be after start date');
    }

    const discount =
      dto.discountPercent ??
      (dto.originalPrice > dto.offerPrice
        ? Math.round(((dto.originalPrice - dto.offerPrice) / dto.originalPrice) * 100)
        : 0);

    return this.prisma.deal.create({
      data: {
        title: dto.title,
        subtitle: dto.subtitle,
        description: dto.description,
        image: dto.image,
        originalPrice: dto.originalPrice,
        offerPrice: dto.offerPrice,
        discountPercent: discount,
        startsAt,
        endsAt,
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
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

  async update(id: string, dto: UpdateDealDto) {
    const existing = await this.findOne(id);
    globalEtagCache.invalidate('deals');

    const startsAt = dto.startsAt ? new Date(dto.startsAt) : existing.startsAt;
    const endsAt = dto.endsAt ? new Date(dto.endsAt) : existing.endsAt;

    if (endsAt <= startsAt) {
      throw new BadRequestException('Deal end date must be after start date');
    }

    const originalPrice = dto.originalPrice ?? existing.originalPrice;
    const offerPrice = dto.offerPrice ?? existing.offerPrice;
    const discount =
      dto.discountPercent !== undefined
        ? dto.discountPercent
        : originalPrice > offerPrice
        ? Math.round(((originalPrice - offerPrice) / originalPrice) * 100)
        : existing.discountPercent;

    return this.prisma.$transaction(async (tx) => {
      if (dto.productIds !== undefined) {
        await tx.dealProduct.deleteMany({
          where: { dealId: id },
        });

        if (dto.productIds.length > 0) {
          await tx.dealProduct.createMany({
            data: dto.productIds.map((pId, idx) => ({
              dealId: id,
              productId: pId,
              sortOrder: idx,
            })),
          });
        }
      }

      return tx.deal.update({
        where: { id },
        data: {
          title: dto.title,
          subtitle: dto.subtitle,
          description: dto.description,
          image: dto.image,
          originalPrice: dto.originalPrice,
          offerPrice: dto.offerPrice,
          discountPercent: discount,
          startsAt: dto.startsAt ? startsAt : undefined,
          endsAt: dto.endsAt ? endsAt : undefined,
          isActive: dto.isActive,
          sortOrder: dto.sortOrder,
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
    globalEtagCache.invalidate('deals');
    return this.prisma.deal.delete({
      where: { id },
    });
  }

  async getCategorySettings() {
    try {
      const sec = await this.prisma.homepageSection.findUnique({
        where: { sectionKey: 'DEALS' },
        include: { items: true },
      });

      if (sec?.description) {
        try {
          const parsed = JSON.parse(sec.description);
          if (parsed && typeof parsed === 'object') {
            return {
              icon: parsed.icon || 'Flame',
              image: parsed.image || null,
            };
          }
        } catch {
          // Ignore parse error
        }
      }

      const item = sec?.items?.[0];
      return {
        icon: item?.icon || 'Flame',
        image: item?.image || null,
      };
    } catch {
      return { icon: 'Flame', image: null };
    }
  }

  async updateCategorySettings(dto: CategorySettingsDto) {
    globalEtagCache.invalidate('deals');
    globalEtagCache.invalidate('homepage-sections');

    let sec = await this.prisma.homepageSection.findUnique({
      where: { sectionKey: 'DEALS' },
      include: { items: true },
    });

    const iconVal = dto.icon ?? 'Flame';
    const imageVal = dto.image ?? null;
    const descJson = JSON.stringify({ icon: iconVal, image: imageVal });

    if (!sec) {
      await this.prisma.homepageSection.create({
        data: {
          sectionKey: 'DEALS',
          title: "This Week's Deals",
          subtitle: 'Limited-time deals with live countdown timers and unbeatable prices.',
          badge: 'Limited Offers',
          sortOrder: 7,
          isVisible: true,
          description: descJson,
          items: {
            create: [
              {
                title: 'Deals & Offers',
                subtitle: 'Limited Offers',
                icon: iconVal,
                image: imageVal,
                linkUrl: '#deals',
                sortOrder: 0,
                isActive: true,
              },
            ],
          },
        },
      });
    } else {
      await this.prisma.homepageSection.update({
        where: { id: sec.id },
        data: {
          description: descJson,
        },
      });

      if (sec.items && sec.items.length > 0) {
        await this.prisma.homepageSectionItem.update({
          where: { id: sec.items[0].id },
          data: {
            icon: iconVal,
            image: imageVal,
          },
        });
      } else {
        await this.prisma.homepageSectionItem.create({
          data: {
            sectionId: sec.id,
            title: 'Deals & Offers',
            subtitle: 'Limited Offers',
            icon: iconVal,
            image: imageVal,
            linkUrl: '#deals',
            sortOrder: 0,
            isActive: true,
          },
        });
      }
    }

    return { icon: iconVal, image: imageVal };
  }
}
