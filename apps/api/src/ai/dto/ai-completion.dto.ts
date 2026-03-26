import { IsString, IsOptional, IsIn, IsNotEmpty } from 'class-validator';

export class AiCompletionDto {
  @IsString()
  @IsIn(['continue', 'polish', 'translate', 'summary', 'custom', 'autocomplete', 'longer', 'shorter'])
  command: 'continue' | 'polish' | 'translate' | 'summary' | 'custom' | 'autocomplete' | 'longer' | 'shorter';

  @IsString()
  @IsNotEmpty()
  text: string;

  @IsString()
  @IsOptional()
  context?: string;

  @IsString()
  @IsOptional()
  customPrompt?: string;

  @IsString()
  @IsOptional()
  language?: string;

  @IsOptional()
  deepThink?: boolean;
}
