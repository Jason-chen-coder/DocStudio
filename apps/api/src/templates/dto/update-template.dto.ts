import { IsString, IsOptional, IsEnum, IsInt } from 'class-validator';
import { TemplateCategory } from '@prisma/client';

export class UpdateTemplateDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsEnum(TemplateCategory)
  @IsOptional()
  category?: TemplateCategory;

  @IsInt()
  @IsOptional()
  sortOrder?: number;
}
