import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSpaceDto {
  @ApiProperty({ description: '空间名称', example: 'My Workspace' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100, { message: '空间名称不能超过 100 个字符' })
  name: string;

  @ApiProperty({
    description: '空间描述',
    example: 'This is a test workspace',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500, { message: '空间描述不能超过 500 个字符' })
  description?: string;

  @ApiProperty({ description: '是否公开', example: false, required: false })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}
