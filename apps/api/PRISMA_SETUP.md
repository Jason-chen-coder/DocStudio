# Prisma 数据库配置指南

本指南将教您如何为 DocStudio 配置 Prisma + PostgreSQL。

## 📚 什么是 Prisma？

Prisma 是一个现代化的 TypeScript ORM（对象关系映射）工具，它提供：

- **类型安全**：自动生成 TypeScript 类型
- **直观的 API**：简洁的数据库操作语法
- **数据库迁移**：版本控制数据库 schema
- **Prisma Studio**：可视化数据库管理工具

## 🚀 配置步骤

### 1. 安装依赖

```bash
cd apps/api
pnpm add prisma @prisma/client
```

- `prisma`：CLI 工具，用于迁移和生成代码
- `@prisma/client`：运行时客户端，用于查询数据库

### 2. 初始化 Prisma

```bash
pnpm dlx prisma init
```

这会创建：

- `prisma/schema.prisma` - 数据库 schema 定义文件
- `.env` - 环境变量文件（包含 DATABASE_URL）

### 3. 配置数据库连接 (.env)

```env
# PostgreSQL 连接字符串格式
DATABASE_URL="postgresql://用户名:密码@主机:端口/数据库名?schema=public"

# 本地开发示例
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/docStudio_dev?schema=public"

# 其他环境变量
PORT=3001
NODE_ENV=development
JWT_SECRET=your-secret-key-change-this
```

### 4. 定义数据模型 (schema.prisma)

根据 DocStudio 技术规格文档，我们定义以下模型：

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// 用户模型
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  password  String?  // 可选：如果使用 GitHub OAuth
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // 关系
  ownedSpaces      Space[]            @relation("SpaceOwner")
  spacePermissions SpacePermission[]

  @@map("users")
}

// 空间模型
model Space {
  id        String   @id @default(cuid())
  name      String
  ownerId   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // 关系
  owner       User              @relation("SpaceOwner", fields: [ownerId], references: [id], onDelete: Cascade)
  documents   Document[]
  permissions SpacePermission[]

  @@map("spaces")
}

// 文档模型
model Document {
  id        String    @id @default(cuid())
  spaceId   String
  parentId  String?   // 支持层级结构
  title     String
  ydocKey   String    @unique // Yjs 文档标识符
  order     Int       @default(0) // 排序
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  // 关系
  space      Space        @relation(fields: [spaceId], references: [id], onDelete: Cascade)
  parent     Document?    @relation("DocumentHierarchy", fields: [parentId], references: [id], onDelete: Cascade)
  children   Document[]   @relation("DocumentHierarchy")
  shareTokens ShareToken[]

  @@index([spaceId])
  @@index([parentId])
  @@index([ydocKey])
  @@map("documents")
}

// 空间权限模型
model SpacePermission {
  id        String   @id @default(cuid())
  userId    String
  spaceId   String
  role      Role     @default(VIEWER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // 关系
  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  space Space @relation(fields: [spaceId], references: [id], onDelete: Cascade)

  @@unique([userId, spaceId]) // 一个用户在一个空间只能有一个角色
  @@map("space_permissions")
}

// 分享令牌模型
model ShareToken {
  id         String    @id @default(cuid())
  docId      String
  token      String    @unique @default(cuid())
  permission Permission @default(READ)
  expiresAt  DateTime?
  createdAt  DateTime  @default(now())

  // 关系
  document Document @relation(fields: [docId], references: [id], onDelete: Cascade)

  @@index([token])
  @@map("share_tokens")
}

// 枚举：角色
enum Role {
  OWNER
  EDITOR
  VIEWER
}

// 枚举：权限
enum Permission {
  READ
  WRITE
}
```

### 5. 运行数据库迁移

```bash
# 创建迁移文件
pnpm dlx prisma migrate dev --name init

# 这会：
# 1. 在数据库中创建表
# 2. 生成 TypeScript 客户端
# 3. 创建迁移历史文件
```

### 6. 生成 Prisma Client

```bash
pnpm dlx prisma generate
```

这会生成类型安全的查询客户端。

### 7. 在 NestJS 中集成 Prisma

创建 Prisma 服务：

```typescript
// src/prisma/prisma.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks(app: any) {
    this.$on('beforeExit', async () => {
      await app.close();
    });
  }
}
```

创建 Prisma 模块：

```typescript
// src/prisma/prisma.module.ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
export class PrismaModule {
  static forRoot() {
    return {
      module: PrismaModule,
      providers: [PrismaService],
      exports: [PrismaService],
    };
  }
}
```

在 AppModule 中注册：

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule.forRoot()],
  // ...
})
export class AppModule {}
```

