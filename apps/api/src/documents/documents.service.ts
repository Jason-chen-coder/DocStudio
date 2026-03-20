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
      where: { spaceId },
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
    const count = await this.prisma.document.count({ where: { id } });
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

  async remove(id: string, userId?: string) {
    const doc = await this.prisma.document.findUnique({
      where: { id },
      include: { space: { select: { name: true } } },
    });

    const result = await this.prisma.document.delete({
      where: { id },
    });

    // 记录删除活动
    if (userId && doc) {
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

    return result;
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
