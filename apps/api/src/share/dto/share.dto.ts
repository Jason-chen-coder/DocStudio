import { IsEnum, IsString, IsOptional, IsDateString, MaxLength, MinLength } from 'class-validator';
import { ShareType } from '@prisma/client';

export class CreateShareDto {
  @IsString()
  documentId: string;

  @IsEnum(ShareType)
  @IsOptional()
  type?: ShareType;

  @IsString()
  @IsOptional()
  @MinLength(4, { message: '分享密码至少 4 个字符' })
  @MaxLength(32, { message: '分享密码不能超过 32 个字符' })
  password?: string;

  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}

export class VerifyShareDto {
  @IsString()
  password: string;
}
