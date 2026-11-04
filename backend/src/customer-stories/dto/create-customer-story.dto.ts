import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateCustomerStoryDto {
  @IsString()
  customerName: string;

  @IsString()
  @IsOptional()
  photo?: string;

  @IsString()
  story: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  videoUrl?: string;

  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  rating?: number;

  @IsInt()
  @IsOptional()
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
