import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: createCategoryDto,
    });
  }

  async findAll() {
    return this.prisma.category.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.category.findUnique({
      where: { id },
    });
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    return this.prisma.category.update({
      where: { id },
      data: {
        name: updateCategoryDto.name,
        description: updateCategoryDto.description,
        image: updateCategoryDto.image,
        isActive: updateCategoryDto.isActive,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.category.delete({
      where: { id },
    });
  }
}