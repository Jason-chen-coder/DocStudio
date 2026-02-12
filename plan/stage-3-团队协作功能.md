# Stage 3: 团队协作功能

**状态**: 👥 待开发  
**预计时间**: 3-4 周  
**目标**: 支持团队内部协作和私密分享

---

## 概述

Stage 3 实现完整的团队协作功能，包括细粒度权限管理和灵活的私密分享机制。让团队可以安全地协作，同时也能将私有内容临时分享给外部人员。

---

## 功能清单

### 1. 团队权限管理

#### 数据模型

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
  OWNER
  EDITOR
  VIEWER
}
```

#### 权限说明

| 角色   | 读取 | 写入 | 邀请成员 | 删除 | 设置 |
| ------ | ---- | ---- | -------- | ---- | ---- |
| Owner  | ✅   | ✅   | ✅       | ✅   | ✅   |
| Editor | ✅   | ✅   | ❌       | ❌   | ❌   |
| Viewer | ✅   | ❌   | ❌       | ❌   | ❌   |

#### API 接口

**POST /spaces/:id/permissions**

- 功能：邀请成员加入 Space
- 权限：Owner
- 请求体：
  ```json
  {
    "email": "user@example.com",
    "role": "editor"
  }
  ```
- 业务逻辑：
  - 查找用户（通过 email）
  - 检查用户是否已在 Space 中
  - 创建 SpacePermission 记录
  - 发送邀请通知（可选）

**GET /spaces/:id/permissions**

- 功能：获取 Space 成员列表
- 权限：Space 成员
- 响应：
  ```json
  [
    {
      "id": "perm_id",
      "user": {
        "id": "user_id",
        "name": "张三",
        "email": "zhang@example.com"
      },
      "role": "owner",
      "createdAt": "2026-01-01T00:00:00.000Z"
    }
  ]
  ```

**PATCH /spaces/:id/permissions/:userId**

- 功能：更新成员角色
- 权限：Owner
- 请求体：
  ```json
  {
    "role": "viewer"
  }
  ```
- 限制：不能修改自己的角色

**DELETE /spaces/:id/permissions/:userId**

- 功能：移除成员
- 权限：Owner
- 限制：不能移除自己（Owner）

#### 前端功能

**成员管理页面** (`/spaces/:id/members`)

- 仅 Space 成员可访问
- 成员列表展示：
  - 头像、用户名、Email
  - 角色标签
  - 加入时间
  - 操作按钮（Owner 可见）
- "邀请成员"按钮（Owner 可见）

**邀请成员弹窗**

- Email 输入框（支持多个 Email）
- 角色选择（Editor/Viewer）
- 发送邀请按钮
- 显示邀请结果

**成员卡片操作**（Owner 专属）

- 修改角色（下拉选择）
- 移除成员（需确认）

#### 权限检查

**后端 Guard**

```typescript
// 示例：检查用户是否有 Editor 权限
@UseGuards(JwtAuthGuard, SpacePermissionGuard)
@Permissions('editor', 'owner')
@Post('/spaces/:spaceId/docs')
async createDocument() {
  // ...
}
```

**前端权限控制**

```typescript
// 示例：根据角色显示/隐藏按钮
{hasRole(['owner', 'editor']) && (
  <Button onClick={createDocument}>新建文档</Button>
)}

{hasRole('owner') && (
  <Button onClick={inviteMember}>邀请成员</Button>
)}
```

---

### 2. 私密分享功能（ShareToken）

#### 数据模型

```prisma
model ShareToken {
  id        String     @id @default(cuid())
  token     String     @unique @default(cuid())
  type      ShareType
  spaceId   String?
  space     Space?     @relation(fields: [spaceId], references: [id], onDelete: Cascade)
  docId     String?
  document  Document?  @relation(fields: [docId], references: [id], onDelete: Cascade)
  password  String?    // bcrypt 加密
  expiresAt DateTime?
  createdBy String
  creator   User       @relation(fields: [createdBy], references: [id])
  createdAt DateTime   @default(now())

  @@index([token])
  @@index([spaceId])
  @@index([docId])
}

