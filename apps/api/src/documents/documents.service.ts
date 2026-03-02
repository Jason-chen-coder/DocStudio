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

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private snapshotsService: SnapshotsService,
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

    return this.prisma.document.create({
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
      },
    });
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
        updatedAt: true,
      },
    });
    return docs;
  }

  async findOne(id: string) {
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

    return this.prisma.document.update({
      where: { id },
      data: updateDocumentDto,
    });
  }

  async remove(id: string) {
    return this.prisma.document.delete({
      where: { id },
    });
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
    return this.prisma.document.update({
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
        updatedAt: true,
      },
    });
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
