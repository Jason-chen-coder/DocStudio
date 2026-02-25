import { CanActivate, ExecutionContext, Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Reflector } from '@nestjs/core';

@Injectable()
export class SpacePermissionGuard implements CanActivate {
  constructor(
    private prisma: PrismaService,
    private reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) return false;

    const method = request.method;
    const body = request.body;
    const params = request.params;
    const query = request.query;

    let spaceId = body?.spaceId || query?.spaceId;
    let documentId = params?.id;

    // If accessing a document, find its spaceId
    if (documentId) {
       const doc = await this.prisma.document.findUnique({
         where: { id: documentId },
         select: { spaceId: true }
       });
       if (!doc) throw new NotFoundException('Document not found');
       spaceId = doc.spaceId;
    }

    if (!spaceId) {
        // If we can't determine spaceId (e.g. creating document without spaceId), let controller handle validation or throw error
        // But for permission check, we need spaceId.
        // If it's a list request without spaceId, maybe we allow it?
        // But findAll uses spaceId.
        // If no spaceId and no documentId, we can't check space permissions.
        return true; 
    }

    const space = await this.prisma.space.findUnique({
      where: { id: spaceId },
      include: {
        permissions: {
          where: { userId: user.id } // This is array, but unique constraint makes it max 1
        }
      }
    });

    if (!space) throw new NotFoundException('Space not found');

    const userPermission = space.permissions[0];
    const role = userPermission?.role;

    // Check if space is public
    if (space.isPublic && method === 'GET') {
      return true;
    }

    if (!userPermission) {
       throw new ForbiddenException('You do not have permission to access this space');
    }

    // Write operations require EDITOR or higher
    if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      if (role !== 'OWNER' && role !== 'ADMIN' && role !== 'EDITOR') {
        throw new ForbiddenException('You do not have permission to write in this space');
      }
    }

    return true;
  }
}
