import { Module } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { SpacesModule } from '../spaces/spaces.module';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [SpacesModule, DocumentsModule],
  providers: [OnboardingService],
  exports: [OnboardingService],
})
export class OnboardingModule {}
