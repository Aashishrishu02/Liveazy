
import { Body, Controller, Get, Patch, BadRequestException } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateWhatsAppDto } from './dto/update-whatsapp.dto';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('whatsapp')
  getWhatsAppNumber() {
    return this.settingsService.getWhatsAppNumber();
  }

  


@Patch('whatsapp')
updateWhatsAppNumber(@Body() body: any) {
  console.log('BODY RECEIVED:', JSON.stringify(body));

  if (!body?.whatsappNumber) {
    throw new BadRequestException(
      'Request body missing whatsappNumber',
    );
  }

  return this.settingsService.updateWhatsAppNumber(
    body.whatsappNumber,
  );
}


}

