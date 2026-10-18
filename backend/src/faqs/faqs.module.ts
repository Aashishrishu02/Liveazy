import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

import { FaqsController } from './faqs.controller';
import { FaqsService } from './faqs.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [FaqsController],
  providers: [FaqsService],
  exports: [FaqsService],
})
export class FaqsModule {}