import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserStatusDto {
  @ApiProperty({ description: '是否禁用账号' })
  @IsBoolean()
  isDisabled: boolean;
}
