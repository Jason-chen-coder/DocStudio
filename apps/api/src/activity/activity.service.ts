import { Injectable, Logger } from '@nestjs/common';
import { ActivityAction, EntityType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface LogActivityParams {
  userId: string;
  action: ActivityAction;
  entityType: EntityType;
  entityId: string;
  entityName?: string;
  spaceId?: string;
  spaceName?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * 记录活动日志（异步 fire-and-forget，不阻塞业务逻辑）
   */
  log(params: LogActivityParams): void {
    this.prisma.activityLog
      .create({
        data: {
          userId: params.userId,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          entityName: params.entityName,
          spaceId: params.spaceId,
          spaceName: params.spaceName,
          metadata: params.metadata
            ? JSON.stringify(params.metadata)
            : undefined,
        },
      })
      .catch((err) => {
        this.logger.error('Failed to log activity', err);
      });
  }

  /**
   * 记录文档访问（upsert：存在则更新访问时间和计数，不存在则创建）
   */
  recordDocumentVisit(
    userId: string,
    documentId: string,
    spaceId: string,
  ): void {
    this.prisma.documentVisit
      .upsert({
        where: {
          userId_documentId: { userId, documentId },
        },
        update: {
          visitCount: { increment: 1 },
          lastVisitAt: new Date(),
        },
        create: {
          userId,
          documentId,
          spaceId,
          visitCount: 1,
          lastVisitAt: new Date(),
        },
      })
      .catch((err) => {
        this.logger.error('Failed to record document visit', err);
      });
  }

  /**
   * 获取用户最近访问的文档
   */
  async getRecentDocuments(userId: string, limit = 20, skip = 0) {
    const [visits, total] = await Promise.all([
      this.prisma.documentVisit.findMany({
        where: { userId },
        orderBy: { lastVisitAt: 'desc' },
        skip,
        take: limit,
        include: {
        document: {
          select: {
            id: true,
            title: true,
            spaceId: true,
            updatedAt: true,
            space: {
              select: {
                id: true,
                name: true,
              },
            },
            creator: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    }),
      this.prisma.documentVisit.count({ where: { userId } }),
    ]);

    const data = visits.map((v) => ({
      documentId: v.document.id,
      title: v.document.title,
      spaceId: v.document.spaceId,
      spaceName: v.document.space.name,
      updatedAt: v.document.updatedAt,
      lastVisitAt: v.lastVisitAt,
      visitCount: v.visitCount,
      creator: v.document.creator,
    }));

    return { data, total };
  }

  /**
   * 获取用户个人活动流
   */
  async getMyActivity(userId: string, page = 1, limit = 30) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
      }),
      this.prisma.activityLog.count({ where: { userId } }),
    ]);

    return {
      data: data.map((item) => ({
        ...item,
        metadata: item.metadata ? JSON.parse(item.metadata) : null,
      })),
      total,
      page,
      limit,
    };
  }

  /**
   * 获取空间内的活动流（谁改了什么）
   */
  async getSpaceActivity(spaceId: string, page = 1, limit = 30) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where: { spaceId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
      }),
      this.prisma.activityLog.count({ where: { spaceId } }),
    ]);

    return {
      data: data.map((item) => ({
        ...item,
        metadata: item.metadata ? JSON.parse(item.metadata) : null,
      })),
      total,
      page,
      limit,
    };
  }

  /**
   * 清理超过 90 天的旧日志（可由定时任务调用）
   */
  async cleanupOldLogs(daysToKeep = 90): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysToKeep);

    const result = await this.prisma.activityLog.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });

    this.logger.log(`Cleaned up ${result.count} activity logs older than ${daysToKeep} days`);
    return result.count;
  }
}
