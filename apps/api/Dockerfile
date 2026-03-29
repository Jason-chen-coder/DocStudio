FROM node:22-alpine

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

EXPOSE 3001 1234

# 启动前自动执行数据库迁移
CMD ["sh", "-c", "pnpm --filter @docStudio/api exec prisma migrate deploy && node apps/api/dist/main"]
