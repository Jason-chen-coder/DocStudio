# DocStudio 开发环境配置指南

本文档介绍如何在本地搭建 DocStudio 的开发环境。

## 🎯 架构说明

我们采用 **混合方案** 进行开发：

| 组件             | 运行方式  | 原因                 |
| ---------------- | --------- | -------------------- |
| **PostgreSQL**   | 🐳 Docker | 环境一致、易于管理   |
| **Redis**        | 🐳 Docker | 环境一致、易于管理   |
| **MinIO**        | 🐳 Docker | 环境一致、易于管理   |
| **Next.js 前端** | 💻 本地   | 热重载快、开发体验好 |
| **NestJS 后端**  | 💻 本地   | 热重载快、开发体验好 |

这种方式结合了两者的优势：

- ✅ 基础服务环境一致、可复现
- ✅ 应用代码热重载速度快
- ✅ 团队协作友好

---

## 📋 前置要求

### 必需安装

1. **Node.js** >= 22.0.0

   ```bash
   node --version  # 检查版本
   ```

2. **pnpm** >= 9.0.0

   ```bash
   pnpm --version  # 检查版本
   # 如未安装：npm install -g pnpm
   ```

3. **Docker Desktop**
   - [下载 Docker Desktop for Mac](https://www.docker.com/products/docker-desktop)
   - 安装后启动 Docker Desktop
   - 验证安装：
     ```bash
     docker --version
     docker-compose --version
     ```

---

## 🚀 快速开始

### 1. 克隆/进入项目

```bash
cd /path/to/docStudio
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 启动 Docker 服务

```bash
# 启动 PostgreSQL、Redis、MinIO
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志（可选）
docker-compose logs -f
```

预期输出：

```
NAME                IMAGE                 STATUS         PORTS
docStudio-postgres    postgres:16-alpine    Up 10 seconds  0.0.0.0:5432->5432/tcp
docStudio-redis       redis:7-alpine        Up 10 seconds  0.0.0.0:6379->6379/tcp
docStudio-minio       minio/minio:latest    Up 10 seconds  0.0.0.0:9000-9001->9000-9001/tcp
```

### 4. 初始化数据库

```bash
cd apps/api

# 运行数据库迁移（创建表结构）
pnpm exec prisma migrate dev --name init

# 可选：打开 Prisma Studio 查看数据库
pnpm exec prisma studio
```

### 5. 启动开发服务器

```bash
# 回到项目根目录
cd ../..

# 同时启动前端和后端
pnpm dev

# 或分别启动
pnpm dev:web  # 前端: http://localhost:3000
pnpm dev:api  # 后端: http://localhost:3001
```

### ✅ 验证成功

- 前端：访问 http://localhost:3000 看到 Next.js 欢迎页
- 后端：访问 http://localhost:3001 看到 "Hello World!"
- 数据库：`docker-compose ps` 显示所有服务 Up
- Prisma Studio：访问 http://localhost:5555 可查看数据库

---

## 📦 Docker 服务说明

### PostgreSQL

- **端口**：5432
- **用户**：postgres
- **密码**：postgres
- **数据库**：docStudio_dev
- **连接字符串**：`postgresql://postgres:postgres@localhost:5432/docStudio_dev`

### Redis

- **端口**：6379
- **持久化**：启用 AOF
- **用途**：缓存、会话管理、Pub/Sub

### MinIO (对象存储)

- **API 端口**：9000
- **Console 端口**：9001
- **用户**：minioadmin
- **密码**：minioadmin
- **访问 Console**：http://localhost:9001

---

## 🛠️ 常用命令

### Docker 服务管理

```bash
# 启动所有服务
docker-compose up -d

# 停止所有服务
docker-compose stop

# 停止并删除容器（保留数据）
docker-compose down

# 停止并删除容器和数据卷（⚠️ 会丢失所有数据）
docker-compose down -v

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f [service_name]

# 重启某个服务
docker-compose restart postgres
```

### 数据库管理

```bash
cd apps/api

# 生成 Prisma Client（修改 schema.prisma 后）
pnpm exec prisma generate

# 创建新迁移
pnpm exec prisma migrate dev --name 描述

# 查看数据库（图形界面）
pnpm exec prisma studio

# 重置数据库（⚠️ 删除所有数据）
pnpm exec prisma migrate reset

# 格式化 schema 文件
pnpm exec prisma format
```

### 应用开发

```bash
# 启动开发服务器
pnpm dev                # 前端 + 后端
pnpm dev:web            # 仅前端
pnpm dev:api            # 仅后端

# 构建
pnpm build              # 构建所有
pnpm build:web          # 仅前端
pnpm build:api          # 仅后端

# 代码质量
pnpm lint               # 运行 ESLint
pnpm format             # 格式化代码
pnpm typecheck          # 类型检查
```

---

## 🔧 环境变量配置

### 后端环境变量 (`apps/api/.env`)

```env
# 数据库
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/docStudio_dev?schema=public"

# 服务器
PORT=3001
NODE_ENV=development

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# GitHub OAuth（可选）
# GITHUB_CLIENT_ID=
# GITHUB_CLIENT_SECRET=
# GITHUB_CALLBACK_URL=http://localhost:3001/auth/github/callback

# Redis（后续使用）
# REDIS_HOST=localhost
# REDIS_PORT=6379

# MinIO（后续使用）
# MINIO_ENDPOINT=localhost
# MINIO_PORT=9000
# MINIO_ACCESS_KEY=minioadmin
# MINIO_SECRET_KEY=minioadmin
```

### 前端环境变量 (`apps/web/.env.local`)

根据需要创建：

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## 🐛 故障排查

### Docker 服务无法启动

**问题**：`docker-compose up -d` 报错

```bash
# 解决方案 1：检查 Docker Desktop 是否运行
# 打开 Docker Desktop 应用

# 解决方案 2：端口被占用
# 检查端口占用
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis
lsof -i :9000  # MinIO

# 修改 docker-compose.yml 中的端口映射
```

### 数据库连接失败

**问题**：`Error: Can't reach database server`

```bash
# 1. 确认 PostgreSQL 容器运行中
docker-compose ps

# 2. 检查连接字符串
# apps/api/.env 中 DATABASE_URL 是否正确

# 3. 等待数据库完全启动
docker-compose logs postgres

# 4. 重启 PostgreSQL
docker-compose restart postgres
```

### Prisma Client 未找到

**问题**：`Cannot find module '@prisma/client'`

```bash
cd apps/api
pnpm exec prisma generate
```

### 前端/后端无法启动

**问题**：端口被占用

```bash
# 查找占用端口的进程
lsof -i :3000  # 前端
lsof -i :3001  # 后端

# 杀死进程
kill -9 <PID>

# 或修改端口
# apps/web: 修改 package.json 的 dev 脚本
# apps/api: 修改 .env 中的 PORT
```

### 依赖安装失败

```bash
# 清理并重新安装
pnpm clean
rm -rf node_modules
pnpm install
```

---

## 📁 项目目录结构

```
docStudio/
├── apps/
│   ├── web/                    # Next.js 前端
│   │   ├── src/
│   │   │   ├── app/           # App Router 页面
│   │   │   ├── components/    # React 组件
│   │   │   └── lib/           # 工具函数
│   │   └── package.json
│   │
│   └── api/                    # NestJS 后端
│       ├── src/
│       │   ├── prisma/        # Prisma 服务
│       │   ├── modules/       # 业务模块
│       │   └── main.ts
│       ├── prisma/
│       │   └── schema.prisma  # 数据库 Schema
│       ├── .env               # 环境变量
│       └── package.json
│
├── packages/
│   ├── shared/                 # 共享类型和常量
│   └── config/                 # 共享配置
│
├── docker-compose.yml          # Docker 服务配置
├── pnpm-workspace.yaml         # pnpm workspace 配置
└── README.md
```

---

## 🔄 日常开发流程

### 早上开始工作

```bash
# 1. 启动 Docker 服务
docker-compose up -d

# 2. 启动开发服务器
pnpm dev

# 3. 开始编码！
```

### 修改数据库 Schema

```bash
# 1. 编辑 apps/api/prisma/schema.prisma

# 2. 创建迁移
cd apps/api
pnpm exec prisma migrate dev --name 添加字段描述

# 3. Prisma Client 会自动重新生成
```

### 晚上下班

```bash
# 1. 停止开发服务器（Ctrl+C）

# 2. 停止 Docker 服务（可选，也可以保持运行）
docker-compose stop
```

### 清理开发环境

```bash
# ⚠️ 这会删除所有数据
docker-compose down -v
```

---

## 🎓 下一步学习

1. **阅读技术规格文档**
   - [DocStudio v1 – 技术规格文档.md](./DocStudio%20v1%20–%20技术规格文档.md)

2. **Prisma 数据库操作**
   - [apps/api/PRISMA_SETUP.md](./apps/api/PRISMA_SETUP.md)

3. **开始开发功能**
   - Auth 模块（JWT + GitHub OAuth）
   - Space CRUD 接口
   - Document 管理
   - Yjs + Hocuspocus 实时协作

---

## 💡 最佳实践

### 1. 定期备份数据库

```bash
# 导出数据库
docker exec docStudio-postgres pg_dump -U postgres docStudio_dev > backup.sql

# 恢复数据库
docker exec -i docStudio-postgres psql -U postgres docStudio_dev < backup.sql
```

### 2. 使用 Prisma Studio 调试

```bash
cd apps/api
pnpm exec prisma studio
# 在浏览器中可视化查看和编辑数据
```

### 3. 代码提交前检查

```bash
pnpm lint
pnpm typecheck
pnpm format
```

### 4. 共享数据库 Schema 变更

```bash
# 提交 prisma/migrations/ 目录到 Git
# 团队成员运行：
pnpm exec prisma migrate dev
```

---

## 🆘 获取帮助

- **Prisma 文档**：https://www.prisma.io/docs
- **NestJS 文档**：https://docs.nestjs.com
- **Next.js 文档**：https://nextjs.org/docs
- **Docker 文档**：https://docs.docker.com

---

**祝开发愉快！** 🚀
