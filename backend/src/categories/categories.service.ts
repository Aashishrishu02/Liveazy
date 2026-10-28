import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { globalEtagCache } from '../common/services/etag-cache.service';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);
  private cachedCategories: unknown = null;
  private cacheExpiresAt = 0;

  constructor(private prisma: PrismaService) {}

  private invalidateCache() {
    this.cachedCategories = null;
    this.cacheExpiresAt = 0;
    globalEtagCache.invalidate('categories');
  }

  async create(createCategoryDto: CreateCategoryDto) {
    let displayOrder = createCategoryDto.displayOrder;

    // Automatically place a new category at the end
    if (displayOrder === undefined) {
      const result = await this.prisma.category.aggregate({
        _max: {
          displayOrder: true,
        },
      });

      displayOrder = (result._max.displayOrder ?? 0) + 1;
    }

    const created = await this.prisma.category.create({
      data: {
        name: createCategoryDto.name,
        description: createCategoryDto.description,
        image: createCategoryDto.image,
        displayOrder,
      },
    });

    this.invalidateCache();
    return created;
  }

  async findAll() {
    const now = Date.now();
    if (this.cachedCategories && now < this.cacheExpiresAt) {
      return this.cachedCategories;
    }

    const startTime = performance.now();
    try {
      const categories = await this.prisma.category.findMany({
        orderBy: [
          { displayOrder: 'asc' },
          { createdAt: 'desc' },
        ],
        include: {
          _count: {
            select: {
              products: true,
            },
          },
        },
      });

      this.cachedCategories = categories;
      this.cacheExpiresAt = now + 60000; // 60s cache
      return categories;
    } finally {
      const duration = performance.now() - startTime;
      this.logger.log(`findAll completed in ${duration.toFixed(2)} ms`);
    }
  }

  async findOne(id: string) {
    return this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const updated = await this.prisma.category.update({
      where: { id },
      data: {
        name: updateCategoryDto.name,
        description: updateCategoryDto.description,
        image: updateCategoryDto.image,
        isActive: updateCategoryDto.isActive,
        displayOrder: updateCategoryDto.displayOrder,
      },
    });

    this.invalidateCache();
    return updated;
  }

  async remove(id: string) {
    const deleted = await this.prisma.category.delete({
      where: { id },
    });

    this.invalidateCache();
    return deleted;
  }
}
