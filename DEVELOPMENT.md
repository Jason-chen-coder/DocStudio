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
# ── 数据库 ──────────────────────────────────────────────────────
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/docStudio_dev?schema=public"

# ── 服务地址 ─────────────────────────────────────────────────────
PORT=3001
NODE_ENV=development
API_URL=http://localhost:3001          # 后端自身地址，用于 OAuth 回调 URL 拼接
FRONTEND_URL=http://localhost:3000     # 前端地址，用于 CORS 白名单和 OAuth 登录后跳转

# ── JWT ──────────────────────────────────────────────────────────
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# ── 超级管理员（首次启动自动创建）────────────────────────────────
SUPER_ADMIN_EMAIL=admin@doc-studio.com
SUPER_ADMIN_PASSWORD=admin             # ⚠️ 生产环境必须修改为强密码

# ── GitHub OAuth（可选）─────────────────────────────────────────
# Callback URL 自动派生自 API_URL，无需单独配置
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# ── Google OAuth（可选）─────────────────────────────────────────
# Callback URL 自动派生自 API_URL，无需单独配置
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# ── Redis（Hocuspocus 实时协作多实例同步）──────────────────────
REDIS_HOST=localhost
REDIS_PORT=6379

# ── Hocuspocus 实时协作 WebSocket 服务 ──────────────────────────
COLLAB_PORT=1234                       # 独立于 HTTP API，前端通过 ws:// 连接

# ── MinIO 对象存储（头像、文件上传）────────────────────────────
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin            # ⚠️ 生产环境必须修改
MINIO_SECRET_KEY=minioadmin            # ⚠️ 生产环境必须修改
MINIO_BUCKET=avatars
MINIO_PUBLIC_ENDPOINT=http://localhost:9000   # 客户端访问文件的公共地址
MINIO_USE_SSL=false

# ── SMTP 邮件（邮箱验证、密码重置、邀请通知）──────────────────
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_SECURE=false
SMTP_FROM="DocStudio" <noreply@docstudio.app>

# ── AI 辅助写作 ──────────────────────────────────────────────────
AI_PROVIDER=minimax                    # 可选：minimax / openai
AI_API_KEY=
AI_BASE_URL=https://api.minimax.io/v1
AI_MODEL=MiniMax-Text-01
AI_DAILY_LIMIT=50                      # 每用户每日 AI 操作次数上限
```

### 前端环境变量 (`apps/web/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001         # 后端 HTTP API 地址
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:1234     # Hocuspocus WebSocket 地址
NEXT_PUBLIC_CDN_URL=http://localhost:9000         # 文件/头像访问地址（MinIO 或 CDN）
NEXT_PUBLIC_SITE_URL=http://localhost:3000        # 网站地址（用于分享链接、SEO）
```

---

## 🔐 OAuth 第三方登录配置

### GitHub OAuth

**第一步：创建 GitHub OAuth App**

1. 打开 https://github.com/settings/developers → **OAuth Apps** → **New OAuth App**
2. 填写信息：

   | 字段 | 本地开发值 | 生产环境值 |
   |---|---|---|
   | Application name | DocStudio | DocStudio |
   | Homepage URL | `http://localhost:3000` | `https://你的前端域名` |
   | Authorization callback URL | `http://localhost:3001/auth/github/callback` | `https://你的后端域名/auth/github/callback` |

   > ⚠️ **生产环境**：部署后必须回到此页将两个 URL 改为实际域名，同时更新 `.env` 中的 `API_URL`、`FRONTEND_URL`，否则登录报 `redirect_uri_mismatch`。

3. 创建后复制 **Client ID** 和 **Client Secret**，填入 `apps/api/.env`

**第二步：重启后端服务**（环境变量改动需重启才生效）

---

### Google OAuth

**第一步：创建 Google OAuth 应用**

1. 打开 https://console.cloud.google.com → 选择或新建项目
2. 左侧菜单 → **API 和服务** → **OAuth 同意屏幕**
   - 用户类型选 **外部**，填写应用名称和支持邮箱，保存
3. 左侧菜单 → **凭据** → **创建凭据** → **OAuth 客户端 ID**
   - 应用类型选 **Web 应用**，填写：

   | 字段 | 本地开发值 | 生产环境值 |
   |---|---|---|
   | 已获授权的 JavaScript 来源 | `http://localhost:3000` | `https://你的前端域名` |
   | 已获授权的重定向 URI | `http://localhost:3001/auth/google/callback` | `https://你的后端域名/auth/google/callback` |

   > ⚠️ **生产环境**：部署后必须回到此页将两个 URL 改为实际域名，同时更新 `.env` 中的 `API_URL`、`FRONTEND_URL`，否则 Google 拒绝回调。

4. 创建后复制 **客户端 ID** 和 **客户端密钥**，填入 `apps/api/.env`

**第二步：重启后端服务**

---

### OAuth 登录流程说明

```
用户点击登录按钮
  → 跳转到 /auth/github 或 /auth/google（后端）
  → 后端重定向到第三方授权页
  → 用户授权后回调到 /auth/github/callback 或 /auth/google/callback
  → 后端用 code 换取用户信息，生成 JWT
  → 重定向到前端 /auth/oauth-callback?token=xxx&refresh_token=xxx
  → 前端存储 token，跳转到 /dashboard
```

---

## 🚀 生产环境部署

### 部署前检查清单

**必填项（缺少则系统无法正常运行）**

