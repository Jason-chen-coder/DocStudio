import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: '用户邮箱地址',
    example: 'user@docStudio.com',
  })
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  @IsNotEmpty({ message: '邮箱不能为空' })
  email: string;

  @ApiProperty({
    description: '用户名称',
    example: 'John Doe',
  })
  @IsString({ message: '名称必须是字符串' })
  @IsNotEmpty({ message: '名称不能为空' })
  @MaxLength(50, { message: '名称不能超过 50 个字符' })
  name: string;

  @ApiProperty({
    description: '密码（至少8位，需包含大写字母、小写字母和数字）',
    example: 'MyPass123',
    minLength: 8,
  })
  @IsString({ message: '密码必须是字符串' })
  @MinLength(8, { message: '密码长度至少为 8 个字符' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: '密码需包含至少一个大写字母、一个小写字母和一个数字',
  })
  @IsNotEmpty({ message: '密码不能为空' })
  password: string;
}
