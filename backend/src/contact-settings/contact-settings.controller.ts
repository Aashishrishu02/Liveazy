import {
  Body,
  Controller,
  Get,
  Patch,
  UseGuards,
} from '@nestjs/common';

import { ContactSettingsService } from './contact-settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminEmailGuard } from '../auth/guards/admin-email.guard';

@Controller('contact-settings')
export class ContactSettingsController {
  constructor(
    private readonly contactSettingsService: ContactSettingsService,
  ) {}

  // Public: frontend can display contact information.
  @Get()
  async getSettings() {
    return this.contactSettingsService.getSettings();
  }

  // Protected: only the configured admin can update settings.
  @Patch()
  @UseGuards(JwtAuthGuard, AdminEmailGuard)
  async updateSettings(
    @Body() body: Record<string, unknown>,
  ) {
    return this.contactSettingsService.updateSettings(body);
  }
}