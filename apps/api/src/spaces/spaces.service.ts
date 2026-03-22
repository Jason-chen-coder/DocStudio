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
import { ActivityService } from '../activity/activity.service';
import { ActivityAction, EntityType, NotificationType } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

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
  constructor(
    private prisma: PrismaService,
    private activityService: ActivityService,
    private notificationsService: NotificationsService,
  ) {}

  async create(userId: string, createSpaceDto: CreateSpaceDto): Promise<Space> {
    // Transaction to create space and assign owner permission
    const space = await this.prisma.$transaction(async (tx) => {
      const s = await tx.space.create({
        data: {
          ...createSpaceDto,
          owner: { connect: { id: userId } },
        },
      });

      // Add owner permission
      await tx.spacePermission.create({
        data: {
          userId,
          spaceId: s.id,
          role: Role.OWNER,
        },
      });

      return s;
    });

    // 记录活动日志
    this.activityService.log({
      userId,
      action: ActivityAction.CREATE,
      entityType: EntityType.SPACE,
      entityId: space.id,
      entityName: space.name,
      spaceId: space.id,
      spaceName: space.name,
    });

    return space;
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
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
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

    const result = await this.prisma.spacePermission.update({
      where: { userId_spaceId: { userId: targetUserId, spaceId } },
      data: { role },
    });

    // 记录角色变更活动
    this.activityService.log({
      userId: currentUserId,
      action: ActivityAction.ROLE_CHANGE,
      entityType: EntityType.MEMBER,
      entityId: targetUserId,
      spaceId,
      spaceName: space.name,
      metadata: { targetUserId, newRole: role },
    });

    // 通知被变更角色的用户
    const currentUser = await this.prisma.user.findUnique({
      where: { id: currentUserId },
      select: { name: true },
    });
    this.notificationsService.notify({
      recipientId: targetUserId,
      type: NotificationType.ROLE_CHANGED,
      title: `你在「${space.name}」中的角色已变更为 ${role}`,
      entityType: EntityType.MEMBER,
      entityId: spaceId,
      spaceId,
      actorId: currentUserId,
      actorName: currentUser?.name,
      metadata: { spaceName: space.name, newRole: role },
    });

    return result;
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

    const result = await this.prisma.spacePermission.delete({
      where: { userId_spaceId: { userId: targetUserId, spaceId } },
    });

    // 记录移除成员活动
    this.activityService.log({
      userId: currentUserId,
      action: ActivityAction.LEAVE,
      entityType: EntityType.MEMBER,
      entityId: targetUserId,
      spaceId,
      spaceName: space.name,
      metadata: { removedUserId: targetUserId },
    });

    // 通知被移除的用户
    const currentUser = await this.prisma.user.findUnique({
      where: { id: currentUserId },
      select: { name: true },
    });
    this.notificationsService.notify({
      recipientId: targetUserId,
      type: NotificationType.MEMBER_REMOVED,
      title: `你已被移出空间「${space.name}」`,
      entityType: EntityType.SPACE,
      entityId: spaceId,
      spaceId,
      actorId: currentUserId,
      actorName: currentUser?.name,
      metadata: { spaceName: space.name },
    });

    return result;
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

    const invitation = await this.prisma.spaceInvitation.create({
      data: {
        spaceId,
        email,
        role,
        inviterId: currentUserId,
        token,
        expiresAt,
      },
    });

    // 记录邀请活动
    const space = await this.prisma.space.findUnique({
      where: { id: spaceId },
      select: { name: true },
    });
    this.activityService.log({
      userId: currentUserId,
      action: ActivityAction.INVITE,
      entityType: EntityType.MEMBER,
      entityId: invitation.id,
      spaceId,
      spaceName: space?.name,
      metadata: { email, role },
    });

    // 通知被邀请的用户（如果该邮箱对应已注册用户）
    if (email) {
      const invitedUser = await this.prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });
      if (invitedUser) {
        const currentUser = await this.prisma.user.findUnique({
          where: { id: currentUserId },
          select: { name: true },
        });
        this.notificationsService.notify({
          recipientId: invitedUser.id,
          type: NotificationType.SPACE_INVITATION,
          title: `${currentUser?.name || '某人'} 邀请你加入空间「${space?.name}」`,
          entityType: EntityType.SPACE,
          entityId: spaceId,
          spaceId,
          actorId: currentUserId,
          actorName: currentUser?.name,
          metadata: { spaceName: space?.name, role, token },
        });
      }
    }

    return invitation;
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

    // 记录加入活动
    this.activityService.log({
      userId,
      action: ActivityAction.JOIN,
      entityType: EntityType.SPACE,
      entityId: invitation.spaceId,
      entityName: invitation.space.name,
      spaceId: invitation.spaceId,
      spaceName: invitation.space.name,
    });

    // 通知邀请发起者：邀请已被接受
    const joiningUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });
    this.notificationsService.notify({
      recipientId: invitation.inviterId,
      type: NotificationType.INVITATION_ACCEPTED,
      title: `${joiningUser?.name || '某人'} 接受了你的邀请，已加入「${invitation.space.name}」`,
      entityType: EntityType.SPACE,
      entityId: invitation.spaceId,
      spaceId: invitation.spaceId,
      actorId: userId,
      actorName: joiningUser?.name,
      metadata: { spaceName: invitation.space.name },
    });

    // 通知空间其他成员：有新成员加入
    this.notificationsService.notifySpaceMembers({
      spaceId: invitation.spaceId,
      excludeUserId: userId,
      type: NotificationType.MEMBER_JOINED,
      title: `${joiningUser?.name || '新成员'} 加入了空间「${invitation.space.name}」`,
      entityType: EntityType.SPACE,
      entityId: invitation.spaceId,
      actorId: userId,
      actorName: joiningUser?.name,
      metadata: { spaceName: invitation.space.name },
    });

    return { message: 'Joined successfully', spaceId: invitation.spaceId };
  }
}
