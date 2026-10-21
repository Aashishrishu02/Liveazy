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

  @Get()
  findActive(@Query('placement') placement?: string) {
    return this.promoBannersService.findActive(placement);
  }

  @Get('admin')
  findAll() {
    return this.promoBannersService.findAll();
  }

  // Record one promo banner impression.
  @Post(':id/impression')
  recordImpression(@Param('id') id: string) {
    return this.promoBannersService.recordImpression(id);
  }

  // Record one promo banner click.
  @Post(':id/click')
  recordClick(@Param('id') id: string) {
    return this.promoBannersService.recordClick(id);
  }

  @Post()
  create(@Body() body: PromoBannerInput) {
    return this.promoBannersService.create(body);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: PromoBannerInput,
  ) {
    return this.promoBannersService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.promoBannersService.remove(id);
  }
}