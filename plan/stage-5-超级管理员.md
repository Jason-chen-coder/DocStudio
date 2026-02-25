# Stage 5: 超级管理员系统

**状态**: ✅ 已完成  
**完成时间**: 2026-02-25  
**目标**: 为平台提供全局管理能力，超级管理员拥有普通用户的所有功能，并在此基础上拥有专属的管理控制台

---

## 概述

超级管理员（Super Admin）是 DocStudio 平台级别的最高权限角色。与空间级角色（Owner/Admin/Editor/Viewer）不同，超级管理员是**系统级全局角色**，不受任何空间权限约束，可以跨空间管理所有资源和用户。

超级管理员在使用体验上与普通用户完全兼容 —— 他们同样可以创建空间、编辑文档、使用所有普通功能；在此之上，他们多了一个专属的「管理控制台」入口。

---

## 一、需求分析

### 1.1 角色定义

| 项目       | 普通用户                 | 超级管理员                          |
| ---------- | ------------------------ | ----------------------------------- |
| 基础功能   | ✅ 完整使用              | ✅ 完整使用（继承普通用户所有功能） |
| 空间权限   | 基于空间角色（Owner 等） | 全局超越，可访问所有空间            |
| 管理控制台 | ❌ 无                    | ✅ 专属管理控制台入口               |
| 创建方式   | 注册                     | 系统配置 / 管理员手动提升           |

### 1.2 MVP 功能范围（当前 Stage）

- **用户管理**（本 Stage 重点）：
  - 查看全平台所有用户列表
  - 搜索用户（用户名 / 姓名）
  - 按空间筛选用户
  - 查看用户详情
  - 修改用户密码
  - 禁用/启用用户账号
  - 删除用户账号
- **管理控制台导航**：专属侧边栏目录，与普通用户侧边栏区分

### 1.3 未来扩展（后续 Stage 可添加）

- 空间管理（查看任意空间及空间下的文档）
- 系统设置（注册开关、存储配置等）
- 操作审计日志
- 统计看板（用户数、文档数、活跃度等）

---

## 二、数据模型设计

### 2.1 User 模型扩展

在现有 `User` 模型上新增两个字段：

```prisma
model User {
  id          String   @id @default(cuid())
  email       String   @unique
  name        String
  password    String?
  avatarUrl   String?
  // ✨ 新增字段
  isSuperAdmin Boolean  @default(false)   // 是否超级管理员
  isDisabled   Boolean  @default(false)   // 是否被禁用
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // 关系（不变）
  ownedSpaces      Space[]           @relation("SpaceOwner")
  spacePermissions SpacePermission[]
  createdDocuments Document[]        @relation("DocumentCreator")
  invitationsSent  SpaceInvitation[] @relation("InvitationSender")

  @@map("users")
}
```

**字段说明**：

| 字段           | 类型      | 默认值  | 说明                                 |
| -------------- | --------- | ------- | ------------------------------------ |
| `isSuperAdmin` | `Boolean` | `false` | 平台级超级管理员标识，非空间角色     |
| `isDisabled`   | `Boolean` | `false` | 禁用后用户无法登录，所有请求均被拒绝 |

> **设计决策**：使用字段而非独立角色表，保持简洁。超级管理员身份与空间角色系统完全解耦，互不影响。

### 2.2 数据库迁移

```prisma
-- 迁移名: add_super_admin_and_disabled_to_users
ALTER TABLE "users" ADD COLUMN "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "isDisabled" BOOLEAN NOT NULL DEFAULT false;
```

```bash
npx prisma migrate dev --name add_super_admin_and_disabled_to_users
```

---

## 三、后端 API 设计

### 3.1 认证与鉴权

#### SuperAdminGuard

新增一个专属 Guard，用于保护所有管理员 API：

```typescript
// apps/api/src/common/guards/super-admin.guard.ts
@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // 来自 JwtAuthGuard
    if (!user || !user.isSuperAdmin) {
      throw new ForbiddenException('仅超级管理员可访问');
    }
    return true;
  }
}
```

