import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  // Create product with automatic or manually specified order
  async create(createProductDto: CreateProductDto) {
    const maxOrder = await this.prisma.product.aggregate({
      _max: {
        displayOrder: true,
      },
    });

    const displayOrder =
      createProductDto.displayOrder ??
      ((maxOrder._max.displayOrder ?? 0) + 1);

    return this.prisma.product.create({
      data: {
        ...createProductDto,
        displayOrder,
      },
      include: {
        category: true,
      },
    });
  }

  // Fetch products according to manual display order
  async findAll() {
    return this.prisma.product.findMany({
      include: {
        category: true,
      },
      orderBy: [
        {
          displayOrder: 'asc',
        },
        {
          createdAt: 'desc',
        },
      ],
    });
  }

  // Find one product
  async findOne(id: string) {
    return this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });
  }

  // Update product details or display order
  async update(id: string, updateProductDto: UpdateProductDto) {
    return this.prisma.product.update({
      where: { id },
      data: updateProductDto,
      include: {
        category: true,
      },
    });
  }

  // Delete product
  async remove(id: string) {
    return this.prisma.product.delete({
      where: { id },
    });
  }
}