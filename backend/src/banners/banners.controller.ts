import { Controller, Get, Post, Patch, Body } from '@nestjs/common';
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

  @Patch('active')
  async updateActiveBanner(
    @Body()
    body: {
        topLabel?: string;
        heading?: string;
        subtitle?: string;
        button1Text?: string;
        button1Link?: string;
        button2Text?: string;
        button2Link?: string;

    },
  ){
    return this.bannersService.updateActiveBanner(body);
  }
}