```
[ ] DATABASE_URL              — PostgreSQL 连接字符串
[ ] JWT_SECRET                — 使用强密钥：openssl rand -base64 32
[ ] API_URL                   — 后端实际域名，如 https://api.yourdomain.com
[ ] FRONTEND_URL              — 前端实际域名，如 https://yourdomain.com
[ ] MINIO_ACCESS_KEY/SECRET   — 修改默认的 minioadmin
[ ] SUPER_ADMIN_PASSWORD      — 修改默认的 admin
[ ] NEXT_PUBLIC_API_URL       — 前端 .env 中的后端地址
[ ] NEXT_PUBLIC_WEBSOCKET_URL — 前端 .env 中的 WebSocket 地址（wss://）
[ ] NEXT_PUBLIC_CDN_URL       — 前端 .env 中的文件访问地址
```

**推荐配置（影响功能完整性）**

```
[ ] GITHUB_CLIENT_ID/SECRET   — GitHub 登录，回调 URL 改为生产域名
[ ] GOOGLE_CLIENT_ID/SECRET   — Google 登录，回调 URL 改为生产域名
[ ] SMTP_HOST/USER/PASS       — 邮件验证、密码重置、邀请通知
[ ] AI_API_KEY                — AI 辅助写作功能
```

---

### 生产环境变量示例

**`apps/api/.env`（生产）**

```env
DATABASE_URL="postgresql://user:password@db-host:5432/docstudio?schema=public"
PORT=3001
NODE_ENV=production
API_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com

JWT_SECRET=<openssl rand -base64 32 生成的强密钥>
JWT_EXPIRES_IN=7d

SUPER_ADMIN_EMAIL=admin@yourdomain.com
SUPER_ADMIN_PASSWORD=<强密码>

GITHUB_CLIENT_ID=<your_id>
GITHUB_CLIENT_SECRET=<your_secret>

GOOGLE_CLIENT_ID=<your_id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-<your_secret>

REDIS_HOST=redis-host
REDIS_PORT=6379
COLLAB_PORT=1234

MINIO_ENDPOINT=minio-host
MINIO_PORT=9000
MINIO_ACCESS_KEY=<strong-access-key>
MINIO_SECRET_KEY=<strong-secret-key>
MINIO_BUCKET=avatars
MINIO_PUBLIC_ENDPOINT=https://cdn.yourdomain.com
MINIO_USE_SSL=true

SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=<smtp-password>
SMTP_SECURE=false
SMTP_FROM="DocStudio" <noreply@yourdomain.com>

AI_PROVIDER=minimax
AI_API_KEY=<your-api-key>
AI_BASE_URL=https://api.minimax.io/v1
AI_MODEL=MiniMax-Text-01
AI_DAILY_LIMIT=50
```

**`apps/web/.env.local`（生产）**

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_WEBSOCKET_URL=wss://api.yourdomain.com:1234
NEXT_PUBLIC_CDN_URL=https://cdn.yourdomain.com
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

> ⚠️ **Next.js 图片域名**：生产环境使用自定义域名访问 MinIO 文件时，需要在 `apps/web/next.config.ts` 的 `images.remotePatterns` 中添加该域名，否则图片无法加载。

---

### 数据库部署步骤

```bash
cd apps/api

# 生产环境用 migrate deploy（不创建新迁移，只应用已有迁移）
pnpm exec prisma migrate deploy

# 生成 Prisma Client
pnpm exec prisma generate
```

---

### 构建 & 启动

```bash
# 1. 安装依赖
pnpm install --frozen-lockfile

# 2. 构建
pnpm build

# 3. 启动后端
pnpm --filter @docStudio/api start:prod   # HTTP API :3001 + WebSocket :1234

# 4. 启动前端
pnpm --filter @docStudio/web start        # :3000
```

---

### 反向代理（Nginx 示例）

生产环境建议用 Nginx 统一入口并处理 SSL：

```nginx
# 前端
server {
    listen 443 ssl;
    server_name yourdomain.com;
    location / {
        proxy_pass http://localhost:3000;
    }
}

# 后端 API
server {
    listen 443 ssl;
    server_name api.yourdomain.com;
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    # Hocuspocus WebSocket
    location /ws {
        proxy_pass http://localhost:1234;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

# MinIO 文件访问（可选，若通过 CDN 域名访问）
server {
    listen 443 ssl;
    server_name cdn.yourdomain.com;
    location / {
        proxy_pass http://localhost:9000;
    }
}
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

## 🌐 生产部署（Nginx 反向代理）

项目包含 `nginx/` 目录下的生产 Nginx 配置：

```bash
# 目录结构
nginx/
├── nginx.conf    # 主配置（HTTP/HTTPS server 块）
└── proxy.conf    # 代理规则（API/WebSocket/前端/静态资源）
```

### 使用方式

1. 将 `nginx/` 目录挂载到 Nginx 容器：

```yaml
# docker-compose.prod.yml 中添加 nginx 服务
nginx:
  image: nginx:alpine
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    - ./nginx/proxy.conf:/etc/nginx/conf.d/proxy.conf:ro
    # SSL 证书（生产环境）
    # - ./ssl:/etc/nginx/ssl:ro
  depends_on:
    - api
    - web
```

2. HTTPS 配置：编辑 `nginx/nginx.conf`，取消注释 HTTPS server 块，填写域名和证书路径。

3. 数据库备份：

```bash
# 备份
docker exec docStudio-postgres pg_dump -U postgres docStudio_dev > backup.sql

# 恢复
docker exec -i docStudio-postgres psql -U postgres docStudio_dev < backup.sql
```

---

## 🆘 获取帮助

- **Prisma 文档**：https://www.prisma.io/docs
- **NestJS 文档**：https://docs.nestjs.com
- **Next.js 文档**：https://nextjs.org/docs
- **Docker 文档**：https://docs.docker.com

---

**祝开发愉快！** 🚀
