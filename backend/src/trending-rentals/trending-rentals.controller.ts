
import {
  Body,
  Controller,
  Get,
  Put,
  UseGuards,
} from '@nestjs/common';

import { TrendingRentalsService } from './trending-rentals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminEmailGuard } from '../auth/guards/admin-email.guard';

@Controller('trending-rentals')
export class TrendingRentalsController {
  constructor(
    private readonly trendingRentalsService: TrendingRentalsService,
  ) {}

  // Public homepage API
  @Get()
  getPublicSection() {
    return this.trendingRentalsService.getPublicSection();
  }

  // Admin APIs require valid JWT and configured admin email
  @Get('admin')
  @UseGuards(JwtAuthGuard, AdminEmailGuard)
  getAdminSection() {
    return this.trendingRentalsService.getAdminSection();
  }

  @Put('admin/settings')
  @UseGuards(JwtAuthGuard, AdminEmailGuard)
  updateSettings(
    @Body()
    body: {
      heading?: string;
      subtitle?: string;
      isActive?: boolean;
    },
  ) {
    return this.trendingRentalsService.updateSettings(body);
  }

  @Put('admin/products')
  @UseGuards(JwtAuthGuard, AdminEmailGuard)
  updateProducts(@Body() body: { productIds: string[] }) {
    return this.trendingRentalsService.updateProducts(body);
  }
}