所有管理员接口使用双重 Guard：

```typescript
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('admin')
export class AdminController {}
```

#### 禁用用户检查

在 JWT 验证逻辑中，需额外检查用户是否被禁用：

```typescript
// jwt.strategy.ts
async validate(payload: JwtPayload) {
  const user = await this.usersService.findById(payload.sub);
  if (!user) throw new UnauthorizedException();
  if (user.isDisabled) throw new ForbiddenException('账号已被禁用，请联系管理员');
  return user;
}
```

#### isSuperAdmin 需在认证响应中返回

前端侧边栏、路由守卫等均依赖 `isSuperAdmin` 字段来判断是否展示管理控制台。因此，以下两处必须携带该字段：

- **JWT Payload**：`sub`（userId）+ `isSuperAdmin: boolean`
- **`GET /auth/me`（或等效的「获取当前用户」接口）** 的响应中包含 `isSuperAdmin` 字段

```typescript
// jwt.strategy.ts — validate 返回值
return {
  id: user.id,
  email: user.email,
  name: user.name,
  isSuperAdmin: user.isSuperAdmin, // ✨ 必须携带
  isDisabled: user.isDisabled,
};
```

> **注意**：`isDisabled` 和 `isSuperAdmin` 不应放进 JWT Payload 本身（避免 Token 过期前状态不同步），应每次请求时从数据库实时读取（即在 `validate` 方法中查库）。

### 3.2 API 接口清单

> [!IMPORTANT]
> **所有 `/admin/*` 接口，无一例外，必须同时通过两层鉴权：**
>
> 1. `JwtAuthGuard` —— 验证用户已登录（Token 合法且账号未被禁用）
> 2. `SuperAdminGuard` —— 验证当前用户 `isSuperAdmin === true`
>
> 以上两层 Guard 统一挂载在 `AdminController` 类级别，**无需在每个方法上单独声明**。任何绕过 Guard 的写法（如 `@Public()` 装饰器）在 `/admin` 模块中均被禁止。非超管调用时一律返回 `403 Forbidden`。

---

#### 3.2.1 用户列表

**GET /admin/users**

查询全平台用户列表，支持分页、搜索、按空间筛选。

**查询参数**：

| 参数      | 类型     | 必填 | 说明                                           |
| --------- | -------- | ---- | ---------------------------------------------- |
| `page`    | `number` | 否   | 页码，默认 1                                   |
| `limit`   | `number` | 否   | 每页数量，默认 20，最大 100                    |
| `search`  | `string` | 否   | 搜索关键词，匹配 `name` 或 `email`（模糊搜索） |
| `spaceId` | `string` | 否   | 按空间筛选，返回该空间下的所有成员             |

**响应示例**：

```json
{
  "data": [
    {
      "id": "user_id",
      "email": "zhang@example.com",
      "name": "张三",
      "avatarUrl": "https://...",
      "isSuperAdmin": false,
      "isDisabled": false,
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-15T00:00:00.000Z",
      "spaceCount": 2,
      "documentCount": 35
    }
  ],
  "total": 128,
  "page": 1,
  "limit": 20
}
```

> **性能说明**：列表接口只返回 `spaceCount`（数量）而非完整 `spaces` 数组，避免数据量过大。完整的空间列表由「用户详情」接口（`GET /admin/users/:userId`）返回。

**业务逻辑**：

- `search` 对 `name` 和 `email` 同时做 `ILIKE` 模糊匹配
- `spaceId` 不为空时，通过 `SpacePermission` 关联表筛选
- 超管账号本身**也会出现在列表中**，状态标签显示为 `👑 超管`，禁用/删除操作对其置灰
- 按 `createdAt` 倒序排列

---

#### 3.2.2 用户详情

**GET /admin/users/:userId**

**响应**：在列表单项基础上，将 `spaceCount` 替换为完整的 `spaces` 数组（含每个空间的名称和用户角色）。

