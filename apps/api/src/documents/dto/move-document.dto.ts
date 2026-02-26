import { IsString, IsOptional, IsNumber } from 'class-validator';

export class MoveDocumentDto {
  @IsString()
  @IsOptional()
  parentId?: string | null;

  @IsNumber()
  order: number;
}
