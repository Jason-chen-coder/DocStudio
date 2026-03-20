# Stage 3: 团队协作功能

**状态**: ✅ 已完成
**更新时间**: 2026-03-20
**预计时间**: 3-4 周
**目标**: 支持团队内部协作和私密分享

> **全部完成**: 权限管理（OWNER/ADMIN/EDITOR/VIEWER 四角色 + Guard）、成员邀请与管理（邀请链接/加入/角色修改/移除）、私密分享（PUBLIC/PASSWORD + bcrypt + JWT 短效 token + 有效期）、分享列表查询与删除 API、Rate Limiting 防暴力破解（@nestjs/throttler）

---

## 概述

Stage 3 实现完整的团队协作功能，包括细粒度权限管理和灵活的私密分享机制。让团队可以安全地协作，同时也能将私有内容临时分享给外部人员。

---

## 功能清单

### 1. 团队权限管理

#### 数据模型

> ✅ 已实现（在文档设计基础上扩展了 `ADMIN` 角色）

```prisma
model SpacePermission {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  spaceId   String
  space     Space    @relation(fields: [spaceId], references: [id], onDelete: Cascade)
  role      Role     @default(VIEWER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, spaceId])
  @@index([spaceId])
  @@index([userId])
}

enum Role {
  OWNER   // 拥有者：完全控制
  ADMIN   // 管理员：管理成员、设置（超出原始设计，实际新增）
  EDITOR  // 编辑者：读写文档
  VIEWER  // 访客：只读
}
```

#### 权限说明

| 角色   | 读取 | 写入 | 邀请成员 | 删除 | 设置 |
| ------ | ---- | ---- | -------- | ---- | ---- |
| Owner  | ✅   | ✅   | ✅       | ✅   | ✅   |
| Admin  | ✅   | ✅   | ✅       | ❌   | ✅   |
| Editor | ✅   | ✅   | ❌       | ❌   | ❌   |
| Viewer | ✅   | ❌   | ❌       | ❌   | ❌   |

#### API 接口

> ✅ 全部已实现（路径从 `/permissions` 优化为 `/members`，语义更清晰）

**POST /spaces/:id/invitations**

- 功能：创建邀请链接（可选限定邮箱）
- 权限：Owner / Admin
- 请求体：
  ```json
  {
    "email": "user@example.com",  // 可选
    "role": "EDITOR"
  }
  ```
- 响应：返回邀请 token，前端拼成 `/invite/:token` 链接
- 有效期：7 天

**POST /spaces/join**

- 功能：通过邀请 token 加入 Space
- 权限：已登录用户
- 请求体：`{ "token": "invite_token" }`

**GET /spaces/:id/members**

- 功能：获取 Space 成员列表
- 权限：Space 成员（所有角色）

**PATCH /spaces/:id/members/:userId**

- 功能：更新成员角色
- 权限：Owner / Admin
- 限制：不能修改 Space Owner 的角色；Admin 不能提升至 Owner/Admin

**DELETE /spaces/:id/members/:userId**

- 功能：移除成员
- 权限：Owner / Admin
- 限制：不能移除 Space Owner；Admin 不能移除其他 Admin

#### 前端功能

**成员管理页面** (`/spaces/:id/members`) ✅

- 仅 Space 成员可访问
- 成员列表展示：头像、用户名、Email、角色标签、操作按钮
- "邀请成员"按钮（Owner / Admin 可见）

**邀请成员弹窗** (`InviteDialog`) ✅

- 角色选择（Viewer / Editor / Admin）
- 可选邮箱限定
- 生成邀请链接 + 一键复制

**邀请链接接受页** (`/invite/:token`) ✅

- 未登录则重定向到登录页（保留 redirect 参数）
- 登录后展示邀请确认，点击加入跳转到 Space

**成员卡片操作**（Owner / Admin 专属）✅

- 修改角色（下拉选择 + 二次确认弹窗）
- 移除成员（二次确认弹窗）

#### 权限检查

**后端 Guard** ✅

`SpacePermissionGuard` 已实现：
- 支持从 `params.spaceId`、`body.spaceId`、或通过 documentId 反查 spaceId
- GET 请求：公开 Space 允许访问
- POST/PATCH/PUT/DELETE：需要 EDITOR 及以上角色
- Service 层对每个操作独立做细粒度角色校验

**前端权限控制** ✅

- 从 `space.myRole` 判断当前用户角色
- `isReadOnly = myRole === 'VIEWER'`，传入编辑器 `editable={false}`
- 只读模式下：标题禁用、菜单栏隐藏、显示只读徽标
- Hocuspocus 后端在 `onAuthenticate` 设置 `connection.readOnly = true`，网络层阻断非法写入

---

### 2. 私密分享功能（ShareLink）

