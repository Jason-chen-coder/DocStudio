# DocStudio v1 – 文档

<img src="docStudio_icon.png" width="200" height="200" alt="DocStudio Icon" />

**产品**：docStudio  
**目标**：实时协作 Wiki / 文档平台 + 公开知识分享平台  
**版本**：v1 MVP（不含 AI 功能）  
**定位**：团队内部协作 + 公开知识库

---

## 1. 产品定义

DocStudio 是一个面向团队的实时协作文档平台，用于创建、组织和共享结构化知识，实现高效管理。

**两种使用模式**

🔒 **私有模式（团队协作）**

- 需要登录访问
- 团队成员协作编辑
- 严格的权限控制
- 可通过分享链接临时共享

🌐 **公开模式（知识分享）**

- 无需登录即可浏览
- 公开工作空间对所有人可见
- SEO 友好，可被搜索引擎索引
- 在项目首页展示

**核心原则**

- 结构化优先，而非自由形式
- 协作优先
- 权限先行，功能其次
- 公开与私有并重
- 支持自托管

---

## 2. 核心功能（v1 MVP）

### 2.1 工作空间与文档结构

- Space（团队 / 项目空间）
  - 支持公开/私有设置
  - 公开 Space 在首页展示
  - 私有 Space 仅团队成员可访问
- 层级文档树，支持拖拽排序
- 文档元信息（标题、更新时间等）
- 文档继承 Space 的公开属性

### 2.2 编辑器（Tiptap）

- 富文本 + Block 内容
- Slash 命令
- 支持表格、代码块、列表
- 自动保存
- 编辑器状态绑定 Yjs Doc（非 HTML）

### 2.3 实时协作（Yjs + Hocuspocus）

- 多用户同时编辑
- 基于 CRDT 的冲突免疫同步
- 在线用户显示，光标位置提示（可选）
- 每文档对应一个 Yjs 房间
- 后端权限验证后才能连接 WebSocket

### 2.4 权限管理

**团队内部权限**

| 角色   | 读取 | 写入 | 分享 | 删除 |
| ------ | ---- | ---- | ---- | ---- |
| Owner  | ✅   | ✅   | ✅   | ✅   |
| Editor | ✅   | ✅   | ❌   | ❌   |
| Viewer | ✅   | ❌   | ❌   | ❌   |

**公开访问**

- 公开 Space：所有人可访问，无需登录
- 私有 Space：仅团队成员可访问

### 2.5 分享功能

**公开工作空间（首页展示）**

- 将 Space 标记为公开
- 在项目首页展示所有公开 Space
- 支持搜索和筛选
- 无需登录即可访问公开内容

**私密分享（ShareToken）**

- 为私有 Space/Document 生成分享链接
- 设置访问密码（可选）
- 设置有效期（永久/7天/30天/自定义）
- 链接管理（查看/删除）
- 防暴力破解保护

### 2.6 项目首页

**产品介绍区**

- Hero Section（产品 Slogan + CTA）
- 核心特性展示
- 使用场景说明
- 注册/登录入口

**公开内容展示区**

- 展示所有 `isPublic: true` 的 Space
- Space 卡片（名称、描述、文档数、更新时间）
- 搜索和筛选功能
- 分页加载

### 2.7 历史与安全（精简版）

- 文档版本快照
- 可恢复历史版本

---

## 3. 系统架构

**前端 (Next.js + React 19)**

- Tiptap 编辑器 + Yjs 客户端 + @hocuspocus
- Socket.io 协作通道
- 页面路由 / UI 组件 / Tailwind CSS

**后端 (NestJS + Fastify)**

- 用户认证（JWT / GitHub OAuth）
- Space / Document API
- 权限系统（RBAC）
- 协作访问控制（Hocuspocus WebSocket）
- 文件上传、对象存储（MinIO）
- 图像处理（Sharp）
- 日志系统（Winston + Rotate）
- 服务监控（Terminus + Prometheus / Grafana）
- 安全中间件（Helmet / Rate-limit）
- API 文档（Swagger）

**持久层**

- PostgreSQL（元数据，Prisma ORM）
- Redis（缓存、协作会话管理、Pub/Sub）
- Yjs 更新存储（文档内容）

---

## 4. 前端技术栈

