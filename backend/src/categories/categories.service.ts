
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(private prisma: PrismaService) {}

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

    return this.prisma.category.create({
      data: {
        name: createCategoryDto.name,
        description: createCategoryDto.description,
        image: createCategoryDto.image,
        displayOrder,
      },
    });
  }

  async findAll() {
    const startTime = performance.now();

    try {
      return await this.prisma.category.findMany({
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
    } finally {
      const duration = performance.now() - startTime;

      this.logger.log(
        `findAll completed in ${duration.toFixed(2)} ms`,
      );
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

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.prisma.category.update({
      where: { id },
      data: {
        name: updateCategoryDto.name,
        description: updateCategoryDto.description,
        image: updateCategoryDto.image,
        isActive: updateCategoryDto.isActive,
        displayOrder: updateCategoryDto.displayOrder,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.category.delete({
      where: { id },
    });
  }
}