**错误响应**：用户不存在时返回 `404 Not Found`。

---

#### 3.2.3 修改用户密码

**PATCH /admin/users/:userId/password**

管理员直接为指定用户设置新密码（无需知道旧密码）。

**请求体**：

```json
{
  "newPassword": "NewSecurePassword123"
}
```

**业务逻辑**：

- 密码需满足强度要求（至少 8 位）
- 使用 bcrypt 加密存储（与注册流程一致）
- 操作成功后，该用户现有 JWT Token 不会立即失效（无状态设计）；可选：写入黑名单（Redis）使旧 Token 失效

**响应**：

```json
{
  "message": "密码修改成功"
}
```

---

#### 3.2.4 禁用/启用用户

**PATCH /admin/users/:userId/status**

**请求体**：

```json
{
  "isDisabled": true
}
```

**业务逻辑**：

- **MVP 策略**：禁用在用户**下次发起请求时生效**——`JwtStrategy.validate()` 每次都查库并检查 `isDisabled`，无需 Redis。这对 MVP 足够，后续可按需升级为 Redis 黑名单以实现秒级踢出。
- **保护机制**：不允许禁用其他超级管理员；不允许禁用自己；违规时返回 `403 Forbidden`
- **错误响应**：用户不存在时返回 `404 Not Found`

**响应**：

```json
{
  "message": "用户已禁用",
  "isDisabled": true
}
```

---

#### 3.2.5 删除用户

**DELETE /admin/users/:userId**

**业务逻辑**：

- **硬删除**将级联删除该用户所有数据（由 Prisma `onDelete: Cascade` 保证）
- **保护机制**：不允许删除其他超级管理员；不允许删除自己；违规时返回 `403 Forbidden`
- 建议优先使用禁用而非删除，删除为不可逆操作

**错误响应**：

| 情况         | HTTP 状态码     |
| ------------ | --------------- |
| 用户不存在   | `404 Not Found` |
| 尝试删除超管 | `403 Forbidden` |
| 尝试删除自己 | `403 Forbidden` |

**响应**：

```json
{
  "message": "用户已删除"
}
```

---

#### 3.2.6 空间列表（用于筛选下拉框）

**GET /admin/spaces**

返回所有空间的简洁列表，供前端「按空间筛选」下拉框使用。

**查询参数**：`search`（可选，按名称搜索）

**响应示例**：

```json
[
  { "id": "space_id", "name": "张三的知识库", "memberCount": 5 },
  { "id": "space_id_2", "name": "前端团队文档", "memberCount": 12 }
]
```

---

### 3.3 模块结构

```
apps/api/src/
└── admin/
    ├── admin.module.ts
    ├── admin.controller.ts
    ├── admin.service.ts
    ├── admin-bootstrap.service.ts     # 启动自动初始化超管
    └── dto/
        ├── admin-user-query.dto.ts    # 查询参数 DTO
        ├── update-user-password.dto.ts
        └── update-user-status.dto.ts
```

---

## 四、前端设计

### 4.1 导航结构

超级管理员登录后，侧边栏在普通功能区域之下，新增一个**「管理控制台」分区**：

```
┌─────────────────────────────────────────┐
│  DocStudio                    🔔  👤    │
├─────────────────────────────────────────┤
│  📁 我的空间                             │
│  📄 最近文档                             │
│  ⚙️  设置                                │
│                                         │
│  ─────── 管理控制台 ───────              │
│  👥 用户管理                    ◀  本期  │
│  🏢 空间管理（待规划）                   │
│  📊 数据统计（待规划）                   │
│  🔍 审计日志（待规划）                   │
└─────────────────────────────────────────┘
```

- 「管理控制台」分区仅当 `currentUser.isSuperAdmin === true` 时渲染
- 菜单入口路由：`/admin/users`、`/admin/spaces` 等

### 4.2 路由规划

