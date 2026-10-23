
import { Module } from '@nestjs/common';
import { TrendingRentalsController } from './trending-rentals.controller';
import { TrendingRentalsService } from './trending-rentals.service';

@Module({
  controllers: [TrendingRentalsController],
  providers: [TrendingRentalsService],
})
export class TrendingRentalsModule {}
