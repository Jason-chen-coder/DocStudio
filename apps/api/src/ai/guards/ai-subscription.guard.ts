import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PLAN_COMMANDS, PLAN_FEATURES } from '../ai-subscription-plan.config';

@Injectable()
export class AiSubscriptionGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const body = request.body;

    // Determine the command: for /ai/completion use body.command, for /ai/chat use 'chat'
    const path: string = request.url || '';
    const command = path.includes('/chat') ? 'chat' : (body?.command || 'unknown');

    // 1. SuperAdmin bypasses subscription check
    if (user?.isSuperAdmin) return true;

    // 2. Look up active subscription
    const subscription = await this.prisma.aiSubscription.findFirst({
      where: {
        userId: user.id,
        status: 'ACTIVE',
        endDate: { gt: new Date() },
      },
    });

    if (!subscription) {
      throw new ForbiddenException('您尚未订阅 AI 功能，请先申请订阅');
    }

    // 3. Check if command is allowed for the plan
    const allowedCommands = PLAN_COMMANDS[subscription.plan] || [];
    if (!allowedCommands.includes(command)) {
      throw new ForbiddenException(
        `您的订阅不支持此功能，请升级订阅`,
      );
    }

    // 4. Attach subscription to request for downstream use
    request.aiSubscription = subscription;

    return true;
  }
}