```
/admin                  → 重定向到 /admin/users
/admin/users            → 用户管理页面
/admin/users/:userId    → 用户详情（可选，抽屉或弹窗形式）
```

前端路由守卫：访问 `/admin/*` 时检查 `isSuperAdmin`，否则重定向到首页。

### 4.3 用户管理页面（/admin/users）

#### 页面布局

```
┌────────────────────────────────────────────────────────────────────┐
│  用户管理                                              共 128 位用户  │
├──────────────────┬──────────────────────┬──────────────────────────│
│  🔍 搜索用户...   │  📁 按空间筛选 ▼     │              [+ 暂无新增]  │
├──────────────────┴──────────────────────┴──────────────────────────│
│  用户名     邮箱              所属空间       状态    加入时间   操作  │
│  ──────────────────────────────────────────────────────────────── │
│  张三       zh@ex.com        知识库(Owner)  ● 正常  2026-01-01  … │
│  李四       li@ex.com        前端团队(Editor) ⊘ 禁用 2026-01-10  … │
│  ...                                                               │
├──────────────────────────────────────────────────────────────────│
│  ← 上一页   第 1 / 7 页   下一页 →                                  │
└────────────────────────────────────────────────────────────────────┘
```

#### 交互设计

**搜索框**

- 实时搜索（防抖 300ms），同时匹配 `name` 和 `email`
- 搜索关键词高亮显示

**空间筛选下拉框**

- 下拉选项动态从 `GET /admin/spaces` 加载
- 支持输入搜索空间名
- 选中某空间后，列表只展示该空间的成员
- 搜索 + 空间筛选可叠加使用

**用户状态标签**

- `● 正常`（绿色）/ `⊘ 禁用`（灰色）/ `👑 超管`（金色）

**操作菜单（每行末尾 `…` 按钮，下拉菜单）**

| 操作     | 图标 | 触发条件                  | 二次确认                     |
| -------- | ---- | ------------------------- | ---------------------------- |
| 查看详情 | 👁   | 始终显示                  | 无                           |
| 修改密码 | 🔑   | 始终显示                  | 弹窗输入新密码               |
| 禁用账号 | ⊘    | `isDisabled === false` 时 | 简单确认弹窗                 |
| 启用账号 | ✅   | `isDisabled === true` 时  | 无                           |
| 删除用户 | 🗑   | 始终显示（标红危险操作）  | 强确认弹窗（输入用户名确认） |

**保护规则（前端同步后端）**：

- 超级管理员不能对其他超级管理员执行禁用/删除操作
- 不能对自己执行禁用/删除操作
- 上述受保护的操作项置灰并 tooltip 提示原因

### 4.4 弹窗设计

#### 修改密码弹窗

```
┌─────────────────────────────────┐
│  修改用户密码                 ✕  │
│                                 │
│  用户：张三 (zh@ex.com)          │
│                                 │
│  新密码 *                        │
│  [ _____________ ] 👁           │
│                                 │
│  确认新密码 *                    │
│  [ _____________ ] 👁           │
│                                 │
│  管理员直接设置，无需原密码       │
│                                 │
│            [取消]  [确认修改]     │
└─────────────────────────────────┘
```

> 两次密码输入不一致时，「确认修改」按钮禁用并在第二个输入框下方展示错误提示。

#### 删除用户强确认弹窗

```
┌─────────────────────────────────┐
│  ⚠️  危险操作：删除用户        ✕  │
│                                 │
│  此操作将永久删除用户「张三」    │
│  及其所有数据，包括：            │
│  • 2 个工作空间                  │
│  • 35 篇文档                     │
│                                 │
│  请输入用户名以确认：            │
│  [ _____________ ]              │
│                                 │
│         [取消]  [永久删除]       │
└─────────────────────────────────┘
```

### 4.5 组件与文件结构

