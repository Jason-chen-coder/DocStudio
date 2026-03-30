import { IsOptional, IsString, IsNumberString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SearchQueryDto {
  @ApiProperty({ description: '搜索关键词' })
  @IsString()
  @MinLength(1)
  @MaxLength(200, { message: '搜索关键词不能超过 200 个字符' })
  q: string;

  @ApiPropertyOptional({ description: '页码，默认 1' })
  @IsOptional()
  @IsNumberString()
  page?: string;

  @ApiPropertyOptional({ description: '每页数量，默认 20，最大 100' })
  @IsOptional()
  @IsNumberString()
  limit?: string;
}
