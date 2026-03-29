import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { CreateShareDto } from './dto/share.dto';
import { ShareType } from '@prisma/client';
import { ydocUpdateToTiptapJson } from '../common/ydoc-utils';

@Injectable()
export class ShareService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async create(userId: string, createShareDto: CreateShareDto) {
    const { documentId, type, password, expiresAt } = createShareDto;

    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: {
        space: {
          include: {
            permissions: { where: { userId } },
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (document.space.permissions.length === 0) {
      throw new ForbiddenException('No permission to share this document');
    }

    let hashedPassword = null;
    if (type === ShareType.PASSWORD && password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    return this.prisma.shareLink.create({
      data: {
        documentId,
        type: type || ShareType.PUBLIC,
        password: hashedPassword,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });
  }

  async getShareInfo(token: string) {
    const share = await this.prisma.shareLink.findUnique({
      where: { token },
      include: {
        document: {
          select: {
            title: true,
            id: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!share || !share.isActive) {
      throw new NotFoundException('Share link not found or inactive');
    }

    if (share.expiresAt && new Date() > share.expiresAt) {
      throw new ForbiddenException('Share link expired');
    }

    // Return public info only
    return {
      token: share.token,
      type: share.type,
      documentTitle: share.document.title,
      expiresAt: share.expiresAt,
      hasPassword: !!share.password,
    };
  }

  async verifyPassword(token: string, password: string) {
    const share = await this.prisma.shareLink.findUnique({
      where: { token },
    });

    if (!share || !share.isActive) {
      throw new NotFoundException('Link not found');
    }

    if (share.expiresAt && new Date() > share.expiresAt) {
      throw new ForbiddenException('Link expired');
    }

    if (share.type !== ShareType.PASSWORD) {
      // If public, no need to verify, but this endpoint is for password verification.
      // Just return token.
      return this.generateToken(share.id);
    }

    const isValid = await bcrypt.compare(password, share.password || '');
    if (!isValid) {
      throw new UnauthorizedException('Invalid password');
    }

    return this.generateToken(share.id);
  }

  async getContent(token: string, accessToken?: string) {
    const share = await this.prisma.shareLink.findUnique({
      where: { token },
      include: {
        document: {
          include: {
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

    if (!share || !share.isActive) {
      throw new NotFoundException('Link not found');
    }

    if (share.expiresAt && new Date() > share.expiresAt) {
      throw new ForbiddenException('Link expired');
    }

    // Provide view count increment (fire and forget)
    this.prisma.shareLink
      .update({
        where: { id: share.id },
        data: { viewCount: { increment: 1 } },
      })
      .catch(() => undefined);

    if (share.type === ShareType.PASSWORD) {
      if (!accessToken) {
        throw new UnauthorizedException('Password required');
      }
      try {
        const payload = this.jwtService.verify(accessToken);
        if (payload.sub !== share.id) {
          throw new UnauthorizedException('Invalid access token');
        }
      } catch (e) {
        throw new UnauthorizedException('Invalid or expired token');
      }
    }

    // Prefer structured Tiptap JSON from ydocData (preserves drawings, callouts, etc.)
    // Fall back to plain-text content field if ydocData is unavailable
    let content: string | object = share.document.content;
    if (share.document.ydocData) {
      const tiptapJson = ydocUpdateToTiptapJson(
        new Uint8Array(share.document.ydocData),
      );
      if (tiptapJson) {
        content = tiptapJson;
      }
    }

    return {
      title: share.document.title,
      content,
      createdAt: share.document.createdAt,
      updatedAt: share.document.updatedAt,
      creator: share.document.creator,
    };
  }

  /**
   * 获取某文档的所有分享链接
   */
  async getSharesByDocument(documentId: string, userId: string) {
    // 验证文档存在且用户有权限（需要对文档所在 space 有访问权限）
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: {
        space: {
          include: {
            permissions: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // 检查用户是否为空间成员
    if (document.space.permissions.length === 0) {
      throw new ForbiddenException('No permission to view shares for this document');
    }

    const shares = await this.prisma.shareLink.findMany({
      where: { documentId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        token: true,
        type: true,
        expiresAt: true,
        viewCount: true,
        isActive: true,
        createdAt: true,
      },
    });

    // 标记已过期的链接
    return shares.map((share) => ({
      ...share,
      isExpired: share.expiresAt ? new Date() > share.expiresAt : false,
    }));
  }

  /**
   * 删除/停用分享链接
   */
  async deleteShare(shareId: string, userId: string) {
    const share = await this.prisma.shareLink.findUnique({
      where: { id: shareId },
      include: {
        document: {
          include: {
            space: {
              include: {
                permissions: {
                  where: { userId },
                },
              },
            },
          },
        },
      },
    });

    if (!share) {
      throw new NotFoundException('Share link not found');
    }

    // 检查用户是否为空间成员（EDITOR 及以上可删除分享）
    const permission = share.document.space.permissions[0];
    if (!permission) {
      throw new ForbiddenException('No permission to delete this share link');
    }

    await this.prisma.shareLink.delete({
      where: { id: shareId },
    });

    return { message: 'Share link deleted successfully' };
  }

  private generateToken(shareId: string) {
    return {
      accessToken: this.jwtService.sign({ sub: shareId }, { expiresIn: '1h' }), // Short lived token
    };
  }
}
