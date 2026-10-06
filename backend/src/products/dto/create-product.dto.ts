import { IsNumber, IsOptional, IsString, IsBoolean } from 'class-validator';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsString()
  image?: string;

  @IsString()
  categoryId: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}