```
apps/web/src/
├── app/
│   └── admin/
│       ├── layout.tsx            # 管理端 Layout（含超管鉴权守卫）
│       ├── page.tsx              # 重定向到 /admin/users
│       └── users/
│           ├── page.tsx          # 用户管理主页面
│           └── _components/
│               ├── UserTable.tsx           # 用户列表表格
│               ├── UserSearchBar.tsx       # 搜索框
│               ├── SpaceFilterSelect.tsx   # 空间筛选下拉
│               ├── UserActionMenu.tsx      # 操作下拉菜单
│               ├── ChangePasswordModal.tsx # 修改密码弹窗
│               ├── DisableUserModal.tsx    # 禁用确认弹窗
│               └── DeleteUserModal.tsx     # 删除强确认弹窗
└── lib/
    └── api/
        └── admin.ts              # 管理员 API 客户端方法
```

**侧边栏更新**（`components/sidebar.tsx`）：

```tsx
{
  user?.isSuperAdmin && (
    <SidebarSection title="管理控制台">
      <SidebarItem href="/admin/users" icon={<UsersIcon />}>
        用户管理
      </SidebarItem>
      {/* 未来菜单项在此扩展 */}
    </SidebarSection>
  );
}
```

---

## 五、安全设计

### 5.1 权限层次

```
超级管理员 (isSuperAdmin)
    └── 系统级权限，覆盖所有资源
        ├── 管理所有用户
        ├── 访问所有空间（只读或写入，视需求定）
        └── 所有普通用户功能

普通用户
    └── 空间级权限 (Role: OWNER/ADMIN/EDITOR/VIEWER)
        └── 仅在所属空间内有效
```

### 5.2 保护规则

| 操作         | 规则                                             |
| ------------ | ------------------------------------------------ |
| 禁用用户     | 不能禁用其他超管；不能禁用自己                   |
| 删除用户     | 不能删除其他超管；不能删除自己                   |
| 修改用户密码 | 可对任意用户（包括超管）修改，但建议记录审计日志 |
| 提升超管权限 | 本期不提供 API，仅通过数据库直接操作或初始化脚本 |

### 5.3 超级管理员初始化

#### 环境变量配置

超级管理员的账号和密码通过环境变量配置，两者均有默认值：

```env
# .env / .env.example
SUPER_ADMIN_EMAIL=admin@doc-studio   # 默认值，合法 email 格式（同时作为 name 显示）
SUPER_ADMIN_PASSWORD=admin          # 默认值：admin
```

> **为什么是 `admin@doc-studio` 而非 `admin`？**
> `User.email` 在数据库中有 `@unique` 约束，同时注册/创建流程通常对 email 格式做校验。`admin` 不是合法 email，会导致创建失败或绕过 DTO 验证。使用 `admin@doc-studio` 是常见的本地开发惯例，在生产环境请通过环境变量替换为真实 email。

> [!CAUTION]
> 默认凭据 `admin/admin` 仅供本地开发使用，**生产环境必须通过环境变量覆盖**。

#### 系统启动自动初始化

在 API 服务启动时（`onApplicationBootstrap` 生命周期钩子），自动检查并创建超级管理员：

```typescript
// apps/api/src/admin/admin-bootstrap.service.ts
@Injectable()
export class AdminBootstrapService implements OnApplicationBootstrap {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService
  ) {}

  async onApplicationBootstrap() {
    // 检查是否已存在超级管理员，存在则直接跳过
    const existingSuperAdmin = await this.prisma.user.findFirst({
      where: { isSuperAdmin: true },
    });
    if (existingSuperAdmin) return;

    // 读取环境变量，使用默认值兜底
    const email = this.configService.get('SUPER_ADMIN_EMAIL', 'admin');
    const rawPassword = this.configService.get('SUPER_ADMIN_PASSWORD', 'admin');

    // 密码加密方式与普通用户注册完全一致（bcrypt）
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    await this.prisma.user.create({
      data: {
        email,
        name: email, // name 与 email 保持一致
        password: hashedPassword,
        isSuperAdmin: true,
        // isDisabled 默认 false，无需显式指定
      },
    });

    console.log(`[Bootstrap] 超级管理员账号已创建，邮箱: ${email}`);
  }
}
```

