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

  // Admin: fetch all banners.
  @Get('admin')
  async getAllBanners() {
    return this.bannersService.findAllForAdmin();
  }

  // Public: fetch all active, currently scheduled banners.
  @Get('public')
  async getPublicBanners() {
    return this.bannersService.getPublicBanners();
  }

  // Existing public endpoint: keep returning a single banner.
  @Get()
  async getActiveBanner() {
    return this.bannersService.getActiveBanner();
  }

  // Create a banner from an already uploaded image URL.
  @Post()
  async createBanner(@Body() body: BannerWriteInput) {
    return this.bannersService.createBanner(
      body.image ?? '',
      body,
    );
  }

  // Existing endpoint: preserve homepage banner text editing.
  @Patch('active')
  async updateActiveBanner(
    @Body() body: BannerWriteInput,
  ) {
    return this.bannersService.updateActiveBanner(body);
  }

  // Admin: update any banner by ID.
  @Patch(':id')
  async updateBanner(
    @Param('id') id: string,
    @Body() body: BannerWriteInput,
  ) {
    return this.bannersService.updateBanner(id, body);
  }

  // Admin: delete a banner by ID.
  @Delete(':id')
  async deleteBanner(
    @Param('id') id: string,
  ) {
    return this.bannersService.deleteBanner(id);
  }

  // Public: record an impression when a banner is displayed.
  @Post(':id/impression')
  async recordImpression(@Param('id') id: string) {
    return this.bannersService.recordImpression(id);
  }

  // Public: record a click on a banner.
  @Post(':id/click')
  async recordClick(@Param('id') id: string) {
    return this.bannersService.recordClick(id);
  }
}