| 技术                | 说明                                         |
| ------------------- | -------------------------------------------- |
| Next.js             | 构建基础框架，支持 SSR / SSG                 |
| Tiptap              | 富文本编辑器，基于 ProseMirror               |
| Yjs                 | 协同编辑核心，CRDT 数据结构                  |
| @hocuspocus         | Yjs 的服务端与客户端 Provider                |
| React 19            | UI 框架，支持 Suspense / Concurrent Features |
| Tailwind CSS        | 原子化 CSS，集成动画、表单样式等             |
| Socket.io           | 协作消息通道                                 |
| Prettier / ESLint   | 代码风格统一                                 |
| Vitest / Playwright | 单元测试与端到端测试支持                     |

---

## 5. 后端技术栈

| 技术                                         | 说明                                                        |
| -------------------------------------------- | ----------------------------------------------------------- |
| NestJS                                       | 现代化 Node.js 框架，支持模块化、依赖注入、装饰器和类型安全 |
| Fastify                                      | 高性能 Web 服务引擎，替代 Express                           |
| @hocuspocus/server, Yjs                      | 协作编辑服务，支持 CRDT                                     |
| Prisma                                       | 类型安全 ORM，数据库访问、迁移和种子数据                    |
| class-validator, class-transformer           | DTO 请求数据验证与自动转换                                  |
| @nestjs/passport, passport, JWT, GitHub      | 本地登录、JWT 认证、GitHub OAuth                            |
| ioredis                                      | 缓存、限流、协作会话管理、Pub/Sub                           |
| MinIO                                        | 私有化 S3 对象存储，支持附件和图片上传                      |
| Sharp                                        | 图像处理（压缩、格式转换、缩略图）                          |
| Winston, winston-daily-rotate-file           | 日志系统，支持归档和分级                                    |
| @nestjs/terminus, prom-client                | 健康检查和 Prometheus 指标暴露                              |
| Prometheus, Grafana                          | 监控平台，采集与可视化指标                                  |
| @nestjs/swagger                              | 自动生成 API 文档                                           |
| @fastify/helmet, @fastify/rate-limit         | HTTP 安全头和请求频率限制                                   |
| @fastify/multipart, nest-fastify-file-upload | 文件流式上传支持                                            |

---

## 6. 数据模型（PostgreSQL / Prisma）

### 核心模型

**User（用户）**

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

**Space（工作空间）**

