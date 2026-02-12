import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSpaceDto {
  @ApiProperty({ description: '空间名称', example: 'My Workspace' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: '空间描述',
    example: 'This is a test workspace',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '是否公开', example: false, required: false })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}
