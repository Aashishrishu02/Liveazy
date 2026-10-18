import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

import { ContactEnquiriesController } from './contact-enquiries.controller';
import { ContactEnquiriesService } from './contact-enquiries.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ContactEnquiriesController],
  providers: [ContactEnquiriesService],
  exports: [ContactEnquiriesService],
})
export class ContactEnquiriesModule {}