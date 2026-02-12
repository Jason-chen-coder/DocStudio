# 空间模块 (Space Module) 深度学习文档

本文档适合开发人员阅读，旨在详细解析 Doc Studio 空间模块的全栈实现细节，涵盖数据库设计、后端业务逻辑、权限体系以及前端状态管理。

## 1. 系统架构概览

空间模块采用标准的 **Client-Server** 架构：

- **前端**: Next.js (App Router), leveraging React Hooks for state and custom services for API communication.
- **后端**: NestJS, using Prisma ORM for database interactions.
- **数据库**: PostgreSQL (推测), using Prisma schema.

## 2. 数据库设计 (Database Schema)

基于业务逻辑反推的 Prisma Schema 设计如下：

### 2.1 核心模型

#### Space (空间)

空间是核心实体，存储基础元数据。

```prisma
model Space {
  id          String   @id @default(uuid())
  name        String
  description String?
  isPublic    Boolean  @default(false)
  ownerId     String   // 所有者外键
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  owner       User              @relation(fields: [ownerId], references: [id])
  permissions SpacePermission[] // 成员关联
  invitations SpaceInvitation[] // 邀请关联
  documents   Document[]        // 空间内的文档
}
```

#### SpacePermission (成员权限)

用于多对多关联 User 和 Space，并附加角色信息。

```prisma
model SpacePermission {
  id        String   @id @default(uuid())
  spaceId   String
  userId    String
  role      Role     // 枚举: OWNER, ADMIN, EDITOR, VIEWER
  createdAt DateTime @default(now())

  space     Space    @relation(fields: [spaceId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, spaceId]) // 确保一个用户在同一个空间只有一个角色
}
```

#### SpaceInvitation (邀请记录)

存储待处理的邀请信息。

```prisma
model SpaceInvitation {
  id        String           @id @default(uuid())
  email     String?          // 可选，限制特定邮箱加入
  token     String           @unique // 用于生成邀请链接
  role      Role
  status    InvitationStatus // PENDING, ACCEPTED, EXPIRED
  expiresAt DateTime
  spaceId   String
  inviterId String           // 邀请人

  // Relations...
}
```

## 3. 后端实现细节 (NestJS)

### 3.1 权限控制逻辑 (`SpacesService`)

后端在 `SpacesService` 中实现了严格的 RBAC (Role-Based Access Control) 校验。

- **所有者 (OWNER)**:
  - 拥有最高权限，**不能被移除**，**角色不能被修改**。
  - 创建空间时，系统会自动创建一条 `SpacePermission` 记录，角色设为 `OWNER`。
- **管理员 (ADMIN)**:
  - 可以邀请成员、移除成员、修改成员角色。
  - **限制**: 无法修改或移除 `OWNER` 或其他 `ADMIN`。
- **公共访问**:
  - 如果 `Space.isPublic` 为 `true`，非成员也可以访问只读接口 (`findOne`)。
  - 私有空间仅限成员访问。

### 3.2 关键 API 接口

| 方法   | 路径                       | 描述             | 权限要求                             |
| :----- | :------------------------- | :--------------- | :----------------------------------- |
| POST   | `/spaces`                  | 创建空间         | 登录用户                             |
| GET    | `/spaces`                  | 获取我的空间列表 | 登录用户 (返回 Owner 或有权限的空间) |
| GET    | `/spaces/:id`              | 获取详情         | 成员 / Owner / 公开空间              |
| PATCH  | `/spaces/:id`              | 更新信息         | 仅 Owner                             |
| DELETE | `/spaces/:id`              | 删除空间         | 仅 Owner                             |
| GET    | `/spaces/:id/members`      | 获取成员         | 成员                                 |
| PATCH  | `/spaces/:id/members/:uid` | 修改角色         | Owner / Admin (有限制)               |
| POST   | `/spaces/:id/invitations`  | 创建邀请         | Owner / Admin                        |

### 3.3 事务处理

创建空间时使用了 `prisma.$transaction`:

1.  创建 `Space` 记录。
2.  同时创建 `SpacePermission` (Owner) 记录。
    这保证了数据的一致性，不会出现“有空间但没有 Owner 记录”的悬空状态。

## 4. 前端实现细节 (Next.js)

### 4.1 服务层封装 (`space-service.ts`)

前端通过 `fetchWithAuth` 封装请求，自动注入 `Authorization: Bearer <token>`。

- 支持 TypeScript 泛型，返回强类型的 `Space` 或 `SpaceMember` 对象。
- 统一的错误处理：捕获非 2xx 响应并抛出带 Message 的 Error。

### 4.2 状态管理与交互

- **页面级状态**: `SpacesPage` 和 `MembersPage` 使用 `useState` 管理数据 (`spaces`, `members`) 和 UI 状态 (`loading`, `isModalOpen`)。
- **乐观更新 (Optimistic Updates)**:
  - 目前的实现多为**悲观更新** (Pessimistic)，即等待 API 成功返回后再更新本地数据 (如 `loadSpaces()`)。
  - _优化建议_: 对于修改角色等操作，可以引入乐观更新提升体验。
- **全局事件**:
  - `CreateSpaceModal` 成功后会触发 `window.dispatchEvent(new CustomEvent('workspace-updated'))`。这可能用于通知侧边栏 (Sidebar) 刷新空间列表，实现跨组件通信。

### 4.3 具体的组件交互

- **成员管理表格**:
  - 利用条件渲染 (`canManage` 变量) 动态显示/隐藏操作按钮。
  - **自我保护**: 列表中会高亮显示“你”和“拥有者”，并禁用对自己角色的修改，防止误操作导致失去权限。

## 5. 进阶学习建议

如果你想深入开发此模块，建议关注以下点：

1.  **NestJS Guards**: 查看 `jwt-auth.guard.ts` 如何解析 Token 并注入 `req.user`。
2.  **DTO Validation**: 查看 `dto/create-space.dto.ts` 中的 `class-validator` 装饰器，了解后端如何校验输入。
3.  **SWR / TanStack Query**: 前端目前使用 `useEffect` 手动获取数据。生产环境中建议迁移到 SWR 或 React Query 以获得缓存、自动重新聚焦刷新等特性。
