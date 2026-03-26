import { IsString, IsOptional, IsIn } from 'class-validator';

export class ApplySubscriptionDto {
  @IsIn(['BASIC', 'VIP', 'MAX'])
  plan: 'BASIC' | 'VIP' | 'MAX';

  @IsIn(['MONTHLY', 'YEARLY'])
  billingPeriod: 'MONTHLY' | 'YEARLY';

  @IsString()
  @IsOptional()
  reason?: string;
}

export class RejectRequestDto {
  @IsString()
  @IsOptional()
  reason?: string;
}
