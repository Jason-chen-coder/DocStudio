# ── Stage 1: 构建 ────────────────────────────────────────────
FROM node:22-alpine AS builder

RUN npm install -g pnpm@9

WORKDIR /app

# 先复制 package.json 文件，利用 Docker 层缓存加速重复构建
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
COPY packages/config/package.json ./packages/config/

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源码
COPY apps/api/ ./apps/api/
COPY packages/shared/ ./packages/shared/
COPY packages/config/ ./packages/config/

# 生成 Prisma Client
RUN pnpm --filter @docStudio/api exec prisma generate

# 编译 NestJS
RUN pnpm build:api

# 仅安装生产依赖
RUN pnpm install --frozen-lockfile --prod

# ── Stage 2: 生产镜像（仅包含运行时所需文件）─────────────────
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nestjs && \
    adduser --system --uid 1001 nestapi

# 复制编译产物
COPY --from=builder --chown=nestapi:nestjs /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=nestapi:nestjs /app/apps/api/package.json ./apps/api/

# 复制 Prisma schema 和迁移（migrate deploy 需要）
COPY --from=builder --chown=nestapi:nestjs /app/apps/api/prisma ./apps/api/prisma

# 复制生产依赖和 Prisma Client
COPY --from=builder --chown=nestapi:nestjs /app/node_modules ./node_modules
COPY --from=builder --chown=nestapi:nestjs /app/packages ./packages
COPY --from=builder --chown=nestapi:nestjs /app/package.json ./

USER nestapi

EXPOSE 3001 1234

# 启动前自动执行数据库迁移
CMD ["sh", "-c", "npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma && node apps/api/dist/main"]
