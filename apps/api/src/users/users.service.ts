import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(email: string, name: string, password: string) {
    // 检查用户是否已存在
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('该邮箱已被注册');
    }

    // 哈希密码
    console.log(
      `Creating user ${email}, password length before hash: ${password.length}`,
    );
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const user = await this.prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
    });

    // 返回用户信息（不包含密码）
    const { password: _, ...result } = user;
    return this.transformUser(result);
  }

  async findByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user) return null;
    const result = user;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...rest } = result;
    return this.transformUser(rest);
  }

  async findByEmailWithPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    return this.transformUser(user);
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const { password: _, ...result } = user;
    return this.transformUser(result);
  }

  async validatePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    console.log(
      `Validating password. Plain length: ${plainPassword.length}, Hash length: ${hashedPassword.length}`,
    );
    const result = await bcrypt.compare(plainPassword, hashedPassword);
    console.log(`Password validation result: ${result}`);
    return result;
  }

  async updatePassword(userId: string, newPassword: string) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
    });
    const { password: _, ...result } = user;
    return this.transformUser(result);
  }

  async updateAvatar(userId: string, avatarUrl: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });

    const { password: _, ...result } = user;
    return this.transformUser(result);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private transformUser(user: any) {
    // If user is null, return null
    if (!user) return null;
    
    // Create a copy to avoid mutating original object if needed, 
    // but here we just modify the property on the plain object result.
    // Ensure we don't leak password if it was passed in (though previous code stripped it).
    // The previous code `const { password: _, ...result } = user` returns a new object.
    
    if (user.avatarUrl && !user.avatarUrl.startsWith('http')) {
      const baseUrl = process.env.MINIO_PUBLIC_ENDPOINT || 'http://localhost:9000';
      user.avatarUrl = `${baseUrl}/${user.avatarUrl}`;
    }
    return user;
  }
}
