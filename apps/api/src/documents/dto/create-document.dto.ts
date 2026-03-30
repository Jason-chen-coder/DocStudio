import { IsString, IsOptional, IsNotEmpty, IsUUID, MaxLength } from 'class-validator';

export class CreateDocumentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500, { message: '标题不能超过 500 个字符' })
  title: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsUUID()
  @IsOptional()
  parentId?: string;
}
