import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ description: '重置令牌' })
  @IsString()
  @IsNotEmpty({ message: '令牌不能为空' })
  token: string;

  @ApiProperty({ description: '新密码（至少8个字符）', minLength: 8 })
  @IsString({ message: '密码必须是字符串' })
  @MinLength(8, { message: '密码长度至少为 8 个字符' })
  @IsNotEmpty({ message: '密码不能为空' })
  newPassword: string;
}
