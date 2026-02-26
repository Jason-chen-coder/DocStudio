import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  Role,
  Space,
  SpacePermission,
  SpaceInvitation,
  InvitationStatus,
} from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSpaceDto } from './dto/create-space.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';

export interface SpaceMember {
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  role: Role;
  joinedAt: Date;
}

@Injectable()
export class SpacesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createSpaceDto: CreateSpaceDto): Promise<Space> {
    // Transaction to create space and assign owner permission
    return this.prisma.$transaction(async (tx) => {
      const space = await tx.space.create({
        data: {
          ...createSpaceDto,
          owner: { connect: { id: userId } },
        },
      });

      // Add owner permission
      await tx.spacePermission.create({
        data: {
          userId,
          spaceId: space.id,
          role: Role.OWNER,
        },
      });

      return space;
    });
  }

  async findAll(userId: string): Promise<
    (Space & {
      _count: { documents: number; permissions: number };
      permissions: { role: Role }[];
      myRole: Role | null;
    })[]
  > {
    const spaces = await this.prisma.space.findMany({
      where: {
        OR: [{ ownerId: userId }, { permissions: { some: { userId } } }],
      },
      include: {
        _count: {
          select: { documents: true, permissions: true },
        },
        permissions: {
          where: { userId },
          select: { role: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return spaces.map((space) => ({
      ...space,
      myRole:
        space.ownerId === userId
          ? Role.OWNER
          : space.permissions[0]?.role || null,
    }));
  }

  async findOne(
    id: string,
    userId: string,
  ): Promise<
    Space & {
      owner: { id: string; name: string; email: string };
      _count: { documents: number; permissions: number };
      permissions: { role: Role }[];
      myRole: Role | null;
    }
  > {
    const space = await this.prisma.space.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { documents: true, permissions: true },
        },
        permissions: {
          where: { userId },
          select: { role: true },
        },
      },
    });

    if (!space) {
      throw new NotFoundException(`Space with ID ${id} not found`);
    }

    const isMember = space.permissions.length > 0;
    const isOwner = space.ownerId === userId;

    if (!space.isPublic && !isMember && !isOwner) {
      throw new ForbiddenException('You do not have access to this space');
    }

    return {
      ...space,
      myRole: isOwner ? Role.OWNER : space.permissions[0]?.role || null,
    };
  }

  async update(
    id: string,
    userId: string,
    updateSpaceDto: UpdateSpaceDto,
  ): Promise<Space> {
    await this.checkPermission(id, userId, [Role.OWNER, Role.ADMIN]);

    return this.prisma.space.update({
      where: { id },
      data: updateSpaceDto,
    });
  }

  async remove(id: string, userId: string): Promise<Space> {
    const space = await this.prisma.space.findUnique({
      where: { id },
      select: { ownerId: true },
    });

    if (!space) throw new NotFoundException('Space not found');
    if (space.ownerId !== userId) {
      throw new ForbiddenException('Only the owner can delete the space');
    }

    return this.prisma.space.delete({
      where: { id },
    });
  }

  // ==================== Member Management ====================

  private async checkPermission(
    spaceId: string,
    userId: string,
    requiredRole: Role[],
  ): Promise<{ isOwner: boolean; role: Role }> {
    const space = await this.prisma.space.findUnique({
      where: { id: spaceId },
      include: {
        permissions: { where: { userId } },
      },
    });

    if (!space) throw new NotFoundException('Space not found');
    const isOwner = space.ownerId === userId;
    const userRole = space.permissions[0]?.role;

    if (isOwner) return { isOwner: true, role: Role.OWNER };

    if (!userRole || !requiredRole.includes(userRole)) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return { isOwner: false, role: userRole };
  }

  async getMembers(spaceId: string, userId: string): Promise<SpaceMember[]> {
    // Check if user is member
    await this.checkPermission(spaceId, userId, [
      Role.OWNER,
      Role.ADMIN,
      Role.EDITOR,
      Role.VIEWER,
    ]);

    const members = await this.prisma.spacePermission.findMany({
      where: { spaceId },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Explicitly add owner if not in permissions (though created at start)
    // Actually our create logic adds owner to permissions.

    return members.map((m) => ({
      userId: m.userId,
      name: m.user.name,
      email: m.user.email,
      avatarUrl: m.user.avatarUrl,
      role: m.role,
      joinedAt: m.createdAt,
    }));
  }

  async updateMemberRole(
    spaceId: string,
    targetUserId: string,
    role: Role,
    currentUserId: string,
  ): Promise<SpacePermission> {
    const { isOwner, role: currentUserRole } = await this.checkPermission(
      spaceId,
      currentUserId,
      [Role.OWNER, Role.ADMIN],
    );

    // Owner can do anything. Admin can only manage Editor/Viewer.
    if (!isOwner && currentUserRole === Role.ADMIN) {
      if (role === Role.OWNER || role === Role.ADMIN) {
        throw new ForbiddenException('Admins cannot promote to Owner or Admin');
      }
      // Cannot change role of another Admin or Owner
      const targetMember = await this.prisma.spacePermission.findUnique({
        where: { userId_spaceId: { userId: targetUserId, spaceId } },
      });
      if (
        targetMember?.role === Role.OWNER ||
        targetMember?.role === Role.ADMIN
      ) {
        throw new ForbiddenException(
          'Admins cannot modify other Admins or Owner',
        );
      }
    }

    const space = await this.prisma.space.findUnique({
      where: { id: spaceId },
    });
    if (!space) throw new NotFoundException('Space not found');

    if (space.ownerId === targetUserId) {
      throw new ForbiddenException('Cannot change role of the Space Owner');
    }

    return this.prisma.spacePermission.update({
      where: { userId_spaceId: { userId: targetUserId, spaceId } },
      data: { role },
    });
  }
  async removeMember(
    spaceId: string,
    targetUserId: string,
    currentUserId: string,
  ): Promise<SpacePermission> {
    const { isOwner, role: currentUserRole } = await this.checkPermission(
      spaceId,
      currentUserId,
      [Role.OWNER, Role.ADMIN],
    );

    const space = await this.prisma.space.findUnique({
      where: { id: spaceId },
    });
    if (!space) throw new NotFoundException('Space not found');

    if (space.ownerId === targetUserId) {
      throw new ForbiddenException('Cannot remove the Space Owner');
    }

    if (!isOwner && currentUserRole === Role.ADMIN) {
      const targetMember = await this.prisma.spacePermission.findUnique({
        where: { userId_spaceId: { userId: targetUserId, spaceId } },
      });
      if (
        targetMember?.role === Role.OWNER ||
        targetMember?.role === Role.ADMIN
      ) {
        throw new ForbiddenException(
          'Admins cannot remove other Admins or Owner',
        );
      }
    }

    return this.prisma.spacePermission.delete({
      where: { userId_spaceId: { userId: targetUserId, spaceId } },
    });
  }

  async createInvitation(
    spaceId: string,
    role: Role,
    currentUserId: string,
    email?: string,
  ): Promise<SpaceInvitation> {
    await this.checkPermission(spaceId, currentUserId, [
      Role.OWNER,
      Role.ADMIN,
    ]);

    const token = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    // Validating current pending invites for same email?
    // Upsert logic to update token if exists
    if (email) {
      const existing = await this.prisma.spaceInvitation.findFirst({
        where: { spaceId, email },
      });
      if (existing) {
        return this.prisma.spaceInvitation.update({
          where: { id: existing.id },
          data: {
            token,
            role,
            expiresAt,
            status: InvitationStatus.PENDING,
            inviterId: currentUserId,
          },
        });
      }
    }

    return this.prisma.spaceInvitation.create({
      data: {
        spaceId,
        email,
        role,
        inviterId: currentUserId,
        token,
        expiresAt,
      },
    });
  }

  async joinSpace(
    token: string,
    userId: string,
  ): Promise<{ message: string; spaceId: string }> {
    const invitation = await this.prisma.spaceInvitation.findUnique({
      where: { token },
      include: { space: true },
    });

    if (!invitation || invitation.status !== InvitationStatus.PENDING) {
      throw new NotFoundException('Invitation not found or expired');
    }

    if (invitation.expiresAt < new Date()) {
      await this.prisma.spaceInvitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.EXPIRED },
      });
      throw new ForbiddenException('Invitation expired');
    }

    if (invitation.email) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user || user.email !== invitation.email) {
        throw new ForbiddenException(
          'This invitation is for a different email address',
        );
      }
    }

    // Check if already a member
    const existingMember = await this.prisma.spacePermission.findUnique({
      where: { userId_spaceId: { userId, spaceId: invitation.spaceId } },
    });

    if (existingMember) {
      return { message: 'Already a member', spaceId: invitation.spaceId };
    }

    // Add member
    await this.prisma.$transaction([
      this.prisma.spacePermission.create({
        data: {
          userId,
          spaceId: invitation.spaceId,
          role: invitation.role,
        },
      }),
      this.prisma.spaceInvitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.ACCEPTED },
      }),
    ]);

    return { message: 'Joined successfully', spaceId: invitation.spaceId };
  }
}