### 8. 使用 Prisma Client 查询数据

```typescript
// 示例：在服务中使用
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  // 创建用户
  async createUser(email: string, name: string) {
    return this.prisma.user.create({
      data: { email, name },
    });
  }

  // 查找用户
  async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  // 查找用户的所有空间
  async getUserSpaces(userId: string) {
    return this.prisma.space.findMany({
      where: {
        OR: [{ ownerId: userId }, { permissions: { some: { userId } } }],
      },
      include: {
        owner: true,
        permissions: true,
      },
    });
  }
}
```

## 🛠️ 常用 Prisma 命令

```bash
# 格式化 schema.prisma
pnpm dlx prisma format

# 查看数据库结构
pnpm dlx prisma db pull

# 推送 schema 到数据库（开发时快速测试）
pnpm dlx prisma db push

# 打开 Prisma Studio（可视化数据库管理）
pnpm dlx prisma studio

# 重置数据库（⚠️ 会删除所有数据）
pnpm dlx prisma migrate reset

# 查看迁移状态
pnpm dlx prisma migrate status
```

## 📝 最佳实践

### 1. 使用 seed 脚本初始化数据

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 创建测试用户
  const user = await prisma.user.create({
    data: {
      email: 'test@docStudio.com',
      name: 'Test User',
    },
  });

  // 创建测试空间
  await prisma.space.create({
    data: {
      name: 'My First Space',
      ownerId: user.id,
    },
  });
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
```

在 package.json 中添加：

```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

运行：`pnpm dlx prisma db seed`

### 2. 环境变量管理

不同环境使用不同的数据库：

```env
# .env.development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/docStudio_dev"

# .env.test
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/docStudio_test"

# .env.production
DATABASE_URL="your-production-database-url"
```

### 3. 迁移版本控制

将 `prisma/migrations/` 目录提交到 Git，团队成员运行 `prisma migrate dev` 同步数据库。

## 🐳 使用 Docker 运行 PostgreSQL

如果还没有 PostgreSQL，可以用 Docker 快速启动：

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: docStudio-postgres
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: docStudio_dev
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    container_name: docStudio-redis
    restart: always
    ports:
      - '6379:6379'

volumes:
  postgres_data:
```

启动：`docker-compose up -d`

## ❓ 常见问题

### Q1: Prisma Client 未找到？

**A:** 运行 `pnpm dlx prisma generate` 生成客户端

### Q2: 数据库连接失败？

**A:** 检查 `.env` 中的 `DATABASE_URL` 是否正确，确保 PostgreSQL 运行中

### Q3: 如何重置数据库？

**A:** `pnpm dlx prisma migrate reset`（⚠️ 会删除所有数据）

### Q4: 修改了 schema 后怎么办？

**A:** 运行 `pnpm dlx prisma migrate dev --name 描述` 创建新迁移

## 🎯 下一步

1. ✅ 配置 Prisma
2. 🔜 实现 Auth 模块（JWT + Passport）
3. 🔜 创建 Space 和 Document CRUD 接口
4. 🔜 集成 Yjs + Hocuspocus 协作

---

更多信息请参考：

- [Prisma 官方文档](https://www.prisma.io/docs)
- [NestJS + Prisma 集成](https://docs.nestjs.com/recipes/prisma)
