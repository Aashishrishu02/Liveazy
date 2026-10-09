
import {
  Body,
  Controller,
  Get,
  Patch,
} from '@nestjs/common';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
  ) {}

  @Get('whatsapp')
  getWhatsAppSettings() {
    return this.settingsService.getWhatsAppSettings();
  }

  @Patch('whatsapp')
  updateWhatsAppSettings(
    @Body()
    body: {
      whatsappNumber?: string;
      whatsappMessage?: string;
    },
  ) {
    return this.settingsService.updateWhatsAppSettings(
      body.whatsappNumber,
      body.whatsappMessage,
    );
  }
}
