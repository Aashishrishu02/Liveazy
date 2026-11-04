import { IsOptional, IsString } from 'class-validator';

export class CategorySettingsDto {
  @IsString()
  @IsOptional()
  icon?: string | null;

  @IsString()
  @IsOptional()
  image?: string | null;
}