#### 数据模型

> ✅ 已实现（文档级分享；Space 级分享暂未实现）

```prisma
model ShareLink {
  id          String    @id @default(cuid())
  documentId  String
  token       String    @unique @default(cuid())
  type        ShareType @default(PUBLIC)
  password    String?   // bcrypt 加密
  expiresAt   DateTime?
  viewCount   Int       @default(0)
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  document    Document  @relation(fields: [documentId], references: [id], onDelete: Cascade)
}

enum ShareType {
  PUBLIC
  PASSWORD
}
```

> ⚠️ 与原始设计的差异：
> - 仅支持文档分享，不支持 Space 级分享
> - 无 `createdBy` 字段（未记录创建者）
> - `viewCount` 已提前实现（原计划 Stage 4）

#### API 接口

**POST /share** ✅

- 功能：创建分享链接
- 权限：已登录用户（需对文档有访问权限）
- 请求体：
  ```json
  {
    "documentId": "doc_id",
    "type": "PASSWORD",
    "password": "optional_password",
    "expiresAt": "2026-03-01T00:00:00.000Z"
  }
  ```
- 响应：返回 `ShareLink` 记录，前端拼成 `/share/:token` 链接

**GET /share/:token** ✅

- 功能：获取分享元信息
- 权限：无需登录
- 响应：token、type、documentTitle、expiresAt、hasPassword
- 已过期或不存在：返回 403/404

**POST /share/:token/verify** ✅

- 功能：验证访问密码，返回短效 JWT accessToken（1h）
- 密码正确：返回 `{ accessToken }`
- 密码错误：返回 401

**GET /share/:token/content** ✅

- 功能：获取文档内容
- PUBLIC 类型：无需 accessToken
- PASSWORD 类型：需在 Authorization header 携带 verify 返回的 accessToken
- 响应：title、content、createdAt、updatedAt、creator 信息
- 副作用：自动递增 viewCount

**GET /share/doc/:docId/list** ✅

- 功能：查询某文档的所有分享链接
- 权限：已登录用户（需对文档所在空间有访问权限）
- 响应：分享链接数组（含 id/token/type/expiresAt/viewCount/isActive/isExpired/createdAt）

**DELETE /share/:shareId** ✅

- 功能：删除分享链接
- 权限：已登录用户（需对文档所在空间有访问权限）
- 响应：`{ message: "Share link deleted successfully" }`

#### 前端功能

**分享按钮** ✅

- 位置：文档编辑页右上角 `ShareDialog` 组件
- 所有有文档访问权限的已登录用户均可打开

**分享设置弹窗** (`ShareDialog`) ✅

- 访问模式：直接访问 / 密码访问
- 密码输入框（密码模式下显示）
- 有效期选择：永久 / 1小时 / 1天 / 7天
- 生成链接后展示 URL + 一键复制
- ✅ 分享列表管理（列表视图展示所有分享链接，含类型/有效期/查看次数/状态）
- ✅ 删除分享链接（每条链接提供删除按钮，即时生效）
- ⚠️ 暂不支持"分享整个工作空间"选项

**分享链接访问页** (`/share/:token`) ✅

- **无密码**：直接展示文档（只读 SimpleEditor）+ 底部元数据（作者、创建时间、更新时间）
- **有密码**：密码验证页 → 验证通过后加载内容
- **已过期/无效**：错误提示页

#### 安全措施

| 措施 | 状态 | 备注 |
|------|------|------|
| Token 随机性 | ✅ | 使用 `cuid()` 生成，不可预测 |
| 密码 bcrypt 加密 | ✅ | salt rounds: 10 |
| 访问 Token 短效 | ✅ | JWT 1h 有效期 |
| Rate Limiting | ✅ | `@nestjs/throttler` 全局 60次/分钟 + 密码验证 5次/5分钟 |
| Fastify 适配 | ✅ | 自定义 `FastifyThrottlerGuard` 适配 Fastify req.ip |
| 连续错误 IP 封禁 | ⚠️ | 通过 Rate Limiting 间接实现，未独立 IP 黑名单 |

---

## 技术实现要点

### 权限检查中间件

> ✅ 已实现，位于 `apps/api/src/common/guards/space-permission.guard.ts`

```typescript
@Injectable()
export class SpacePermissionGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 支持从 params.spaceId、body.spaceId 或通过 documentId 反查
    // GET + 公开 Space → 直接放行
    // POST/PATCH/PUT/DELETE → 需要 EDITOR 及以上角色
    // Service 层对关键操作额外做细粒度校验
  }
}
```

### 分享链接访问流程

> ✅ 已实现

