import {
  IsNumber,
  IsOptional,
  IsString,
  IsBoolean,
  IsInt,
  Min,
} from 'class-validator';

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

  // Manual product display order
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  // 12-month rental plan
  @IsOptional()
  @IsNumber()
  rent12M?: number;

  @IsOptional()
  @IsNumber()
  deposit12M?: number;

  // 6-month rental plan
  @IsOptional()
  @IsNumber()
  rent6M?: number;

  @IsOptional()
  @IsNumber()
  deposit6M?: number;

  // 3-month rental plan
  @IsOptional()
  @IsNumber()
  rent3M?: number;

  @IsOptional()
  @IsNumber()
  deposit3M?: number;
}