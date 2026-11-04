import { Module } from '@nestjs/common';
import { CustomerStoriesService } from './customer-stories.service';
import { CustomerStoriesController } from './customer-stories.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [CustomerStoriesController],
  providers: [CustomerStoriesService],
  exports: [CustomerStoriesService],
})
export class CustomerStoriesModule {}
