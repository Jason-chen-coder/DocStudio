import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { OnboardingService } from '../onboarding/onboarding.service';
import { ActivityService } from '../activity/activity.service';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';

/** 登录失败锁定阈值 */
const MAX_FAILED_ATTEMPTS = 5;
/** 锁定时长（毫秒）— 30 分钟 */
const LOCK_DURATION_MS = 30 * 60 * 1000;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private emailService: EmailService,
    private onboardingService: OnboardingService,
    private activityService: ActivityService,
  ) {}

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };
    const access_token = this.jwtService.sign(payload);
    const refresh_token = randomBytes(40).toString('hex');

    // 存储 hashed refresh token
    const hashedRefresh = await bcrypt.hash(refresh_token, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashedRefresh },
    });

    return { access_token, refresh_token };
  }

  async register(registerDto: RegisterDto) {
    const { email, name, password } = registerDto;

    // 创建用户
    const user = await this.usersService.create(email, name, password);

    // 生成邮箱验证 token
    const emailVerifyToken = randomBytes(32).toString('hex');
    await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerifyToken },
    });

    // 异步发送验证邮件（不阻塞注册响应）
    this.emailService.sendEmailVerification(email, name, emailVerifyToken);

    // 异步创建默认工作空间和欢迎文档（不阻塞注册响应）
    this.onboardingService.setupNewUser(user.id);

    // 生成 token 对
    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: { ...user, emailVerified: false },
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // 查找用户
    const user = await this.usersService.findByEmailWithPassword(email);
    if (!user || !user.password) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    // 检查账号是否被锁定
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMin = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / 60000,
      );
      this.activityService.log({
        userId: user.id,
        action: 'LOGIN_FAILED',
        entityType: 'USER',
        entityId: user.id,
        metadata: { reason: 'account_locked' },
      });
      throw new UnauthorizedException(
        `账号已锁定，请 ${remainingMin} 分钟后重试`,
      );
    }

    // 验证密码
    const isPasswordValid = await this.usersService.validatePassword(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      // 递增失败次数，达到阈值则锁定
      const attempts = (user.failedLoginAttempts ?? 0) + 1;
      const lockData: { failedLoginAttempts: number; lockedUntil?: Date } = {
        failedLoginAttempts: attempts,
      };
      if (attempts >= MAX_FAILED_ATTEMPTS) {
        lockData.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
      }
      await this.prisma.user.update({
        where: { id: user.id },
        data: lockData,
      });

      this.activityService.log({
        userId: user.id,
        action: 'LOGIN_FAILED',
        entityType: 'USER',
        entityId: user.id,
        metadata: { attempts },
      });

      throw new UnauthorizedException('邮箱或密码错误');
    }

    // 登录成功 — 重置失败计数
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
    }

    // 生成 token 对
    const tokens = await this.generateTokens(user.id, user.email);

    this.activityService.log({
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      entityType: 'USER',
      entityId: user.id,
    });

    // 返回用户信息（不包含密码）
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      ...tokens,
    };
  }

  async validateUser(userId: string) {
    return this.usersService.findById(userId);
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const { currentPassword, newPassword } = changePasswordDto;

    // 获取用户信息（包含密码）
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('用户不存在');
    }

    // 验证当前密码
    const isPasswordValid = await this.usersService.validatePassword(
      currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('当前密码错误');
    }

    // 更新密码
    await this.usersService.updatePassword(userId, newPassword);

    this.activityService.log({
      userId,
      action: 'PASSWORD_CHANGED',
      entityType: 'USER',
      entityId: userId,
    });

    return { message: '密码修改成功' };
  }

  // ==================== 邮箱验证 ====================

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findUnique({
      where: { emailVerifyToken: token },
    });

    if (!user) {
      throw new BadRequestException('无效或已过期的验证链接');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifyToken: null,
      },
    });

    // 发送欢迎邮件
    this.emailService.sendWelcome(user.email, user.name);

    return { message: '邮箱验证成功' };
  }

  async resendVerification(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('用户不存在');
    }

    if (user.emailVerified) {
      return { message: '邮箱已验证' };
    }

    const emailVerifyToken = randomBytes(32).toString('hex');
    await this.prisma.user.update({
      where: { id: userId },
      data: { emailVerifyToken },
    });

    await this.emailService.sendEmailVerification(
      user.email,
      user.name,
      emailVerifyToken,
    );

    return { message: '验证邮件已重新发送' };
  }

  // ==================== 密码重置 ====================

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // 即使用户不存在也返回成功，防止枚举攻击
    if (!user) {
      return { message: '如果该邮箱已注册，你将收到密码重置邮件' };
    }

    const resetToken = randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 小时

    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry },
    });

    await this.emailService.sendPasswordReset(
      user.email,
      user.name,
      resetToken,
    );

    return { message: '如果该邮箱已注册，你将收到密码重置邮件' };
  }

  // ==================== OAuth 登录 ====================

  async oauthLogin(profile: {
    googleId?: string;
    githubId?: string;
    email: string;
    name: string;
    avatarUrl?: string;
  }) {
    const { email, name, avatarUrl, googleId, githubId } = profile;

    // 查找已有用户（按 OAuth ID 或邮箱）
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          ...(googleId ? [{ googleId }] : []),
          ...(githubId ? [{ githubId }] : []),
          { email },
        ],
      },
    });

    if (user) {
      // 已有用户 — 更新 OAuth ID（账号关联）
      const updateData: any = {};
      if (googleId && !user.googleId) updateData.googleId = googleId;
      if (githubId && !user.githubId) updateData.githubId = githubId;
      if (avatarUrl && !user.avatarUrl) updateData.avatarUrl = avatarUrl;
      if (!user.emailVerified) updateData.emailVerified = true;

      if (Object.keys(updateData).length > 0) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });
      }
    } else {
      // 新用户 — 自动注册
      user = await this.prisma.user.create({
        data: {
          email,
          name,
          avatarUrl,
          googleId,
          githubId,
          emailVerified: true, // OAuth 已验证邮箱
        },
      });

      // 异步创建默认工作空间和欢迎文档（不阻塞登录响应）
      this.onboardingService.setupNewUser(user.id);
    }

    const tokens = await this.generateTokens(user.id, user.email);

    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, ...tokens };
  }

  // ==================== Refresh Token ====================

  async refreshTokens(refreshToken: string) {
    // 查找拥有 refresh token 的用户
    const users = await this.prisma.user.findMany({
      where: { refreshToken: { not: null } },
      select: { id: true, email: true, refreshToken: true, isDisabled: true },
    });

    for (const user of users) {
      if (!user.refreshToken) continue;
      const isMatch = await bcrypt.compare(refreshToken, user.refreshToken);
      if (isMatch) {
        if (user.isDisabled) {
          throw new UnauthorizedException('账号已被禁用');
        }
        // Token rotation: 生成新的 token 对
        return this.generateTokens(user.id, user.email);
      }
    }

    throw new UnauthorizedException('无效的刷新令牌');
  }

  // ==================== 账号删除 ====================

  async deleteAccount(userId: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new BadRequestException('用户不存在');
    }

    // OAuth 用户没有密码，跳过密码验证
    if (user.password) {
      const isValid = await this.usersService.validatePassword(
        password,
        user.password,
      );
      if (!isValid) {
        throw new UnauthorizedException('密码错误');
      }
    }

    this.activityService.log({
      userId,
      action: 'ACCOUNT_DELETED',
      entityType: 'USER',
      entityId: userId,
    });

    // 级联删除所有用户数据（Prisma onDelete: Cascade 会处理大部分关联）
    await this.prisma.user.delete({ where: { id: userId } });

    return { message: '账号已永久删除' };
  }

  // ==================== 登出 ====================

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    this.activityService.log({
      userId,
      action: 'LOGOUT',
      entityType: 'USER',
      entityId: userId,
    });

    return { message: '已退出登录' };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { resetToken: token },
    });

    if (!user || !user.resetTokenExpiry) {
      throw new BadRequestException('无效或已过期的重置链接');
    }

    if (user.resetTokenExpiry < new Date()) {
      throw new BadRequestException('重置链接已过期，请重新申请');
    }

    await this.usersService.updatePassword(user.id, newPassword);

    // 清除重置 token
    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetToken: null, resetTokenExpiry: null },
    });

    return { message: '密码重置成功，请使用新密码登录' };
  }
}
