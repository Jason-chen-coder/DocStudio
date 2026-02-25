import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  async create(spaceId: string, userId: string, createDocumentDto: CreateDocumentDto) {
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

    return this.prisma.document.create({
      data: {
        title: createDocumentDto.title,
        content: createDocumentDto.content || '',
        spaceId,
        parentId,
        order,
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

    // Validates that we can fetch documents. Tree construction might happen here or on client.
    // Returning flat list is often easier for client to reconstruct if needed, 
    // or we can build tree here. For now, flat list is versatile.
    // However, the plan says "List documents (tree structure)".
    // Let's return the flat list and let some utility build the tree, or build it here.
    // For simplicity in MVP API, let's return flat list. The frontend is usually better at building the interactive tree.
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

  async update(id: string, updateDocumentDto: UpdateDocumentDto) {
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
}
