import { IsEnum, IsString, IsOptional, IsDateString } from 'class-validator';
import { ShareType } from '@prisma/client';

export class CreateShareDto {
  @IsString()
  documentId: string;

  @IsEnum(ShareType)
  @IsOptional()
  type?: ShareType;

  @IsString()
  @IsOptional()
  password?: string;

  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}

export class VerifyShareDto {
  @IsString()
  password: string;
}
