import { IsString, IsOptional, IsEnum } from 'class-validator';
import { TemplateScope, TemplateCategory } from '@prisma/client';

export class QueryTemplateDto {
  @IsString()
  @IsOptional()
  spaceId?: string;

  @IsEnum(TemplateCategory)
  @IsOptional()
  category?: TemplateCategory;

  @IsEnum(TemplateScope)
  @IsOptional()
  scope?: TemplateScope;
}
