import { IsArray, IsBoolean, IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateComboDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsNumber()
  originalPrice: number;

  @IsNumber()
  specialPrice: number;

  @IsNumber()
  @IsOptional()
  discountPercent?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @IsDateString()
  @IsOptional()
  validUntil?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  productIds?: string[];
}
