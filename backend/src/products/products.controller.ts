
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';

import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @Get(':id/similar')
findSimilar(@Param('id') id: string) {
  return this.productsService.findSimilar(id);
}

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Post(':id/images')
  addImages(
    @Param('id') id: string,
    @Body('imageUrls') imageUrls: string[],
  ) {
    return this.productsService.addImages(id, imageUrls);
  }

  @Patch(':id/images/reorder')
  reorderImages(
    @Param('id') id: string,
    @Body('imageIds') imageIds: string[],
  ) {
    return this.productsService.reorderImages(id, imageIds);
  }

  @Delete(':id/images/:imageId')
  removeImage(
    @Param('id') id: string,
    @Param('imageId') imageId: string,
  ) {
    return this.productsService.removeImage(id, imageId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
