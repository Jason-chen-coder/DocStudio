import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { MoveDocumentDto } from './dto/move-document.dto';
import { SnapshotsService } from '../snapshots/snapshots.service';
import { ActivityService } from '../activity/activity.service';
import { ActivityAction, EntityType } from '@prisma/client';

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private snapshotsService: SnapshotsService,
    private activityService: ActivityService,
  ) {}

  async create(
    spaceId: string,
    userId: string,
    createDocumentDto: CreateDocumentDto,
  ) {
    const parentId = createDocumentDto.parentId;

    // Determine order
    let order = 0;
    const lastDoc = await this.prisma.document.findFirst({
      where: {
        spaceId,
        parentId: createDocumentDto.parentId || null,
      },
      orderBy: {
        order: 'desc',
      },
    });

    if (lastDoc) {
      order = lastDoc.order + 1;
    }

    // Generate a unique Yjs document key for collaboration (Stage 4)
    const ydocKey = `doc-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const doc = await this.prisma.document.create({
      data: {
        title: createDocumentDto.title,
        content: createDocumentDto.content || '',
        spaceId,
        parentId,
        order,
        createdBy: userId,
        ydocKey,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        space: {
          select: { name: true },
        },
      },
    });

    // 记录活动日志
    this.activityService.log({
      userId,
      action: ActivityAction.CREATE,
      entityType: EntityType.DOCUMENT,
      entityId: doc.id,
      entityName: doc.title,
      spaceId,
      spaceName: doc.space.name,
    });

    return doc;
  }


  async findAll(spaceId: string) {
    const docs = await this.prisma.document.findMany({
      where: { spaceId, deletedAt: null },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        title: true,
        parentId: true,
        order: true,
        createdAt: true,
        updatedAt: true,
        creator: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });
    return docs;
  }

  /** Lightweight existence check — no side effects, no relations loaded */
  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.document.count({ where: { id, deletedAt: null } });
    return count > 0;
  }

  async findOne(id: string, userId?: string) {
    const doc = await this.prisma.document.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!doc) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    // 记录访问（fire-and-forget）
    if (userId) {
      this.activityService.recordDocumentVisit(userId, doc.id, doc.spaceId);
    }

    return doc;
  }

  async update(
    id: string,
    userId: string,
    updateDocumentDto: UpdateDocumentDto,
  ) {
    if (updateDocumentDto.content !== undefined) {
      // Content is being updated. Run autoSnapshot logic.
      await this.snapshotsService.autoSnapshot(id, userId);
    }

    const doc = await this.prisma.document.update({
      where: { id },
      data: updateDocumentDto,
      include: {
        space: { select: { name: true } },
      },
    });

    // 记录活动日志（仅标题或内容变更时记录，避免噪声）
    const changedFields = Object.keys(updateDocumentDto).filter(
      (k) => k !== 'commentsData',
    );
    if (changedFields.length > 0) {
      this.activityService.log({
        userId,
        action: ActivityAction.UPDATE,
        entityType: EntityType.DOCUMENT,
        entityId: doc.id,
        entityName: doc.title,
        spaceId: doc.spaceId,
        spaceName: doc.space.name,
        metadata: { changedFields },
      });
    }

    return doc;
  }

  /** 软删除：将文档移至回收站 */
  async remove(id: string, userId?: string) {
    const doc = await this.prisma.document.findUnique({
      where: { id },
      include: { space: { select: { name: true } } },
    });

    if (!doc) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    // 软删除：设置 deletedAt，同时将子文档一并软删除
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.document.update({
        where: { id },
        data: { deletedAt: now },
      }),
      // 子文档也一并移入回收站
      this.prisma.document.updateMany({
        where: { parentId: id, deletedAt: null },
        data: { deletedAt: now },
      }),
    ]);

    // 记录删除活动
    if (userId) {
      this.activityService.log({
        userId,
        action: ActivityAction.DELETE,
        entityType: EntityType.DOCUMENT,
        entityId: id,
        entityName: doc.title,
        spaceId: doc.spaceId,
        spaceName: doc.space.name,
      });
    }

    return { success: true };
  }

  /** 获取空间回收站列表 */
  async findTrash(spaceId: string) {
    return this.prisma.document.findMany({
      where: {
        spaceId,
        deletedAt: { not: null },
      },
      orderBy: { deletedAt: 'desc' },
      select: {
        id: true,
        title: true,
        parentId: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
        creator: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  /** 恢复文档（从回收站） */
  async restore(id: string, userId?: string) {
    const doc = await this.prisma.document.findUnique({
      where: { id },
      include: { space: { select: { name: true } } },
    });

    if (!doc) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }
    if (!doc.deletedAt) {
      throw new BadRequestException('Document is not in trash');
    }

    // 恢复文档及其子文档
    await this.prisma.$transaction([
      this.prisma.document.update({
        where: { id },
        data: { deletedAt: null },
      }),
      this.prisma.document.updateMany({
        where: { parentId: id, deletedAt: doc.deletedAt },
        data: { deletedAt: null },
      }),
    ]);

    // 记录恢复活动
    if (userId) {
      this.activityService.log({
        userId,
        action: ActivityAction.RESTORE,
        entityType: EntityType.DOCUMENT,
        entityId: id,
        entityName: doc.title,
        spaceId: doc.spaceId,
        spaceName: doc.space.name,
      });
    }

    return { success: true };
  }

  /** 永久删除（从回收站彻底删除） */
  async permanentlyDelete(id: string) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }
    if (!doc.deletedAt) {
      throw new BadRequestException(
        'Document must be in trash before permanent deletion',
      );
    }

    return this.prisma.document.delete({ where: { id } });
  }

  // ─── 收藏功能 ───────────────────────────────────────────

  /** 收藏文档 */
  async favorite(documentId: string, userId: string) {
    // upsert 避免重复
    return this.prisma.documentFavorite.upsert({
      where: { userId_documentId: { userId, documentId } },
      create: { userId, documentId },
      update: {},
    });
  }

  /** 取消收藏 */
  async unfavorite(documentId: string, userId: string) {
    return this.prisma.documentFavorite
      .delete({
        where: { userId_documentId: { userId, documentId } },
      })
      .catch(() => {
        // 不存在也不报错
        return null;
      });
  }

  /** 获取收藏列表 */
  async getFavorites(userId: string) {
    const favorites = await this.prisma.documentFavorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        document: {
          select: {
            id: true,
            title: true,
            spaceId: true,
            updatedAt: true,
            deletedAt: true,
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
    });

    // 过滤掉已删除的文档
    return favorites
      .filter((f) => f.document.deletedAt === null)
      .map((f) => ({
        id: f.id,
        documentId: f.documentId,
        createdAt: f.createdAt,
        document: f.document,
      }));
  }

  /** 检查是否已收藏 */
  async isFavorited(documentId: string, userId: string): Promise<boolean> {
    const count = await this.prisma.documentFavorite.count({
      where: { userId, documentId },
    });
    return count > 0;
  }

  /**
   * 移动文档：更改父节点 + 排序位置
   * 包含循环引用检测，防止将节点移动到自身的子树下
   */
  async move(id: string, moveDocumentDto: MoveDocumentDto) {
    const { parentId, order } = moveDocumentDto;

    // 1. 确认文档存在
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    // 2. 循环引用检测：确保 parentId 不是 doc 自身或其子孙节点
    if (parentId) {
      await this.ensureNoCircularRef(id, parentId);
    }

    // 3. 更新
    const result = await this.prisma.document.update({
      where: { id },
      data: {
        parentId: parentId ?? null,
        order,
      },
      select: {
        id: true,
        title: true,
        parentId: true,
        order: true,
        spaceId: true,
        updatedAt: true,
      },
    });

    return result;
  }

  /**
   * 递归检查是否会产生循环引用
   * 从 targetParentId 向上遍历祖先链，若途中出现 movingId 则抛出异常
   */
  private async ensureNoCircularRef(movingId: string, targetParentId: string) {
    if (movingId === targetParentId) {
      throw new BadRequestException('Cannot move a document into itself');
    }

    const parent = await this.prisma.document.findUnique({
      where: { id: targetParentId },
      select: { parentId: true },
    });

    if (parent?.parentId) {
      await this.ensureNoCircularRef(movingId, parent.parentId);
    }
  }
}
