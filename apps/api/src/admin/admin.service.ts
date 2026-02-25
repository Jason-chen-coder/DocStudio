import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { AdminUserQueryDto } from './dto/admin-user-query.dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ─── 用户列表 ────────────────────────────────────────────────────────────────
  async getUsers(query: AdminUserQueryDto) {
    const page = Math.max(1, parseInt(query.page ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '20', 10)));
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    // 搜索：name 或 email 模糊匹配
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // 按空间筛选
    if (query.spaceId) {
      where.spacePermissions = {
        some: { spaceId: query.spaceId },
      };
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              spacePermissions: true,
              createdDocuments: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const data = users.map((u) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, _count, ...rest } = u;
      return {
        ...rest,
        spaceCount: _count.spacePermissions,
        documentCount: _count.createdDocuments,
      };
    });

    return { data, total, page, limit };
  }

  // ─── 用户详情 ────────────────────────────────────────────────────────────────
  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        spacePermissions: {
          include: {
            space: { select: { id: true, name: true } },
          },
        },
        _count: { select: { createdDocuments: true } },
      },
    });

    if (!user) throw new NotFoundException('用户不存在');

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, spacePermissions, _count, ...rest } = user;

    return {
      ...rest,
      spaces: spacePermissions.map((p) => ({
        id: p.space.id,
        name: p.space.name,
        role: p.role,
      })),
      documentCount: _count.createdDocuments,
    };
  }

  // ─── 修改密码 ────────────────────────────────────────────────────────────────
  async updatePassword(userId: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('用户不存在');

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: '密码修改成功' };
  }

  // ─── 禁用 / 启用 ─────────────────────────────────────────────────────────────
  async updateStatus(
    currentUserId: string,
    targetUserId: string,
    isDisabled: boolean,
  ) {
    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!target) throw new NotFoundException('用户不存在');

    // 保护规则：Migration 后 isSuperAdmin 字段存在
    const targetAny = target as any;
    if (targetAny.isSuperAdmin) {
      throw new ForbiddenException('不能禁用/启用超级管理员账号');
    }
    if (currentUserId === targetUserId) {
      throw new ForbiddenException('不能禁用自己的账号');
    }

    await this.prisma.user.update({
      where: { id: targetUserId },
      data: { isDisabled } as any,
    });

    return { message: isDisabled ? '用户已禁用' : '用户已启用', isDisabled };
  }

  // ─── 删除用户 ────────────────────────────────────────────────────────────────
  async deleteUser(currentUserId: string, targetUserId: string) {
    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!target) throw new NotFoundException('用户不存在');

    const targetAny = target as any;
    if (targetAny.isSuperAdmin) {
      throw new ForbiddenException('不能删除超级管理员账号');
    }
    if (currentUserId === targetUserId) {
      throw new ForbiddenException('不能删除自己的账号');
    }

    await this.prisma.user.delete({ where: { id: targetUserId } });
    return { message: '用户已删除' };
  }

  // ─── 空间列表（筛选下拉专用）────────────────────────────────────────────────
  async getSpaces(search?: string) {
    const where: Prisma.SpaceWhereInput = {};
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const spaces = await this.prisma.space.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { permissions: true } },
      },
      take: 200,
    });

    return spaces.map((s) => ({
      id: s.id,
      name: s.name,
      memberCount: s._count.permissions,
    }));
  }
}
