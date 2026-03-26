import { IsString, IsOptional, IsInt, Min, IsIn } from 'class-validator';

export class UpdateAiConfigDto {
  @IsString()
  @IsOptional()
  provider?: string;

  @IsString()
  @IsOptional()
  apiKey?: string;

  @IsString()
  @IsOptional()
  baseUrl?: string;

  @IsString()
  @IsOptional()
  model?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  dailyLimit?: number;
}

export class ResetAiConfigFieldDto {
  @IsString()
  @IsIn(['provider', 'apiKey', 'baseUrl', 'model', 'dailyLimit'])
  field: string;
}
