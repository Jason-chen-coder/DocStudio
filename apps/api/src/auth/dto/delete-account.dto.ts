import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeleteAccountDto {
  @ApiProperty({ description: '当前密码（确认身份）' })
  @IsString()
  @IsNotEmpty({ message: '密码不能为空' })
  password: string;
}
