# DocStudio

<div align="center">
  <img src="docStudio_icon.png" width="200" height="200" alt="DocStudio Icon" />
</div>

DocStudio 是一个**团队协作文档平台**，旨在成为团队的**知识库系统**。它提供类似 Notion 的体验，支持多文档管理、实时协作和知识沉淀。

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11-red)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748)](https://www.prisma.io/)

---

### 核心价值

- **知识沉淀**：将团队知识集中管理，避免信息孤岛
- **高效协作**：支持多人实时编辑，提升团队协作效率
- **灵活扩展**：基于 Monorepo 架构，易于扩展新功能

---

<div align="center" style="display: flex; flex-direction: column; gap: 0;">
  <img src="./home_page_1.png" width="100%" alt="DocStudio Home Page Part 1" style="display: block; margin: 0; padding: 0; vertical-align: bottom;" />
  <img src="./home_page_2.png" width="100%" alt="DocStudio Home Page Part 2" style="display: block; margin: 0; padding: 0; vertical-align: bottom;" />
  <img src="./home_page_3.png" width="100%" alt="DocStudio Home Page Part 3" style="display: block; margin: 0; padding: 0; vertical-align: bottom;" />
  <img src="./home_page_4.png" width="100%" alt="DocStudio Home Page Part 4" style="display: block; margin: 0; padding: 0; vertical-align: bottom;" />
  <img src="./home_page_5.png" width="100%" alt="DocStudio Home Page Part 5" style="display: block; margin: 0; padding: 0; vertical-align: bottom;" />
  <img src="./home_page_6.png" width="100%" alt="DocStudio Home Page Part 6" style="display: block; margin: 0; padding: 0; vertical-align: bottom;" />
</div>

## 🚀 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 启动 Docker 服务（数据库等）

```bash
docker-compose up -d
```

### 3. 初始化数据库

```bash
cd apps/api
pnpm exec prisma migrate dev --name init
```

### 4. 启动开发服务器

```bash
cd ../..
pnpm dev
```

**访问应用**：

- 前端：http://localhost:3000
- 后端：http://localhost:3001
- Prisma Studio：`cd apps/api && pnpm exec prisma studio`

**详细配置请查看** → [开发环境指南](./DEVELOPMENT.md)

---

## 📁 项目结构

```
docStudio/
├── apps/
│   ├── web/                    # Next.js 15 前端
│   │   ├── src/app/           # App Router
│   │   └── tailwind.config.ts
│   └── api/                    # NestJS 后端
│       ├── src/
│       ├── prisma/schema.prisma
│       └── .env
├── packages/
│   ├── shared/                 # 共享类型和常量
│   └── config/                 # 共享配置
├── docker-compose.yml          # Docker 服务
└── pnpm-workspace.yaml
```

---

## 🛠️ 技术栈

| 领域       | 技术选型                             |
| ---------- | ------------------------------------ |
| **包管理** | pnpm workspace                       |
| **前端**   | Next.js 15, React 19, Tailwind CSS 4 |
| **后端**   | NestJS 11, Fastify                   |
| **数据库** | PostgreSQL 16, Prisma 5.22           |
| **缓存**   | Redis 7                              |
| **存储**   | MinIO (S3 兼容)                      |
| **协作**   | Yjs + Hocuspocus（待集成）           |
| **编辑器** | Tiptap（待集成）                     |
| **语言**   | TypeScript 5.9                       |

---

## 📝 常用命令

### 开发

```bash
pnpm dev              # 启动前后端
pnpm dev:web          # 仅前端
pnpm dev:api          # 仅后端
```

### 构建

```bash
pnpm build            # 构建所有应用
pnpm build:web        # 仅前端
pnpm build:api        # 仅后端
```

### 代码质量

```bash
pnpm lint             # ESLint
pnpm format           # Prettier 格式化
pnpm typecheck        # TypeScript 类型检查
```

### 数据库

```bash
cd apps/api
pnpm exec prisma migrate dev    # 创建迁移
pnpm exec prisma generate       # 生成客户端
pnpm exec prisma studio         # 可视化工具
```

---

## 📚 文档

- **[开发环境配置](./DEVELOPMENT.md)** - 详细的环境搭建指南
- **[Prisma 数据库](./apps/api/PRISMA_SETUP.md)** - 数据库配置和使用
- **[技术规格文档](./DocStudio%20v1%20–%20技术规格文档.md)** - 产品和技术规格

---

### ✅ Stage 0: 基础设施（已完成）

- [x] Monorepo 项目结构
- [x] 前端基础框架（Next.js 15）
- [x] 后端基础框架（NestJS + Fastify）
- [x] 数据库 Schema 设计（Prisma）
- [x] Docker 开发环境 (PostgreSQL, Redis, MinIO)
- [x] 用户认证（JWT + GitHub OAuth）

### 🏗️ Stage 1: 核心功能（进行中）

- [x] Space 工作空间管理
- [x] Document 文档 CRUD
- [x] Tiptap 编辑器基础集成
- [ ] 文档树结构与拖拽排序

### 🌐 Stage 2: 公开访问层（待开发）

- [ ] 项目首页（Hero Section）
- [ ] 公开工作空间展示列表
- [ ] 公开文档阅读页（SEO 优化）

### � Stage 3: 团队协作功能（待开发）

- [ ] 团队权限管理（Owner/Editor/Viewer）
- [ ] 私密分享链接（ShareToken）

### ⚡ Stage 4: 高级功能（待开发）

- [x] 文件上传与头像设置 (MinIO)
- [ ] 实时协作（Yjs + Hocuspocus）
- [ ] 文档版本历史

> 详细规划请查看：[DocStudio v1 产品文档](./DocStudio%20v1–文档.md)

---

## 🤝 开发工作流

1. **启动开发环境**

   ```bash
   docker-compose up -d
   pnpm dev
   ```

2. **修改数据库 Schema**

   ```bash
   # 编辑 apps/api/prisma/schema.prisma
   cd apps/api
   pnpm exec prisma migrate dev --name 描述
   ```

3. **开发功能**
   - 前端：修改 `apps/web/src/`
   - 后端：修改 `apps/api/src/`
   - 共享类型：修改 `packages/shared/src/`

4. **提交前检查**
   ```bash
   pnpm lint
   pnpm format
   pnpm typecheck
   ```

---

## 开发计划

详见：[开发计划](./plan/README.md)

---

## 📄 许可

Private - DocStudio v1 MVP

---

**开发愉快！** 🎉 如有问题请查看 [开发环境指南](./DEVELOPMENT.md)