enum ShareType {
  SPACE
  DOCUMENT
}
```

#### API 接口

**POST /share**

- 功能：创建分享链接
- 权限：Space Owner
- 请求体：
  ```json
  {
    "type": "document",
    "docId": "doc_id",
    "password": "optional_password",
    "expiresAt": "2026-03-01T00:00:00.000Z"
  }
  ```
- 响应：
  ```json
  {
    "id": "share_id",
    "token": "abc123xyz",
    "url": "https://docstudio.com/share/abc123xyz",
    "expiresAt": "2026-03-01T00:00:00.000Z",
    "hasPassword": true
  }
  ```

**GET /share/:token**

- 功能：访问分享内容
- 权限：无需登录
- 响应：
  - 如果有密码：返回密码验证页面
  - 如果已过期：返回错误
  - 如果正常：返回内容

**POST /share/:token/verify**

- 功能：验证访问密码
- 请求体：
  ```json
  {
    "password": "user_input_password"
  }
  ```
- 响应：
  - 成功：返回访问令牌（临时）
  - 失败：返回错误

**GET /spaces/:spaceId/shares** 或 **GET /docs/:docId/shares**

- 功能：获取我创建的分享链接
- 权限：Space Owner
- 响应：分享链接列表

**DELETE /share/:shareId**

- 功能：删除分享链接
- 权限：创建者或 Space Owner

#### 前端功能

**分享按钮**

- 位置：Space 详情页、文档编辑页右上角
- 仅 Owner 可见
- 点击打开分享设置弹窗

**分享设置弹窗**

- 分享范围选择：
  - ○ 当前文档
  - ○ 整个工作空间
- 访问密码（可选）：
  - ☐ 设置访问密码
  - 密码输入框（勾选后显示）
- 有效期选择：
  - ○ 永久有效
  - ○ 7 天后过期
  - ○ 30 天后过期
  - ○ 自定义（日期选择器）
- 生成链接按钮
- 已生成的链接展示：
  - 链接 URL
  - 复制按钮
  - 二维码（可选）
  - 访问统计（可选，Stage 4）
  - 删除按钮

**分享链接访问页** (`/share/:token`)

**无密码情况**：

- 直接显示内容（类似公开访问页面）
- 顶部提示："这是一个临时分享链接"

**有密码情况**：

```
┌─────────────────────────────┐
│ 🔒 此内容受密码保护          │
│                             │
│ 请输入访问密码：             │
│ [____________]              │
│                             │
│       [访问内容]             │
│                             │
│ 由 DocStudio 提供支持        │
└─────────────────────────────┘
```

**已过期**：

```
┌─────────────────────────────┐
│ ⏰ 链接已过期                │
│                             │
│ 此分享链接已经失效           │
│ 请联系分享者获取新链接       │
│                             │
│       [返回首页]             │
└─────────────────────────────┘
```

#### 安全措施

**防暴力破解**

- Rate Limiting：同一 IP 5 分钟内最多尝试 5 次
- 密码错误延迟：每次错误后增加响应延迟
- 临时封禁：连续 10 次错误后封禁 IP 1 小时

**Token 安全**

- 使用 `nanoid` 或 `cuid` 生成随机 token
- Token 长度至少 20 字符
- 不可预测

**密码存储**

- bcrypt 加密（salt rounds: 10）
- 不存储明文密码

---

## 技术实现要点

### 权限检查中间件

```typescript
// SpacePermissionGuard
@Injectable()
export class SpacePermissionGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const spaceId = request.params.spaceId;
    const requiredRoles = this.reflector.get<Role[]>('roles', context.getHandler());

    const permission = await this.permissionService.findOne(user.id, spaceId);

    if (!permission) return false;
    if (!requiredRoles) return true;

    return requiredRoles.includes(permission.role);
  }
}
```

### 分享链接访问流程

```
User                  Server
 |                       |
 |-- GET /share/xxx ---> |
 |                       | 1. 查找 ShareToken
 |                       | 2. 检查是否过期
 |                       | 3. 检查是否有密码
 |<-- 密码验证页 -------- | (有密码)
 |                       |
 |-- POST verify ------> |
 | { password }          | 4. 验证密码
 |                       | 5. 生成临时访问令牌
 |<-- { access_token } - |
 |                       |
 |-- GET content ------> |
 | Bearer access_token   | 6. 返回内容
 |<-- 内容 -------------- |
```

---

## 验收标准

### 权限管理

- ✅ Owner 可以邀请成员
- ✅ Owner 可以修改成员角色
- ✅ Owner 可以移除成员
- ✅ Editor 可以编辑文档，但不能管理成员
- ✅ Viewer 只能查看，不能编辑
- ✅ 权限检查在前后端都生效

### 私密分享

- ✅ 可以为 Space/Document 生成分享链接
- ✅ 可以设置访问密码
- ✅ 可以设置有效期
- ✅ 密码验证正确工作
- ✅ 过期链接无法访问
- ✅ 可以删除分享链接
- ✅ 防暴力破解机制生效

---

## 下一步

完成 Stage 3 后，进入 **Stage 4: 高级功能**，实现实时协作、文件上传和版本历史功能。
