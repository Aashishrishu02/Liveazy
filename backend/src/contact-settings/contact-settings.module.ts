import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

import { ContactSettingsController } from './contact-settings.controller';
import { ContactSettingsService } from './contact-settings.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ContactSettingsController],
  providers: [ContactSettingsService],
  exports: [ContactSettingsService],
})
export class ContactSettingsModule {}