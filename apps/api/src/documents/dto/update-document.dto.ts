import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateDocumentDto } from './create-document.dto';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateDocumentDto extends PartialType(
  OmitType(CreateDocumentDto, ['parentId'] as const),
) {
  @IsNumber()
  @IsOptional()
  order?: number;

  /** 允许传 null，表示移到根节点 */
  @IsString()
  @IsOptional()
  parentId?: string | null;
}
