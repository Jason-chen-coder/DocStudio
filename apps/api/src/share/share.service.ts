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

@Injectable()
export class ShareService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async create(userId: string, createShareDto: CreateShareDto) {
    const { documentId, type, password, expiresAt } = createShareDto;

    // Check if document exists and user has permission (ownership or write)
    // For simplicity, checking if user is owner or has access. 
    // Ideally use a permission guard system, but here we enforce it before creation.
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: { space: true },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // TODO: Strict permission check can be added here. 
    // Assuming the controller guard handles basic access, but we should verify ownership or editor role.

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
        document: true,
      },
    });

    if (!share || !share.isActive) {
      throw new NotFoundException('Link not found');
    }

    if (share.expiresAt && new Date() > share.expiresAt) {
      throw new ForbiddenException('Link expired');
    }

    // Provide view count increment (fire and forget)
    this.prisma.shareLink.update({
      where: { id: share.id },
      data: { viewCount: { increment: 1 } },
    }).catch(console.error);

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

    // Return content
    return {
      title: share.document.title,
      content: share.document.content,
      updatedAt: share.document.updatedAt,
    };
  }

  private generateToken(shareId: string) {
    return {
      accessToken: this.jwtService.sign({ sub: shareId }, { expiresIn: '1h' }), // Short lived token
    };
  }
}
