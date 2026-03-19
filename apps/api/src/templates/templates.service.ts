import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { QueryTemplateDto } from './dto/query-template.dto';
import { SaveAsTemplateDto } from './dto/save-as-template.dto';
import { SYSTEM_TEMPLATES } from './templates.seed';
import { TemplateScope } from '@prisma/client';

@Injectable()
export class TemplatesService implements OnModuleInit {
  private readonly logger = new Logger(TemplatesService.name);

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedSystemTemplates();
  }

  /**
   * List templates: merge SYSTEM + SPACE (if spaceId given) + USER templates.
   * Excludes `content` field to save bandwidth.
   */
  async findAll(userId: string, query: QueryTemplateDto) {
    const conditions: any[] = [];

    // Always include SYSTEM templates
    if (!query.scope || query.scope === 'SYSTEM') {
      const systemWhere: any = {
        scope: 'SYSTEM',
        isActive: true,
      };
      if (query.category) {
        systemWhere.category = query.category;
      }
      conditions.push(systemWhere);
    }

    // Include SPACE templates if spaceId is given
    if (query.spaceId && (!query.scope || query.scope === 'SPACE')) {
      const spaceWhere: any = {
        scope: 'SPACE',
        spaceId: query.spaceId,
        isActive: true,
      };
      if (query.category) {
        spaceWhere.category = query.category;
      }
      conditions.push(spaceWhere);
    }

    // Include USER templates for the current user
    if (!query.scope || query.scope === 'USER') {
      const userWhere: any = {
        scope: 'USER',
        createdBy: userId,
        isActive: true,
      };
      if (query.category) {
        userWhere.category = query.category;
      }
      conditions.push(userWhere);
    }

    if (conditions.length === 0) {
      return [];
    }

    return this.prisma.documentTemplate.findMany({
      where: { OR: conditions },
      select: {
        id: true,
        name: true,
        description: true,
        icon: true,
        category: true,
        scope: true,
        spaceId: true,
        createdBy: true,
        sortOrder: true,
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
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * Get a single template with full content.
   */
  async findOne(id: string) {
    const template = await this.prisma.documentTemplate.findUnique({
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

    if (!template || !template.isActive) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }

    return template;
  }

  /**
   * Create a new template. For SPACE scope, verifies the user is OWNER or ADMIN.
   */
  async create(userId: string, dto: CreateTemplateDto) {
    if (dto.scope === 'SPACE') {
      if (!dto.spaceId) {
        throw new ForbiddenException(
          'spaceId is required for SPACE scope templates',
        );
      }
      await this.verifySpaceAdmin(userId, dto.spaceId);
    }

    return this.prisma.documentTemplate.create({
      data: {
        name: dto.name,
        description: dto.description,
        content: dto.content,
        icon: dto.icon || '📄',
        category: dto.category || 'OTHER',
        scope: dto.scope,
        spaceId: dto.scope === 'SPACE' ? dto.spaceId : null,
        createdBy: userId,
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

  /**
   * Update a template. Only the creator or a super admin can update.
   */
  async update(id: string, userId: string, dto: UpdateTemplateDto) {
    const template = await this.prisma.documentTemplate.findUnique({
      where: { id },
    });

    if (!template || !template.isActive) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }

    await this.verifyOwnerOrSuperAdmin(userId, template.createdBy);

    return this.prisma.documentTemplate.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.content !== undefined && { content: dto.content }),
        ...(dto.icon !== undefined && { icon: dto.icon }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
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

  /**
   * Soft delete a template (set isActive=false). Only the creator or a super admin can delete.
   */
  async remove(id: string, userId: string) {
    const template = await this.prisma.documentTemplate.findUnique({
      where: { id },
    });

    if (!template || !template.isActive) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }

    await this.verifyOwnerOrSuperAdmin(userId, template.createdBy);

    return this.prisma.documentTemplate.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Create a template from an existing document's content.
   */
  async createFromDocument(
    userId: string,
    documentId: string,
    dto: SaveAsTemplateDto,
  ) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${documentId} not found`);
    }

    if (dto.scope === 'SPACE') {
      await this.verifySpaceAdmin(userId, document.spaceId);
    }

    return this.prisma.documentTemplate.create({
      data: {
        name: dto.name || document.title,
        description: dto.description,
        content: dto.content || document.content,
        icon: dto.icon || '📄',
        category: dto.category || 'OTHER',
        scope: dto.scope,
        spaceId: dto.scope === 'SPACE' ? document.spaceId : null,
        createdBy: userId,
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

  /**
   * Seed system templates on module init.
   * Only creates templates that don't already exist (upsert by name + scope=SYSTEM).
   */
  async seedSystemTemplates() {
    // Find a system user to attribute the templates to
    const systemUser = await this.prisma.user.findFirst({
      where: { isSuperAdmin: true },
      select: { id: true },
    });

    if (!systemUser) {
      // No users exist yet; skip seeding, will run on next restart
      this.logger.warn(
        'No super admin user found, skipping system template seeding',
      );
      return;
    }

    for (const seed of SYSTEM_TEMPLATES) {
      const existing = await this.prisma.documentTemplate.findFirst({
        where: {
          name: seed.name,
          scope: 'SYSTEM',
        },
      });

      if (!existing) {
        await this.prisma.documentTemplate.create({
          data: {
            name: seed.name,
            description: seed.description,
            content: seed.content,
            icon: seed.icon,
            category: seed.category,
            scope: 'SYSTEM',
            createdBy: systemUser.id,
            sortOrder: seed.sortOrder,
          },
        });
        this.logger.log(`Seeded system template: ${seed.name}`);
      }
    }
  }

  /**
   * Verify the user is OWNER or ADMIN of the given space.
   */
  private async verifySpaceAdmin(userId: string, spaceId: string) {
    const permission = await this.prisma.spacePermission.findUnique({
      where: {
        userId_spaceId: { userId, spaceId },
      },
    });

    if (!permission || !['OWNER', 'ADMIN'].includes(permission.role)) {
      // Also check if user is the space owner directly
      const space = await this.prisma.space.findUnique({
        where: { id: spaceId },
        select: { ownerId: true },
      });

      if (!space || space.ownerId !== userId) {
        throw new ForbiddenException(
          'You must be an OWNER or ADMIN of this space to manage space templates',
        );
      }
    }
  }

  /**
   * Verify the user is the creator of the template or a super admin.
   */
  private async verifyOwnerOrSuperAdmin(
    userId: string,
    creatorId: string,
  ) {
    if (userId === creatorId) {
      return;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isSuperAdmin: true },
    });

    if (!user?.isSuperAdmin) {
      throw new ForbiddenException(
        'Only the template creator or a super admin can modify this template',
      );
    }
  }
}
