import { IsOptional, IsString, IsNumberString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AdminUserQueryDto {
  @ApiPropertyOptional({ description: '页码，默认 1' })
  @IsOptional()
  @IsNumberString()
  page?: string;

  @ApiPropertyOptional({ description: '每页数量，默认 20，最大 100' })
  @IsOptional()
  @IsNumberString()
  limit?: string;

  @ApiPropertyOptional({ description: '搜索关键词，匹配 name 或 email' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: '按空间 ID 筛选，返回该空间下的所有成员' })
  @IsOptional()
  @IsString()
  spaceId?: string;
}
