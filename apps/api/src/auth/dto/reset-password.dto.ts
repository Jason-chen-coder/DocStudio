import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ description: '重置令牌' })
  @IsString()
  @IsNotEmpty({ message: '令牌不能为空' })
  token: string;

  @ApiProperty({ description: '新密码（至少8位，需包含大写字母、小写字母和数字）', minLength: 8 })
  @IsString({ message: '密码必须是字符串' })
  @MinLength(8, { message: '密码长度至少为 8 个字符' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: '密码需包含至少一个大写字母、一个小写字母和一个数字',
  })
  @IsNotEmpty({ message: '密码不能为空' })
  newPassword: string;
}
