
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';

import {
  BannersService,
  type BannerWriteInput,
} from './banners.service';

@Controller('banners')
export class BannersController {
  constructor(
    private readonly bannersService: BannersService,
  ) {}

  @Get('admin')
  async getAllBanners() {
    return this.bannersService.findAllForAdmin();
  }

  @Get('public')
  async getPublicBanners() {
    return this.bannersService.getPublicBanners();
  }

  // Legacy endpoint: returns the highest-priority active banner.
  @Get()
  async getActiveBanner() {
    return this.bannersService.getActiveBanner();
  }

  @Post()
  async createBanner(@Body() body: BannerWriteInput) {
    return this.bannersService.createBanner(
      body.image ?? '',
      body,
    );
  }

  @Patch('active')
  async updateActiveBanner(
    @Body() body: BannerWriteInput,
  ) {
    return this.bannersService.updateActiveBanner(body);
  }

  @Patch(':id')
  async updateBanner(
    @Param('id') id: string,
    @Body() body: BannerWriteInput,
  ) {
    return this.bannersService.updateBanner(id, body);
  }

  @Delete(':id')
  async deleteBanner(@Param('id') id: string) {
    return this.bannersService.deleteBanner(id);
  }

  @Post(':id/impression')
  async recordImpression(@Param('id') id: string) {
    return this.bannersService.recordImpression(id);
  }

  @Post(':id/click')
  async recordClick(@Param('id') id: string) {
    return this.bannersService.recordClick(id);
  }
}
