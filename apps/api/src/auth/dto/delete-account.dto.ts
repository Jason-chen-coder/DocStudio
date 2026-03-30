import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeleteAccountDto {
  @ApiProperty({ description: '当前密码（OAuth 用户可不填）', required: false })
  @IsString()
  @IsOptional()
  password?: string;
}
