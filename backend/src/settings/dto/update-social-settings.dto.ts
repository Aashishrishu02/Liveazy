import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateSocialSettingsDto {
  @ApiPropertyOptional({
    example: 'https://facebook.com/liveazy',
    description: 'Facebook page URL (empty string to hide)',
  })
  @IsOptional()
  @IsString()
  facebookUrl?: string;

  @ApiPropertyOptional({
    example: 'https://instagram.com/liveazy',
    description: 'Instagram profile URL (empty string to hide)',
  })
  @IsOptional()
  @IsString()
  instagramUrl?: string;

    @ApiPropertyOptional({
    example: 'https://youtube.com/@liveazy',
    description: 'YouTube channel URL (empty string to hide)',
  })
  @IsOptional()
  @IsString()
  youtubeUrl?: string;

  @ApiPropertyOptional({
    example: '919423838109',
    description: 'WhatsApp number with country code',
  })
  @IsOptional()
  @IsString()
  whatsappNumber?: string;
}