**核心逻辑**：

- 启动时查询 `isSuperAdmin = true` 的用户，**已存在则跳过**，不覆盖
- 不存在时读取环境变量（`SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD`），均有默认值 `admin`
- 密码使用 **bcrypt hash**（salt rounds: 10），与普通用户注册流程完全一致
- 该 Service 注册在 `AdminModule` 中，随服务启动自动执行，无需手动脚本

---

## 六、验收标准

### 数据层

- ✅ `User` 表新增 `isSuperAdmin`、`isDisabled` 字段
- ✅ 数据库迁移成功执行

### 启动初始化

- ✅ 首次启动（无超管账号）时，自动创建默认超管（`admin@doc-studio` / `admin`）
- ✅ 再次启动（超管已存在）时，跳过创建，无副作用
- ✅ 通过环境变量可自定义超管 email 和密码
- ✅ 超管密码以 bcrypt 形式存储，与普通用户一致

### 认证层

- ✅ 被禁用的用户登录或发送请求时，收到明确错误提示（403）
- ✅ 非超管访问 `/admin/*` 接口时，收到 403 错误
- ✅ `GET /auth/me`（当前用户信息接口）响应中包含 `isSuperAdmin` 字段

### API 层

- ✅ `GET /admin/users` 支持分页、`search`、`spaceId` 筛选，返回 `spaceCount` 而非完整 spaces 数组
- ✅ `GET /admin/users/:id` 返回完整 spaces 列表；用户不存在时返回 404
- ✅ `GET /admin/spaces` 返回所有空间列表
- ✅ `PATCH /admin/users/:id/password` 成功修改密码
- ✅ `PATCH /admin/users/:id/status` 成功禁用/启用用户；操作超管/自己时返回 403；用户不存在返回 404
- ✅ `DELETE /admin/users/:id` 成功删除用户（级联删除数据）；操作超管/自己时返回 403；用户不存在返回 404
- ✅ 上述接口对非超管均返回 403

### 前端层

- ✅ 普通用户侧边栏不显示「管理控制台」入口
- ✅ 超管可以看到并访问「管理控制台 > 用户管理」
- ✅ 用户列表分页、搜索、空间筛选均正常工作
- ✅ 搜索同时匹配姓名和邮箱
- ✅ 空间筛选下拉加载正确的空间列表
- ✅ 修改密码弹窗功能正常
- ✅ 禁用/启用用户操作后，列表状态实时更新
- ✅ 删除用户需输入用户名确认，确认后执行删除
- ✅ 对超管/自己的受保护操作项置灰并提示原因
- ✅ 直接访问 `/admin/*` 的非超管用户被重定向

---

## 七、开发顺序建议

1. **数据库迁移**：添加 `isSuperAdmin` 和 `isDisabled` 字段
2. **后端鉴权**：实现 `SuperAdminGuard`，更新 `JwtStrategy.validate()` 实时查库检查 `isDisabled`，并在 `auth/me` 响应中返回 `isSuperAdmin`
3. **后端 API**：实现 `AdminModule`（用户列表、详情、修改密码、禁用、删除）
4. **启动自动初始化**：实现 `AdminBootstrapService`，服务启动时幂等地创建默认超管
5. **前端路由**：创建 `/admin` 布局和路由守卫
6. **前端核心**：实现用户管理页面（表格、搜索、筛选）
7. **前端交互**：实现各操作弹窗（修改密码含二次确认、禁用确认、删除强确认）
8. **侧边栏更新**：超管可见的「管理控制台」分区

---

## 下一步

完成 Stage 5 后，可在管理控制台中持续扩展：

- **空间管理**：查看/删除任意空间，强制修改空间设置
- **系统配置**：开关注册功能、配置存储、维护模式
- **审计日志**：记录所有管理员操作
- **数据统计看板**：用户增长、活跃度、文档数量等指标
