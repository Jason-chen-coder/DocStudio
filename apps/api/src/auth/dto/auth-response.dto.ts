import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ description: '用户ID', example: 'cuid_xxx' })
  id: string;

  @ApiProperty({ description: '用户邮箱', example: 'user@docStudio.com' })
  email: string;

  @ApiProperty({ description: '用户名称', example: 'John Doe' })
  name: string;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;
}

export class AuthResponseDto {
  @ApiProperty({ description: '用户信息', type: UserResponseDto })
  user: UserResponseDto;

  @ApiProperty({
    description: 'JWT 访问令牌',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;
}
