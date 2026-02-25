import { PartialType } from '@nestjs/mapped-types';
import { CreateDocumentDto } from './create-document.dto';
import { IsNumber, IsOptional, IsUUID } from 'class-validator';

export class UpdateDocumentDto extends PartialType(CreateDocumentDto) {
  @IsNumber()
  @IsOptional()
  order?: number;

  @IsUUID()
  @IsOptional()
  parentId?: string;
}
