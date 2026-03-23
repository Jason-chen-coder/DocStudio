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

  // ==================== Stats / Analytics ====================

  /**
   * 空间级统计数据
   */
  async getSpaceStats(spaceId: string) {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const [
      docCount,
      memberCount,
      totalVisitsAgg,
      weeklyActions,
      actionDistribution,
      topDocuments,
      topMembers,
    ] = await Promise.all([
      // 文档总数
      this.prisma.document.count({
        where: { spaceId, deletedAt: null },
      }),
      // 成员数
      this.prisma.spacePermission.count({
        where: { spaceId },
      }),
      // 总阅读量
      this.prisma.documentVisit.aggregate({
        where: { spaceId },
        _sum: { visitCount: true },
      }),
      // 本周活跃操作数
      this.prisma.activityLog.count({
        where: { spaceId, createdAt: { gte: weekStart } },
      }),
      // 操作类型分布
      this.prisma.activityLog.groupBy({
        by: ['action'],
        where: { spaceId },
        _count: true,
      }),
      // 热门文档 Top 10
      this.prisma.documentVisit.groupBy({
        by: ['documentId'],
        where: { spaceId },
        _sum: { visitCount: true },
        orderBy: { _sum: { visitCount: 'desc' } },
        take: 10,
      }),
      // 活跃成员 Top 10（近 30 天）
      this.prisma.activityLog.groupBy({
        by: ['userId'],
        where: { spaceId, createdAt: { gte: thirtyDaysAgo } },
        _count: true,
        orderBy: { _count: { userId: 'desc' } },
        take: 10,
      }),
    ]);

    // 30 天文档增长趋势
    const docGrowth = await this.prisma.document.groupBy({
      by: ['createdAt'],
      where: {
        spaceId,
        deletedAt: null,
        createdAt: { gte: thirtyDaysAgo },
      },
      _count: true,
      orderBy: { createdAt: 'asc' },
    });

    // 按日聚合文档增长
    const growthByDay: Record<string, number> = {};
    for (const item of docGrowth) {
      const day = new Date(item.createdAt).toISOString().slice(0, 10);
      growthByDay[day] = (growthByDay[day] || 0) + item._count;
    }
    const docGrowthTrend = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      docGrowthTrend.push({ date: key, count: growthByDay[key] || 0 });
    }

    // 填充热门文档标题
    const docIds = topDocuments.map((d) => d.documentId);
    const docs = docIds.length
      ? await this.prisma.document.findMany({
          where: { id: { in: docIds } },
          select: { id: true, title: true },
        })
      : [];
    const docMap = new Map(docs.map((d) => [d.id, d.title]));

    // 填充活跃成员名称
    const userIds = topMembers.map((m) => m.userId);
    const users = userIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, avatarUrl: true },
        })
      : [];
    const userMap = new Map(users.map((u) => [u.id, u]));

    return {
      overview: {
        docCount,
        memberCount,
        totalViews: totalVisitsAgg._sum.visitCount || 0,
        weeklyActions,
      },
      docGrowthTrend,
      topDocuments: topDocuments.map((d) => ({
        documentId: d.documentId,
        title: docMap.get(d.documentId) || '未知文档',
        views: d._sum.visitCount || 0,
      })),
      topMembers: topMembers.map((m) => ({
        userId: m.userId,
        name: userMap.get(m.userId)?.name || '未知用户',
        avatarUrl: userMap.get(m.userId)?.avatarUrl || null,
        actions: m._count,
      })),
      actionDistribution: actionDistribution.map((a) => ({
        action: a.action,
        count: a._count,
      })),
    };
  }

  /**
   * 文档级阅读统计
   */
  async getDocumentStats(documentId: string) {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    const [uvCount, pvAgg, recentVisits] = await Promise.all([
      // UV：独立访客数
      this.prisma.documentVisit.count({
        where: { documentId },
      }),
      // PV：总访问次数
      this.prisma.documentVisit.aggregate({
        where: { documentId },
        _sum: { visitCount: true },
      }),
      // 近 7 天访问记录（按最近访问时间过滤）
      this.prisma.documentVisit.findMany({
        where: {
          documentId,
          lastVisitAt: { gte: sevenDaysAgo },
        },
        select: { lastVisitAt: true, visitCount: true },
      }),
    ]);

    // 按日聚合近 7 天访问
    const visitsByDay: Record<string, number> = {};
    for (const v of recentVisits) {
      const day = new Date(v.lastVisitAt).toISOString().slice(0, 10);
      visitsByDay[day] = (visitsByDay[day] || 0) + 1;
    }
    const dailyTrend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dailyTrend.push({ date: key, count: visitsByDay[key] || 0 });
    }

    return {
      uv: uvCount,
      pv: pvAgg._sum.visitCount || 0,
      dailyTrend,
    };
  }

  /**
   * 个人生产力统计
   */
  async getUserProductivityStats(userId: string) {
    const now = new Date();

    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - now.getDay());
    thisWeekStart.setHours(0, 0, 0, 0);

    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    const [
      thisWeekCreated,
      lastWeekCreated,
      thisWeekEdited,
      lastWeekEdited,
      totalReadsAgg,
    ] = await Promise.all([
      this.prisma.activityLog.count({
        where: {
          userId,
          action: 'CREATE',
          entityType: 'DOCUMENT',
          createdAt: { gte: thisWeekStart },
        },
      }),
      this.prisma.activityLog.count({
        where: {
          userId,
          action: 'CREATE',
          entityType: 'DOCUMENT',
          createdAt: { gte: lastWeekStart, lt: thisWeekStart },
        },
      }),
      this.prisma.activityLog.count({
        where: {
          userId,
          action: 'UPDATE',
          entityType: 'DOCUMENT',
          createdAt: { gte: thisWeekStart },
        },
      }),
      this.prisma.activityLog.count({
        where: {
          userId,
          action: 'UPDATE',
          entityType: 'DOCUMENT',
          createdAt: { gte: lastWeekStart, lt: thisWeekStart },
        },
      }),
      this.prisma.documentVisit.aggregate({
        where: { document: { createdBy: userId } },
        _sum: { visitCount: true },
      }),
    ]);

    return {
      thisWeekCreated,
      lastWeekCreated,
      thisWeekEdited,
      lastWeekEdited,
      totalReads: totalReadsAgg._sum.visitCount || 0,
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
