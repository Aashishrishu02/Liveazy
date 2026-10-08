import { Controller, Get, Post, Body } from '@nestjs/common';
import { BannersService } from './banners.service';

@Controller('banners')
export class BannersController {
  constructor(private readonly bannersService: BannersService) {}

  @Get()
  async getActiveBanner() {
    return this.bannersService.getActiveBanner();
  }

  @Post()
  async createBanner(@Body('image') image: string) {
    return this.bannersService.createBanner(image);
  }
}