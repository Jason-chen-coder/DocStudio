import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PublicService {
  constructor(private prisma: PrismaService) {}

  async findAllSpaces(page: number = 1, limit: number = 20, search?: string) {
    const skip = (page - 1) * limit;

    const whereClause: any = { isPublic: true };
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [spaces, total] = await Promise.all([
      this.prisma.space.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          owner: {
            select: { id: true, name: true, avatarUrl: true },
          },
          _count: {
            select: { documents: true },
          },
        },
      }),
      this.prisma.space.count({ where: whereClause }),
    ]);

    return {
      data: spaces,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findSpace(id: string) {
    const space = await this.prisma.space.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, avatarUrl: true },
        },
        _count: {
          select: { documents: true },
        },
      },
    });

    if (!space) {
      throw new NotFoundException(`Space with ID ${id} not found`);
    }

    if (!space.isPublic) {
      throw new ForbiddenException('This space is not public');
    }

    return space;
  }

  async getSpaceDocumentTree(spaceId: string) {
    // First verify the space is public
    await this.findSpace(spaceId);

    return this.prisma.document.findMany({
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
  }

  async getDocument(docId: string) {
    const doc = await this.prisma.document.findUnique({
      where: { id: docId },
      include: {
        space: {
          select: { isPublic: true },
        },
        creator: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    if (!doc) {
      throw new NotFoundException(`Document with ID ${docId} not found`);
    }

    if (!doc.space.isPublic) {
      throw new ForbiddenException('This document belongs to a private space');
    }

    return doc;
  }
}
