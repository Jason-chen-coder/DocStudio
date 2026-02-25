import {
  Injectable, OnApplicationBootstrap, Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AdminBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminBootstrapService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onApplicationBootstrap() {
    const existingSuperAdmin = await this.prisma.user.findFirst({
      where: { isSuperAdmin: true } as any,
    });

    if (existingSuperAdmin) {
      this.logger.log('超级管理员已存在，跳过初始化');
      return;
    }

    const email =
      process.env.SUPER_ADMIN_EMAIL ?? 'admin@doc-studio.com';
    const rawPassword = process.env.SUPER_ADMIN_PASSWORD ?? 'admin';
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    await this.prisma.user.create({
      data: {
        email,
        name: email,
        password: hashedPassword,
        isSuperAdmin: true,
      } as any,
    });

    this.logger.log(`[Bootstrap] 超级管理员账号已创建，邮箱: ${email}`);
  }
}
