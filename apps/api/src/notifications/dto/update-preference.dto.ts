import { IsObject } from 'class-validator';

export class UpdatePreferenceDto {
  @IsObject()
  preferences: Record<string, boolean>;
}
