import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserPasswordDto {
  @ApiProperty({ description: '新密码，至少 8 位' })
  @IsString()
  @MinLength(8, { message: '密码至少需要 8 位' })
  newPassword: string;
}
