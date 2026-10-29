import {
  Body,
  Controller,
  Get,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSocialSettingsDto } from './dto/update-social-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminEmailGuard } from '../auth/guards/admin-email.guard';

interface UpdateWhatsAppSettingsBody {
  whatsappNumber?: unknown;
  whatsappMessage?: unknown;
}

@Controller('settings')
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
  ) {}

  // Public: social media settings for footer and frontend consumers
  @Get('social')
  getSocialSettings() {
    return this.settingsService.getSocialSettings();
  }

  // Public: general settings alias
  @Get()
  getAllSettings() {
    return this.settingsService.getSocialSettings();
  }

  // Public: existing WhatsApp settings read endpoint
  @Get('whatsapp')
  getWhatsAppSettings() {
    return this.settingsService.getWhatsAppSettings();
  }

  // Protected: admin-only update endpoint for social media settings
  @Patch('social')
  @UseGuards(JwtAuthGuard, AdminEmailGuard)
  updateSocialSettings(
    @Body() body: UpdateSocialSettingsDto,
  ) {
    return this.settingsService.updateSocialSettings(body);
  }

  // Protected: alias for root settings patch
  @Patch()
  @UseGuards(JwtAuthGuard, AdminEmailGuard)
  updateSettings(
    @Body() body: UpdateSocialSettingsDto,
  ) {
    return this.settingsService.updateSocialSettings(body);
  }

  // Protected: existing WhatsApp settings update endpoint
  @Patch('whatsapp')
  @UseGuards(JwtAuthGuard, AdminEmailGuard)
  updateWhatsAppSettings(
    @Body() body: UpdateWhatsAppSettingsBody,
  ) {
    return this.settingsService.updateWhatsAppSettings(
      body?.whatsappNumber,
      body?.whatsappMessage,
    );
  }
}
