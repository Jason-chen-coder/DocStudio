import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  PLAN_COMMANDS,
  PLAN_FEATURES,
  getPlanDailyLimit,
  PLAN_LABELS,
} from './ai-subscription-plan.config';
import { ApplySubscriptionDto, RejectRequestDto } from './dto/ai-subscription.dto';

@Injectable()
export class AiSubscriptionService implements OnModuleInit {
  private readonly logger = new Logger(AiSubscriptionService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  // ── Lifecycle: daily expiry check ──

  onModuleInit() {
    // Run expiry check every 6 hours
    setInterval(() => this.checkExpiry(), 6 * 60 * 60 * 1000);
    // Also run once on startup (delayed 30s to let DB settle)
    setTimeout(() => this.checkExpiry(), 30_000);
  }

  // ── User endpoints ──

  async getMySubscription(userId: string) {
    const sub = await this.prisma.aiSubscription.findUnique({
      where: { userId },
    });

    if (!sub || sub.status !== 'ACTIVE' || sub.endDate < new Date()) {
      return null;
    }

    return {
      ...sub,
      features: PLAN_FEATURES[sub.plan] || PLAN_FEATURES.BASIC,
      allowedCommands: PLAN_COMMANDS[sub.plan] || PLAN_COMMANDS.BASIC,
      dailyLimit: getPlanDailyLimit(sub.plan, sub.billingPeriod),
      planLabel: PLAN_LABELS[sub.plan] || sub.plan,
    };
  }

  async getMyRequests(userId: string) {
    return this.prisma.aiSubscriptionRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async apply(userId: string, dto: ApplySubscriptionDto) {
    // Check no pending request
    const pending = await this.prisma.aiSubscriptionRequest.findFirst({
      where: { userId, status: 'PENDING' },
    });
    if (pending) {
      throw new BadRequestException('您已有待审批的申请，请等待管理员处理');
    }

    const request = await this.prisma.aiSubscriptionRequest.create({
      data: {
        userId,
        plan: dto.plan,
        billingPeriod: dto.billingPeriod,
        reason: dto.reason,
      },
      include: { user: { select: { name: true } } },
    });

    // Notify all super admins
    const admins = await this.prisma.user.findMany({
      where: { isSuperAdmin: true },
      select: { id: true },
    });

    for (const admin of admins) {
      this.notifications.notify({
        recipientId: admin.id,
        type: 'SYSTEM',
        title: 'AI 订阅申请',
        content: `${request.user.name} 申请了 ${PLAN_LABELS[dto.plan]} (${dto.billingPeriod === 'MONTHLY' ? '月付' : '年付'})`,
        entityType: 'MEMBER',
        entityId: request.id,
        actorId: userId,
        actorName: request.user.name,
      });
    }

    return request;
  }

  async cancel(userId: string) {
    const sub = await this.prisma.aiSubscription.findUnique({
      where: { userId },
    });
    if (!sub || sub.status !== 'ACTIVE') {
      throw new BadRequestException('没有可取消的活跃订阅');
    }

    return this.prisma.aiSubscription.update({
      where: { userId },
      data: { status: 'CANCELLED' },
    });
  }

  // ── Admin endpoints ──

  async getPendingRequests(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.aiSubscriptionRequest.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
      }),
      this.prisma.aiSubscriptionRequest.count({ where: { status: 'PENDING' } }),
    ]);
    return { data, total, page, limit };
  }

  async getAllSubscriptions(
    query: { status?: string; plan?: string; page?: number; limit?: number },
  ) {
    const { status, plan, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status;
    if (plan) where.plan = plan;

    const [data, total] = await Promise.all([
      this.prisma.aiSubscription.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
      }),
      this.prisma.aiSubscription.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async approve(requestId: string, adminId: string) {
    const request = await this.prisma.aiSubscriptionRequest.findUnique({
      where: { id: requestId },
      include: { user: { select: { id: true, name: true } } },
    });
    if (!request) throw new NotFoundException('申请不存在');
    if (request.status !== 'PENDING') {
      throw new BadRequestException('该申请已处理');
    }

    // Update request
    await this.prisma.aiSubscriptionRequest.update({
      where: { id: requestId },
      data: { status: 'APPROVED', reviewedBy: adminId, reviewedAt: new Date() },
    });

    // Calculate end date
    const startDate = new Date();
    const endDate = new Date(startDate);
    if (request.billingPeriod === 'MONTHLY') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // Upsert subscription
    await this.prisma.aiSubscription.upsert({
      where: { userId: request.userId },
      create: {
        userId: request.userId,
        plan: request.plan,
        billingPeriod: request.billingPeriod,
        status: 'ACTIVE',
        startDate,
        endDate,
      },
      update: {
        plan: request.plan,
        billingPeriod: request.billingPeriod,
        status: 'ACTIVE',
        startDate,
        endDate,
      },
    });

    // Notify user
    this.notifications.notify({
      recipientId: request.userId,
      type: 'SUBSCRIPTION_APPROVED',
      title: 'AI 订阅已通过',
      content: `您的 ${PLAN_LABELS[request.plan]} 申请已通过，有效期至 ${endDate.toLocaleDateString('zh-CN')}`,
      actorId: adminId,
    });

    return { success: true };
  }

  async reject(requestId: string, adminId: string, dto: RejectRequestDto) {
    const request = await this.prisma.aiSubscriptionRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new NotFoundException('申请不存在');
    if (request.status !== 'PENDING') {
      throw new BadRequestException('该申请已处理');
    }

    await this.prisma.aiSubscriptionRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        rejectReason: dto.reason,
        reviewedBy: adminId,
        reviewedAt: new Date(),
      },
    });

    // Notify user
    this.notifications.notify({
      recipientId: request.userId,
      type: 'SUBSCRIPTION_REJECTED',
      title: 'AI 订阅申请被拒绝',
      content: dto.reason
        ? `您的 ${PLAN_LABELS[request.plan]} 申请被拒绝：${dto.reason}`
        : `您的 ${PLAN_LABELS[request.plan]} 申请被拒绝`,
      actorId: adminId,
    });

    return { success: true };
  }

  async revokeSubscription(subscriptionId: string) {
    const sub = await this.prisma.aiSubscription.findUnique({
      where: { id: subscriptionId },
    });
    if (!sub) throw new NotFoundException('订阅不存在');

    await this.prisma.aiSubscription.update({
      where: { id: subscriptionId },
      data: { status: 'CANCELLED' },
    });

    this.notifications.notify({
      recipientId: sub.userId,
      type: 'SUBSCRIPTION_EXPIRED',
      title: 'AI 订阅已被取消',
      content: `您的 ${PLAN_LABELS[sub.plan]} 已被管理员取消`,
    });

    return { success: true };
  }

  // ── Expiry check (runs periodically) ──

  async checkExpiry() {
    const now = new Date();

    // 1. Expire active subscriptions past end date
    const expired = await this.prisma.aiSubscription.findMany({
      where: { status: 'ACTIVE', endDate: { lt: now } },
    });

    for (const sub of expired) {
      await this.prisma.aiSubscription.update({
        where: { id: sub.id },
        data: { status: 'EXPIRED' },
      });

      this.notifications.notify({
        recipientId: sub.userId,
        type: 'SUBSCRIPTION_EXPIRED',
        title: 'AI 订阅已到期',
        content: `您的 ${PLAN_LABELS[sub.plan]} 已到期，请续订以继续使用 AI 功能`,
      });
    }

    if (expired.length > 0) {
      this.logger.log(`Expired ${expired.length} subscriptions`);
    }

    // 2. Warn subscriptions expiring within 7 days
    const sevenDaysLater = new Date(now);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    const expiring = await this.prisma.aiSubscription.findMany({
      where: {
        status: 'ACTIVE',
        endDate: { gt: now, lte: sevenDaysLater },
      },
    });

    for (const sub of expiring) {
      // Deduplicate: check if we already sent a warning recently
      const recentWarning = await this.prisma.notification.findFirst({
        where: {
          recipientId: sub.userId,
          type: 'SUBSCRIPTION_EXPIRING',
          createdAt: { gte: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) }, // last 3 days
        },
      });

      if (!recentWarning) {
        const daysLeft = Math.ceil((sub.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        this.notifications.notify({
          recipientId: sub.userId,
          type: 'SUBSCRIPTION_EXPIRING',
          title: 'AI 订阅即将到期',
          content: `您的 ${PLAN_LABELS[sub.plan]} 将在 ${daysLeft} 天后到期，请及时续订`,
        });
      }
    }
  }
}
