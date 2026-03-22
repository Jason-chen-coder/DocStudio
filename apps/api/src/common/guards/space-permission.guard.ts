import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Reflector } from '@nestjs/core';

@Injectable()
export class SpacePermissionGuard implements CanActivate {
  constructor(
    private prisma: PrismaService,
    private reflector: Reflector,
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
    // Support both :id (document routes) and :docId (snapshot routes)
    const documentId = params?.id || params?.docId;

    // If accessing a document, find its spaceId
    let documentRecord: {
      spaceId: string;
      isRestricted: boolean;
    } | null = null;

    if (documentId) {
      const doc = await this.prisma.document.findUnique({
        where: { id: documentId },
        select: { spaceId: true, isRestricted: true },
      });
      if (!doc) throw new NotFoundException('Document not found');
      spaceId = doc.spaceId;
      documentRecord = doc;
    }

    if (!spaceId) {
      return true;
    }

    const space = await this.prisma.space.findUnique({
      where: { id: spaceId },
      include: {
        permissions: {
          where: { userId: user.id },
        },
      },
    });

    if (!space) throw new NotFoundException('Space not found');

    const userPermission = space.permissions[0];
    const role = userPermission?.role;

    // Check if space is public
    if (space.isPublic && method === 'GET') {
      return true;
    }

    if (!userPermission) {
      throw new ForbiddenException(
        'You do not have permission to access this space',
      );
    }

    // ─── 文档级权限叠加 ────────────────────────────────────────
    // 如果文档启用了 isRestricted，则在空间权限基础上叠加文档级权限
    if (documentRecord?.isRestricted && documentId) {
      const isOwnerOrAdmin = role === 'OWNER' || role === 'ADMIN';

      if (!isOwnerOrAdmin) {
        // 查询文档级权限
        const docPerm = await this.prisma.documentPermission.findUnique({
          where: {
            documentId_userId: { documentId, userId: user.id },
          },
        });

        if (!docPerm) {
          throw new ForbiddenException(
            'You do not have permission to access this restricted document',
          );
        }

        // 将文档级权限挂到 request 上，供 Controller/Service 使用
        request.documentPermission = docPerm.permission;

        // 文档级 VIEWER 不能执行写操作
        if (
          docPerm.permission === 'VIEWER' &&
          ['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)
        ) {
          // 允许特定的只读 PATCH 操作（如标记收藏等）
          const path = request.url || '';
          const isReadOnlyPatch =
            path.includes('/favorite') || path.includes('/comment-notify');
          if (!isReadOnlyPatch) {
            throw new ForbiddenException(
              'You have read-only access to this document',
            );
          }
        }
      } else {
        // OWNER/ADMIN 始终有 EDITOR 权限
        request.documentPermission = 'EDITOR';
      }
    } else {
      // 未启用文档级权限时，走原有空间权限逻辑
      // Write operations require EDITOR or higher
      if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
        if (role !== 'OWNER' && role !== 'ADMIN' && role !== 'EDITOR') {
          throw new ForbiddenException(
            'You do not have permission to write in this space',
          );
        }
      }
    }

    return true;
  }
}
