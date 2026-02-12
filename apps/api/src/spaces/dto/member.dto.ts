import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Role } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMemberRoleDto {
  @ApiProperty({ description: '成员角色', enum: Role, example: Role.EDITOR })
  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;
}

export class InviteMemberDto {
  @ApiProperty({
    description: '被邀请人邮箱',
    example: 'invitee@example.com',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ description: '赋予的角色', enum: Role, example: Role.VIEWER })
  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;
}

export class JoinSpaceDto {
  @ApiProperty({ description: '邀请 Token', example: 'abc-123-def' })
  @IsString()
  @IsNotEmpty()
  token: string;
}
