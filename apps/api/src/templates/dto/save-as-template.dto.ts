import { IsString, IsOptional, IsEnum } from 'class-validator';
import { TemplateScope, TemplateCategory } from '@prisma/client';

export class SaveAsTemplateDto {
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

  @IsEnum(TemplateScope)
  scope: TemplateScope;
}