```
User                  Server
 |                       |
 |-- GET /share/xxx ---> |
 |                       | 1. 查找 ShareLink
 |                       | 2. 检查是否过期 / isActive
 |                       | 3. 返回元信息（含 type）
 |<-- { type, hasPassword } --|
 |
 | [如果 PASSWORD]
 |-- POST /share/xxx/verify --> |
 | { password }                 | 4. bcrypt 验证
 |                               | 5. 签发短效 JWT
 |<-- { accessToken } ----------|
 |
 |-- GET /share/xxx/content --> |
 | Bearer accessToken           | 6. 验证 JWT sub === shareId
 |<-- { title, content, ... } --| 7. 返回内容 + 递增 viewCount
```

---

## 验收标准

### 权限管理

- ✅ Owner / Admin 可以邀请成员（生成邀请链接）
- ✅ Owner / Admin 可以修改成员角色（含二次确认）
- ✅ Owner / Admin 可以移除成员（含二次确认）
- ✅ Editor 可以编辑文档，但不能管理成员
- ✅ Viewer 只能查看，不能编辑（前后端双重保护）
- ✅ 权限检查在前后端都生效（Guard + Hocuspocus readOnly）

### 私密分享

- ✅ 可以为文档生成分享链接（PUBLIC / PASSWORD）
- ✅ 可以设置访问密码（bcrypt 加密存储）
- ✅ 可以设置有效期
- ✅ 密码验证正确工作（bcrypt 比对 + 短效 JWT）
- ✅ 过期链接无法访问（前后端均返回错误页）
- ✅ 分享链接列表查询（`GET /share/doc/:docId/list`）
- ✅ 删除分享链接（`DELETE /share/:shareId`）
- ✅ 防暴力破解（`@nestjs/throttler` 全局限流 + 密码验证 5次/5分钟/IP）
- ✅ 前端分享管理 UI（列表视图 + 创建 + 复制链接 + 删除）

---

## 已补充完成的功能

1. ✅ **分享链接列表查询** — `GET /share/doc/:docId/list` 接口 + 前端 ShareDialog 列表视图
2. ✅ **删除分享链接** — `DELETE /share/:shareId` 接口 + 前端删除按钮
3. ✅ **Rate Limiting 防暴力破解** — `@nestjs/throttler` 全局 60次/分钟，密码验证 5次/5分钟/IP，自定义 `FastifyThrottlerGuard`

## 后续可扩展

1. **Space 级分享** — 当前仅支持文档分享，如需分享整个 Space，需扩展 `ShareLink` 模型增加 `spaceId` 字段
2. **独立 IP 黑名单** — 超过阈值自动封禁 IP（当前通过 Rate Limiting 间接实现）

---

## 已完成的其他 Stage 3 相关功能

1. ✅ 🕒 版本历史与回滚机制 (Version History UI) - 完成度 100%
   当前状态：已完成后端自动快照生成（支持内容变更时自动防抖存盘以及每小时自动生成快照逻辑），并且前端已于侧边栏展示历史记录。
   达成特性：侧边栏支持查看快照时间与创建者备注，并且可以通过 Tiptap 只读预览弹窗看到对应历史节点的内容，一键恢复到历史版本。

2. ✅ 🔌 离线编辑支持与秒开体验 (Offline Support & Local Caching) - 完成度 100%
   当前状态：已引入 y-indexeddb，一打开页面，文档将瞬间从本地数据库读出先渲染出来并允许用户操作。后台会在连接 WebSocket 时把增量变更用 CRDT 算法默默合进去。

3. ✅ 🖼️ 图片与附件同步上传服务 (Image Upload & MinIO) - 完成度 100%
   当前状态：已实现 FilesModule 和真实的文件上传接口（MinIO/S3兼容），完美接管 handleImageUpload 钩子，图片能直接持久化上传并在所有协作者终端广播显示。

4. ✅ 🗨️ 行内划线评论 - 完成度 100%
   当前状态：已实现企业级文档行内评论功能。划过一段文字即可在侧边弹出浮窗进行留言评论，所有参与者可在评论线程下回复，支持解决/删除评论，评论数据持久化存储于 `commentsData` 字段。

5. ✅ 🔒 正式上线级别的只读权限校验 (Permissions Integration) - 完成度 100%
   当前状态：已完成对 VIEWER 角色的限制。
   达成特性：前端会获取当前用户在空间的角色并向编辑器传入 `editable={false}`，同时隐藏菜单栏、禁用标题和显示只读徽标。后台 Hocuspocus 在 `onAuthenticate` 事件中已经针对 VIEWER 开启了 `connection.readOnly = true`，能从网络层拒收一切二进制非法写入包，实现了真正无死角的只读保护。

---

## 下一步

完成 Stage 3 剩余待补充功能后，进入 **Stage 4: 高级功能**，实现更多高级协作与数据洞察功能。 