import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { NotificationType, EntityType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateNotificationParams {
  recipientId: string;
  type: NotificationType;
  title: string;
  content?: string;
  entityType?: EntityType;
  entityId?: string;
  spaceId?: string;
  actorId?: string;
  actorName?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);

  // SSE 客户端连接池：userId → 回调函数数组
  private sseClients = new Map<string, Array<(data: any) => void>>();
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor(private prisma: PrismaService) {}

  onModuleInit() {
    // 每 24 小时自动清理旧通知
    const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000;
    this.cleanupTimer = setInterval(() => {
      this.cleanupOldNotifications().catch((err) =>
        this.logger.error('Scheduled notification cleanup failed', err),
      );
    }, CLEANUP_INTERVAL);
    this.logger.log('Notification cleanup scheduler initialized (every 24h)');
  }

  /**
   * 创建通知并实时推送（fire-and-forget 风格，不阻塞业务）
   */
  async notify(params: CreateNotificationParams): Promise<void> {
    try {
      // 排除自己触发给自己的通知
      if (params.actorId && params.actorId === params.recipientId) {
        return;
      }

      // 检查用户偏好设置
      const preference = await this.prisma.notificationPreference.findUnique({
        where: { userId: params.recipientId },
      });

      if (preference) {
        const prefs = JSON.parse(preference.preferences) as Record<string, boolean>;
        if (prefs[params.type] === false) {
          return; // 用户屏蔽了此类通知
        }
      }

      // 写入数据库
      const notification = await this.prisma.notification.create({
        data: {
          recipientId: params.recipientId,
          type: params.type,
          title: params.title,
          content: params.content,
          entityType: params.entityType,
          entityId: params.entityId,
          spaceId: params.spaceId,
          actorId: params.actorId,
          actorName: params.actorName,
          metadata: params.metadata
            ? JSON.stringify(params.metadata)
            : undefined,
        },
      });

      // 通过 SSE 实时推送
      this.pushToUser(params.recipientId, notification);
    } catch (err) {
      this.logger.error('Failed to create notification', err);
    }
  }

  /**
   * 批量通知空间所有成员
   */
  async notifySpaceMembers(params: {
    spaceId: string;
    excludeUserId?: string;
    type: NotificationType;
    title: string;
    content?: string;
    entityType?: EntityType;
    entityId?: string;
    actorId?: string;
    actorName?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      // 查找空间所有成员（权限表 + owner）
      const space = await this.prisma.space.findUnique({
        where: { id: params.spaceId },
        select: {
          ownerId: true,
          permissions: { select: { userId: true } },
        },
      });

      if (!space) return;

      const memberIds = new Set<string>();
      memberIds.add(space.ownerId);
      space.permissions.forEach((p) => memberIds.add(p.userId));

      // 排除触发者自己
      if (params.excludeUserId) {
        memberIds.delete(params.excludeUserId);
      }

      // 逐一发送通知
      for (const recipientId of memberIds) {
        this.notify({
          recipientId,
          type: params.type,
          title: params.title,
          content: params.content,
          entityType: params.entityType,
          entityId: params.entityId,
          spaceId: params.spaceId,
          actorId: params.actorId,
          actorName: params.actorName,
          metadata: params.metadata,
        }).catch((err) =>
          this.logger.error(`Failed to notify user ${recipientId}`, err),
        );
      }
    } catch (err) {
      this.logger.error('Failed to notify space members', err);
    }
  }

  /**
   * 获取通知列表（分页）
   */
  async getNotifications(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      unreadOnly?: boolean;
      type?: NotificationType;
    } = {},
  ) {
    const { page = 1, limit = 20, unreadOnly = false, type } = options;
    const skip = (page - 1) * limit;

    const where: any = { recipientId: userId };
    if (unreadOnly) where.isRead = false;
    if (type) where.type = type;

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      data: data.map((n) => ({
        ...n,
        metadata: n.metadata ? JSON.parse(n.metadata) : null,
      })),
      total,
      page,
      limit,
    };
  }

  /**
   * 获取未读通知数量
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { recipientId: userId, isRead: false },
    });
  }

  /**
   * 标记单条通知已读
   */
  async markAsRead(userId: string, notificationId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, recipientId: userId },
      data: { isRead: true },
    });
  }

  /**
   * 标记全部已读
   */
  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { recipientId: userId, isRead: false },
      data: { isRead: true },
    });
  }

  /**
   * 删除单条通知
   */
  async deleteNotification(userId: string, notificationId: string) {
    return this.prisma.notification.deleteMany({
      where: { id: notificationId, recipientId: userId },
    });
  }

  /**
   * 清除所有已读通知
   */
  async clearRead(userId: string) {
    return this.prisma.notification.deleteMany({
      where: { recipientId: userId, isRead: true },
    });
  }

  /**
   * 获取通知偏好设置
   */
  async getPreferences(userId: string) {
    const pref = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });

    if (!pref) {
      // 返回默认全开
      const defaults: Record<string, boolean> = {};
      for (const type of Object.values(NotificationType)) {
        defaults[type] = true;
      }
      return defaults;
    }

    return JSON.parse(pref.preferences);
  }

  /**
   * 更新通知偏好设置
   */
  async updatePreferences(
    userId: string,
    preferences: Record<string, boolean>,
  ) {
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      update: { preferences: JSON.stringify(preferences) },
      create: { userId, preferences: JSON.stringify(preferences) },
    });
  }

  // ─── SSE 连接管理 ──────────────────────────────────────────

  /**
   * 注册 SSE 客户端回调
   */
  addSseClient(userId: string, callback: (data: any) => void): void {
    const clients = this.sseClients.get(userId) || [];
    clients.push(callback);
    this.sseClients.set(userId, clients);
    this.logger.log(
      `SSE client registered for user ${userId} (total: ${clients.length})`,
    );
  }

  /**
   * 移除 SSE 客户端回调
   */
  removeSseClient(userId: string, callback: (data: any) => void): void {
    const clients = this.sseClients.get(userId) || [];
    const idx = clients.indexOf(callback);
    if (idx !== -1) clients.splice(idx, 1);
    if (clients.length === 0) {
      this.sseClients.delete(userId);
    } else {
      this.sseClients.set(userId, clients);
    }
    this.logger.log(
      `SSE client removed for user ${userId} (remaining: ${clients.length})`,
    );
  }

  // ─── 清理任务 ──────────────────────────────────────────

  /**
   * 清理超过指定天数的旧通知（可由定时任务调用）
   * - 已读通知：超过 daysToKeep 天清理
   * - 未读通知：超过 daysToKeepUnread 天清理（更宽松）
   */
  async cleanupOldNotifications(
    daysToKeep = 90,
    daysToKeepUnread = 180,
  ): Promise<{ readDeleted: number; unreadDeleted: number }> {
    const readCutoff = new Date();
    readCutoff.setDate(readCutoff.getDate() - daysToKeep);

    const unreadCutoff = new Date();
    unreadCutoff.setDate(unreadCutoff.getDate() - daysToKeepUnread);

    const [readResult, unreadResult] = await Promise.all([
      this.prisma.notification.deleteMany({
        where: { isRead: true, createdAt: { lt: readCutoff } },
      }),
      this.prisma.notification.deleteMany({
        where: { isRead: false, createdAt: { lt: unreadCutoff } },
      }),
    ]);

    this.logger.log(
      `Notification cleanup: ${readResult.count} read (>${daysToKeep}d), ${unreadResult.count} unread (>${daysToKeepUnread}d)`,
    );

    return {
      readDeleted: readResult.count,
      unreadDeleted: unreadResult.count,
    };
  }

  // ─── SSE 推送 ──────────────────────────────────────────

  /**
   * 推送通知给指定用户的所有 SSE 连接
   */
  private pushToUser(userId: string, notification: any): void {
    const clients = this.sseClients.get(userId);
    if (!clients || clients.length === 0) return;

    const payload = {
      ...notification,
      metadata: notification.metadata
        ? JSON.parse(notification.metadata)
        : null,
    };

    clients.forEach((callback) => {
      try {
        callback(payload);
      } catch (err) {
        this.logger.error('Failed to push SSE notification', err);
      }
    });
  }
}
