import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { TemplateScope, TemplateCategory } from '@prisma/client';

export class CreateTemplateDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200, { message: '模板名称不能超过 200 个字符' })
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(500, { message: '模板描述不能超过 500 个字符' })
  description?: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsEnum(TemplateCategory)
  @IsOptional()
  category?: TemplateCategory;

  @IsEnum(TemplateScope)
  scope: TemplateScope;

  @IsString()
  @IsOptional()
  spaceId?: string;
}
