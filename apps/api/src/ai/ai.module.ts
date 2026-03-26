import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiSubscriptionController } from './ai-subscription.controller';
import { AiService } from './ai.service';
import { AiConfigService } from './ai-config.service';
import { AiSubscriptionService } from './ai-subscription.service';
import { AiSubscriptionGuard } from './guards/ai-subscription.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [AiController, AiSubscriptionController],
  providers: [AiService, AiConfigService, AiSubscriptionService, AiSubscriptionGuard],
  exports: [AiService, AiConfigService, AiSubscriptionService],
})
export class AiModule {}
