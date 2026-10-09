
import { ApiProperty } from '@nestjs/swagger';

export class UpdateWhatsAppDto {
  @ApiProperty({
    example: '919876543210',
    description: 'WhatsApp number with country code',
  })
  whatsappNumber!: string;
}
