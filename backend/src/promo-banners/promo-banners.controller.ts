import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import {
  PromoBannersService,
  type PromoBannerInput,
} from './promo-banners.service';

@Controller('promo-banners')
export class PromoBannersController {
  constructor(
    private readonly promoBannersService: PromoBannersService,
  ) {}

  // Public: active banners, optionally filtered by placement.
  @Get()
  findActive(
    @Query('placement') placement?: string,
  ) {
    return this.promoBannersService.findActive(placement);
  }

  // Admin: all banners, including inactive ones.
  @Get('admin')
  findAll() {
    return this.promoBannersService.findAll();
  }

  // Create a promo banner.
  @Post()
  create(@Body() body: PromoBannerInput) {
    return this.promoBannersService.create(body);
  }

  // Update banner content, placement, status, or order.
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: PromoBannerInput,
  ) {
    return this.promoBannersService.update(id, body);
  }

  // Delete a promo banner.
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.promoBannersService.remove(id);
  }
}