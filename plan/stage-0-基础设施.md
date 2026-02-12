# Stage 0: 基础设施

**状态**: ✅ 已完成  
**时间**: 已完成  
**目标**: 搭建项目基础架构，实现用户认证系统

---

## 概述

Stage 0 是整个项目的基础，主要完成了项目的基础架构搭建和用户认证系统的实现。这为后续所有功能提供了必要的技术基础。

---

## 已完成功能

### 1. 项目架构搭建

**前端（Next.js）**

- ✅ Next.js 项目初始化
- ✅ Tailwind CSS 配置
- ✅ React 19 集成
- ✅ TypeScript 配置
- ✅ ESLint + Prettier 配置

**后端（NestJS）**

- ✅ NestJS 项目初始化
- ✅ Fastify 适配器配置
- ✅ Prisma ORM 集成
- ✅ PostgreSQL 数据库连接
- ✅ Redis 集成（缓存）
- ✅ Swagger API 文档配置

**开发环境**

- ✅ Monorepo 结构（可选）
- ✅ Docker Compose 配置（PostgreSQL + Redis）
- ✅ 环境变量配置（.env）
- ✅ 开发脚本配置

---

### 2. 用户认证系统

#### 数据模型

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  password  String   // bcrypt 加密
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### API 接口

**POST /auth/register**

- 功能：用户注册
- 请求体：
  ```json
  {
    "email": "user@example.com",
    "name": "用户名",
    "password": "password123"
  }
  ```
- 响应：
  ```json
  {
    "id": "user_id",
    "email": "user@example.com",
    "name": "用户名",
    "token": "jwt_token"
  }
  ```
- 验证规则：
  - Email 格式验证
  - 密码强度验证（最少 8 位）
  - Email 唯一性检查
  - 密码 bcrypt 加密存储

**POST /auth/login**

- 功能：用户登录
- 请求体：
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- 响应：
  ```json
  {
    "id": "user_id",
    "email": "user@example.com",
    "name": "用户名",
    "token": "jwt_token"
  }
  ```
- 验证：
  - Email 存在性检查
  - 密码正确性验证
  - 生成 JWT token

**GET /auth/me**

- 功能：获取当前登录用户信息
- Headers: `Authorization: Bearer <token>`
- 响应：
  ```json
  {
    "id": "user_id",
    "email": "user@example.com",
    "name": "用户名",
    "createdAt": "2026-01-01T00:00:00.000Z"
  }
  ```

#### 前端功能

**注册页面** (`/auth/register`)

- 注册表单（Email、用户名、密码）
- 表单验证（前端 + 后端）
- 错误提示
- 注册成功后自动登录并跳转

**登录页面** (`/auth/login`)

- 登录表单（Email、密码）
- 表单验证
- 错误提示
- 登录成功后跳转到工作台
- "记住我"功能（可选）

**认证状态管理**

- JWT Token 存储（localStorage/cookie）
- 全局认证状态管理
- 受保护路由（需要登录才能访问）
- 自动登出（token 过期）

#### 安全措施

- ✅ 密码 bcrypt 加密（salt rounds: 10）
- ✅ JWT 签名和验证
- ✅ Token 过期时间设置（7天）
- ✅ HTTPS（生产环境）
- ✅ CORS 配置
- ✅ Rate Limiting（防止暴力破解）
- ✅ Helmet 安全头

---

## 技术实现要点

### JWT 认证流程

```
Client                    Server
  |                          |
  |--- POST /auth/login ---> |
  |                          | 1. 验证用户名密码
  |                          | 2. 生成 JWT token
  |<-- { token } ----------- |
  |                          |
  | 存储 token               |
  |                          |
  |--- GET /auth/me -------> |
  | Headers: Bearer token    | 3. 验证 token
  |                          | 4. 解码获取用户 ID
  |<-- { user } ------------ |
```

### Prisma 数据库迁移

```bash
# 创建迁移
npx prisma migrate dev --name init

# 应用迁移
npx prisma migrate deploy

# 生成 Prisma Client
npx prisma generate
```

### 环境变量

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/docstudio"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secret-key"
JWT_EXPIRES_IN="7d"

# App
NODE_ENV="development"
PORT=3001
```

---

## 验收标准

- ✅ 用户可以成功注册账号
- ✅ 用户可以使用 Email 和密码登录
- ✅ 登录后可以访问受保护的页面
- ✅ 未登录用户访问受保护页面会自动跳转到登录页
- ✅ Token 过期后自动登出
- ✅ 密码安全存储（bcrypt）
- ✅ API 文档可访问（Swagger）

---

## 下一步

进入 **Stage 1: 核心基础功能**，开始开发工作空间和文档管理功能。
