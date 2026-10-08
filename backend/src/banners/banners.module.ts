import { Module } from '@nestjs/common';
import { BannersService } from './banners.service';
import { PrismaModule } from '../prisma/prisma.module';
import { BannersController } from './banners.controller';

@Module({
  imports: [PrismaModule],
  providers: [BannersService],
  exports: [BannersService],
  controllers: [BannersController],
})
export class BannersModule {}