```prisma
model Space {
  id          String   @id @default(cuid())
  name        String
  description String?  // 工作空间描述
  isPublic    Boolean  @default(false) // 🆕 是否公开
  ownerId     String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Document（文档）**

```prisma
model Document {
  id        String   @id @default(cuid())
  spaceId   String
  parentId  String?  // 父文档 ID（用于树形结构）
  title     String
  ydocKey   String   @unique // Yjs document key
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**SpacePermission（团队权限）**

```prisma
model SpacePermission {
  id        String   @id @default(cuid())
  userId    String
  spaceId   String
  role      Role     // owner/editor/viewer
  createdAt DateTime @default(now())

  @@unique([userId, spaceId])
}

enum Role {
  OWNER
  EDITOR
  VIEWER
}
```

**ShareToken（私密分享）**

```prisma
model ShareToken {
  id        String     @id @default(cuid())
  token     String     @unique // 随机生成的分享 token
  type      ShareType  // SPACE | DOCUMENT
  spaceId   String?    // 分享整个 Space
  docId     String?    // 分享单个文档
  password  String?    // 访问密码（bcrypt 加密，可选）
  expiresAt DateTime?  // 过期时间（可选）
  createdBy String     // 创建者用户 ID
  createdAt DateTime   @default(now())
}

enum ShareType {
  SPACE
  DOCUMENT
}
```

---

## 7. API 设计

### 认证相关

- `POST /auth/register` - 用户注册
- `POST /auth/login` - 用户登录
- `GET /auth/me` - 获取当前用户信息

### 工作空间（需要登录）

- `POST /spaces` - 创建 Space
- `GET /spaces` - 获取我的 Space 列表
- `GET /spaces/:id` - 获取 Space 详情
- `PATCH /spaces/:id` - 更新 Space（包括 isPublic）
- `DELETE /spaces/:id` - 删除 Space

### 文档（需要登录）

- `POST /spaces/:id/docs` - 在 Space 中创建文档
- `GET /docs/:id` - 获取文档详情
- `PATCH /docs/:id` - 更新文档
- `DELETE /docs/:id` - 删除文档
- `GET /spaces/:id/docs/tree` - 获取文档树

### 团队权限（需要登录）

- `POST /spaces/:id/permissions` - 邀请成员
- `GET /spaces/:id/permissions` - 获取成员列表
- `PATCH /spaces/:id/permissions/:userId` - 更新成员角色
- `DELETE /spaces/:id/permissions/:userId` - 移除成员

### 私密分享（需要登录创建，公开访问）

- `POST /share` - 创建分享链接
- `GET /share/:token` - 验证并获取分享内容
- `POST /share/:token/verify` - 验证访问密码
- `DELETE /share/:tokenId` - 删除分享链接

### 公开访问（无需登录）

- `GET /public/spaces` - 获取所有公开工作空间
- `GET /public/spaces/:id` - 获取公开工作空间详情
- `GET /public/spaces/:id/docs` - 获取公开工作空间的文档树
- `GET /public/docs/:id` - 获取公开文档内容

### 实时协作

- `WS /collab?docId=xxx` - WebSocket 协作连接

---

## 8. 权限规则

| 角色   | 读取 | 写入 | 分享 | 删除 |
| ------ | ---- | ---- | ---- | ---- |
| Owner  | ✅   | ✅   | ✅   | ✅   |
| Editor | ✅   | ✅   | ❌   | ❌   |
| Viewer | ✅   | ❌   | ❌   | ❌   |

---

## 9. 开发阶段

### ✅ Stage 0: 基础设施（已完成）

- 用户注册登录
- JWT 认证
- 项目基础架构搭建

### 🏗️ Stage 1: 核心基础功能（4-6周）

**目标**：搭建产品骨架，实现单用户编辑

1. **Space 工作空间管理**
   - 创建 Space（设置公开/私有）
   - Space 列表（我的工作空间）
   - Space 基本信息管理
   - 数据模型：增加 `isPublic` 字段

2. **Document CRUD**
   - 文档的增删改查
   - 文档基本信息管理
   - 继承 Space 的公开属性

3. **Tiptap 编辑器集成（单用户版本）**
   - 富文本编辑器
   - 基础格式化功能（标题、列表、表格、代码块）
   - Slash 命令
   - 自动保存

4. **文档树结构与导航**
   - 层级文档树展示
   - 拖拽排序
   - 侧边栏导航
   - 面包屑导航

### 🌐 Stage 2: 公开访问层（2-3周）

**目标**：打造产品门面，支持知识分享

5. **项目首页**
   - Hero Section（产品介绍）
   - 核心特性展示
   - 注册/登录入口

6. **公开工作空间展示**
   - 展示所有公开 Space
   - Space 卡片设计
   - 搜索和筛选
   - 分页加载

7. **公开内容浏览**
   - 公开 Space 详情页（`/public/space/:id`）
   - 公开文档阅读页（`/public/doc/:id`）
   - 只读模式的文档查看器
   - 文档目录导航（TOC）

8. **SEO 优化**
   - Meta 标签优化
   - Open Graph 支持
   - Sitemap 生成
   - 响应式设计

### 👥 Stage 3: 团队协作功能（3-4周）

**目标**：支持团队内部协作和私密分享

9. **基础权限管理（团队内部）**
   - SpacePermission（Owner/Editor/Viewer）
   - 邀请团队成员
   - 权限检查与控制
   - 成员管理界面

10. **私密分享功能（ShareToken）**
    - 生成分享链接（Space/Document 级别）
    - 设置访问密码
    - 设置有效期
    - 分享链接管理界面
    - 访问密码验证页面
    - 防暴力破解保护

### ⚡ Stage 4: 高级功能（4-6周）

**目标**：提升协作体验和产品完整度

11. **实时协作（Yjs + Hocuspocus）**
    - Yjs 集成到 Tiptap
    - Hocuspocus 服务器搭建
    - WebSocket 连接与权限验证
    - 多用户同时编辑
    - 在线用户显示
    - 光标位置提示

12. **文件上传与图像处理**
    - MinIO 对象存储集成
    - 图片上传与压缩
    - Sharp 图像处理
    - 编辑器中插入图片
    - 附件上传（可选）

13. **版本历史与快照**
    - 文档快照存储
    - 版本历史列表
    - 恢复历史版本
    - 版本对比（可选）

---

## 10. v1 明确不做的功能

- AI 功能
- 全文搜索
- 评论系统
- 公开发布

---

## 11. 完成标准（v1）

- 两个用户可实时编辑同一文档
- 权限控制正确生效
- 文档可持久化并恢复
- 系统可自托管
