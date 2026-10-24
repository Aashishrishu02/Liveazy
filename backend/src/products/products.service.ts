
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto) {
    const maxOrder = await this.prisma.product.aggregate({
      _max: { displayOrder: true },
    });

    const displayOrder =
      createProductDto.displayOrder ??
      ((maxOrder._max.displayOrder ?? 0) + 1);

    return this.prisma.product.create({
      data: { ...createProductDto, displayOrder },
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  async findAll() {
    return this.prisma.product.findMany({
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
      },
      orderBy: [
        { displayOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    await this.findOne(id);

    return this.prisma.product.update({
      where: { id },
      data: updateProductDto,
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    // ProductImage records are removed automatically through onDelete: Cascade.
    return this.prisma.product.delete({ where: { id } });
  }

  async addImages(id: string, imageUrls: string[]) {
    const product = await this.findOne(id);

    if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
      throw new BadRequestException('At least one image URL is required');
    }

    const urls = imageUrls
      .filter((url) => typeof url === 'string')
      .map((url) => url.trim())
      .filter((url) => /^https?:\/\/\S+$/i.test(url));

    if (urls.length !== imageUrls.length) {
      throw new BadRequestException(
        'Every image URL must be a valid HTTP or HTTPS URL',
      );
    }

    const maxOrder = await this.prisma.productImage.aggregate({
      where: { productId: id },
      _max: { sortOrder: true },
    });

    const startOrder = (maxOrder._max.sortOrder ?? -1) + 1;

    await this.prisma.$transaction(async (tx) => {
      await tx.productImage.createMany({
        data: urls.map((imageUrl, index) => ({
          productId: id,
          imageUrl,
          sortOrder: startOrder + index,
        })),
      });

      // Keep the legacy primary image field working.
      if (!product.image) {
        await tx.product.update({
          where: { id },
          data: { image: urls[0] },
        });
      }
    });

    return this.findOne(id);
  }

  async reorderImages(id: string, imageIds: string[]) {
    await this.findOne(id);

    if (!Array.isArray(imageIds) || imageIds.length === 0) {
      throw new BadRequestException('Image IDs are required');
    }

    if (new Set(imageIds).size !== imageIds.length) {
      throw new BadRequestException('Duplicate image IDs are not allowed');
    }

    const existing = await this.prisma.productImage.findMany({
      where: { productId: id },
      select: { id: true },
    });

    if (
      existing.length !== imageIds.length ||
      !existing.every((image) => imageIds.includes(image.id))
    ) {
      throw new BadRequestException(
        'Provide every image ID belonging to this product exactly once',
      );
    }

    await this.prisma.$transaction(
      imageIds.map((imageId, index) =>
        this.prisma.productImage.update({
          where: { id: imageId },
          data: { sortOrder: index },
        }),
      ),
    );

    const ordered = await this.findOne(id);

    // Keep the legacy primary image in sync with the first gallery image.
    if (ordered.images.length > 0) {
      await this.prisma.product.update({
        where: { id },
        data: { image: ordered.images[0].imageUrl },
      });
    }

    return this.findOne(id);
  }

  async removeImage(id: string, imageId: string) {
    await this.findOne(id);

    const image = await this.prisma.productImage.findFirst({
      where: { id: imageId, productId: id },
    });

    if (!image) {
      throw new NotFoundException('Product image not found');
    }

    await this.prisma.productImage.delete({ where: { id: imageId } });

    const remaining = await this.prisma.productImage.findMany({
      where: { productId: id },
      orderBy: { sortOrder: 'asc' },
    });

    await this.prisma.$transaction([
      ...remaining.map((item, index) =>
        this.prisma.productImage.update({
          where: { id: item.id },
          data: { sortOrder: index },
        }),
      ),
      this.prisma.product.update({
        where: { id },
        data: { image: remaining[0]?.imageUrl ?? null },
      }),
    ]);

    return this.findOne(id);
  }

  async findSimilar(id: string) {
  const currentProduct = await this.prisma.product.findUnique({
    where: { id },
    select: { categoryId: true },
  });

  if (!currentProduct) {
    throw new NotFoundException('Product not found');
  }

  return this.prisma.product.findMany({
    where: {
      categoryId: currentProduct.categoryId,
      id: { not: id },
      isActive: true,
    },
    include: {
      category: true,
      images: {
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: [
      { displayOrder: 'asc' },
      { createdAt: 'desc' },
    ],
    take: 8,
  });
}
}
