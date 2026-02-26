# Stage 1: 核心基础功能

**状态**: 🏗️ 待开发  
**预计时间**: 4-6 周  
**目标**: 搭建产品骨架，实现单用户文档编辑功能

---

## 概述

Stage 1 是产品的核心基础阶段，将实现工作空间管理、文档 CRUD、富文本编辑器和文档树导航等核心功能。此阶段完成后，用户可以创建自己的工作空间，在其中创建和编辑文档，但暂时不支持多人实时协作。

---

## 功能清单

### 1. Space 工作空间管理

#### 数据模型

```prisma
model Space {
  id          String    @id @default(cuid())
  name        String
  description String?   // 工作空间描述
  isPublic    Boolean   @default(false) // 是否公开
  ownerId     String
  owner       User      @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  documents   Document[]
  permissions SpacePermission[]
  invitations SpaceInvitation[] // [NEW] 邀请记录
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([ownerId])
  @@index([isPublic])
}

// [NEW] 空间权限表
model SpacePermission {
  id        String   @id @default(cuid())
  userId    String
  spaceId   String
  role      Role     @default(VIEWER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  space     Space    @relation(fields: [spaceId], references: [id], onDelete: Cascade)

  @@unique([userId, spaceId])
}

// [NEW] 邀请记录表
model SpaceInvitation {
  id        String   @id @default(cuid())
  spaceId   String
  email     String
  role      Role     @default(VIEWER)
  inviterId String
  token     String   @unique
  expiresAt DateTime
  status    InvitationStatus @default(PENDING) // PENDING, ACCEPTED, EXPIRED
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  space     Space    @relation(fields: [spaceId], references: [id], onDelete: Cascade)
  inviter   User     @relation(fields: [inviterId], references: [id])

  @@unique([spaceId, email])
}

enum Role {
  OWNER   // 拥有者：完全控制，可删除 Space
  ADMIN   // [NEW] 管理员：管理成员、邀请、设置
  EDITOR  // 编辑者：创建/编辑文档
  VIEWER  // 访客：只读
}
```

#### API 接口

**POST /spaces**

- 功能：创建工作空间
- 权限：需要登录
- 请求体：
  ```json
  {
    "name": "我的团队知识库",
    "description": "团队内部文档管理",
    "isPublic": false
  }
  ```
- 响应：
  ```json
  {
    "id": "space_id",
    "name": "我的团队知识库",
    "description": "团队内部文档管理",
    "isPublic": false,
    "ownerId": "user_id",
    "createdAt": "2026-02-03T00:00:00.000Z"
  }
  ```
- 业务逻辑：
  - 自动将创建者设置为 Owner
  - 自动创建 SpacePermission 记录

**GET /spaces**

- 功能：获取我的工作空间列表
- 权限：需要登录
- 查询参数：
  - `page`: 页码（默认 1）
  - `limit`: 每页数量（默认 20）
  - `search`: 搜索关键词（可选）
- 响应：
  ```json
  {
    "data": [
      {
        "id": "space_id",
        "name": "我的团队知识库",
        "description": "团队内部文档管理",
        "isPublic": false,
        "role": "owner",
        "documentCount": 15,
        "updatedAt": "2026-02-03T00:00:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 20
  }
  ```
- 返回规则：
  - 我创建的工作空间
  - 我被邀请加入的工作空间
  - 按更新时间倒序排列

**GET /spaces/:id**

- 功能：获取工作空间详情
- 权限：Space 成员或公开 Space
- 响应：
  ```json
  {
    "id": "space_id",
    "name": "我的团队知识库",
    "description": "团队内部文档管理",
    "isPublic": false,
    "owner": {
      "id": "user_id",
      "name": "张三",
      "email": "zhang@example.com"
    },
    "myRole": "owner",
    "documentCount": 15,
    "memberCount": 3,
    "createdAt": "2026-02-03T00:00:00.000Z",
    "updatedAt": "2026-02-03T00:00:00.000Z"
  }
  ```

**PATCH /spaces/:id**

- 功能：更新工作空间
- 权限：Owner
- 请求体：
  ```json
  {
    "name": "新名称",
    "description": "新描述",
    "isPublic": true
  }
  ```
- 响应：更新后的 Space 对象

**DELETE /spaces/:id**

- 功能：删除工作空间
- 权限：Owner
- 行为：级联删除所有文档和权限记录
- 响应：`{ "message": "Space deleted successfully" }`

#### API 接口 - 成员与权限

**GET /spaces/:id/members**

- 功能：获取成员列表
- 权限：Space 成员
- 响应：
  ```json
  [
    {
      "userId": "user_id",
      "name": "张三",
      "email": "zhang@example.com",
      "role": "OWNER",
      "joinedAt": "2026-02-03T00:00:00.000Z"
    }
  ]
  ```

**PATCH /spaces/:id/members/:userId**

- 功能：修改成员角色
- 权限：Owner 或 Admin (只能操作比自己低级的角色)
- 请求体：`{ "role": "EDITOR" }`

**DELETE /spaces/:id/members/:userId**

- 功能：移除成员
- 权限：Owner 或 Admin
- 响应：`{ "message": "Member removed" }`

**POST /spaces/:id/invitations**

- 功能：创建邀请 (生成邀请链接)
- 权限：Owner 或 Admin
- 请求体：
  ```json
  {
    "email": "可选，指定邮箱",
    "role": "EDITOR" // 邀请的角色
  }
  ```
- 响应：
  ```json
  {
    "token": "invitation_token",
    "url": "https://app.docstudio.com/invite/invitation_token",
    "expiresAt": "..."
  }
  ```
- 业务逻辑：
  - 创建 SpaceInvitation 记录
  - 生成包含 Token 的链接
  - 如果提供了邮箱，可选择发送邮件（可选）

**POST /spaces/join**

- 功能：通过链接/Token加入空间
- 权限：登录用户
- 请求体：`{ "token": "invite_token" }`
- 业务逻辑：
  - 验证 Token 有效且未过期
  - (如果有指定邮箱) 验证当前登录用户邮箱是否匹配
  - 如果未指定邮箱，则允许任意登录用户加入
  - 创建 SpacePermission (赋予邀请时指定的 Role)
  - 更新 Invitation 状态为 ACCEPTED

#### 前端功能

**工作空间列表页** (`/spaces`)

- 展示所有我的工作空间（网格或列表视图）
- 每个卡片显示：
  - 工作空间名称
  - 描述
  - 文档数量
  - 成员数量
  - 公开/私有标识
  - 我的角色
  - 最后更新时间
- "新建工作空间"按钮
- 搜索框
- 点击卡片进入工作空间详情

**创建工作空间弹窗**

- 表单字段：
  - 名称（必填）
  - 描述（可选）
  - 是否公开（开关）
- 表单验证
- 创建成功后跳转到该工作空间

**工作空间设置页** (`/spaces/:id/settings`)

- 基本信息编辑
- 公开/私有切换
- 删除工作空间（需要二次确认）
- 仅 Owner 可访问

**成员管理页** (`/spaces/:id/settings/members`)

- 成员列表：头像、姓名、邮箱、角色、加入时间、操作列
- 角色修改下拉框（Owner/Admin 可见）
- 移除成员按钮
- **邀请按钮**：
  - 弹窗输入邮箱和选择角色
  - 生成邀请链接复制 / 发送邮件
- 邀请记录列表（显示待接受的邀请）
  - 撤销邀请功能

---

### 2. Document CRUD

#### 数据模型

```prisma
model Document {
  id        String    @id @default(cuid())
  spaceId   String
  space     Space     @relation(fields: [spaceId], references: [id], onDelete: Cascade)
  parentId  String?   // 父文档 ID（用于树形结构）
  parent    Document? @relation("DocumentTree", fields: [parentId], references: [id], onDelete: Cascade)
  children  Document[] @relation("DocumentTree")
  title     String
  content   String    @db.Text // 暂时存储纯文本或 JSON，Stage 4 迁移到 Yjs
  order     Int       @default(0) // 排序字段
  ydocKey   String?   @unique // 预留给 Yjs（Stage 4 使用）
  createdBy String
  creator   User      @relation(fields: [createdBy], references: [id])
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@index([spaceId])
  @@index([parentId])
  @@index([createdBy])
}
```

#### API 接口

**POST /spaces/:spaceId/docs**

- 功能：创建文档
- 权限：Space Editor 或 Owner
- 请求体：
  ```json
  {
    "title": "新文档",
    "parentId": null,
    "content": ""
  }
  ```
- 响应：创建的文档对象
- 业务逻辑：
  - 自动设置 order（同级文档最大 order + 1）
  - 继承 Space 的公开属性

**GET /docs/:id**

- 功能：获取文档详情
- 权限：Space 成员或公开文档
- 响应：
  ```json
  {
    "id": "doc_id",
    "title": "新文档",
    "content": "文档内容...",
    "spaceId": "space_id",
    "parentId": null,
    "creator": {
      "id": "user_id",
      "name": "张三"
    },
    "createdAt": "2026-02-03T00:00:00.000Z",
    "updatedAt": "2026-02-03T00:00:00.000Z"
  }
  ```

**PATCH /docs/:id**

- 功能：更新文档
- 权限：Space Editor 或 Owner
- 请求体：
  ```json
  {
    "title": "更新的标题",
    "content": "更新的内容...",
    "parentId": "new_parent_id"
  }
  ```
- 响应：更新后的文档对象

**DELETE /docs/:id**

- 功能：删除文档
- 权限：Space Owner
- 行为：级联删除所有子文档
- 响应：`{ "message": "Document deleted successfully" }`

**GET /spaces/:spaceId/docs/tree**

- 功能：获取工作空间的文档树
- 权限：Space 成员或公开 Space
- 响应：
  ```json
  [
    {
      "id": "doc_1",
      "title": "文档 1",
      "order": 0,
      "children": [
        {
          "id": "doc_1_1",
          "title": "子文档 1.1",
          "order": 0,
          "children": []
        }
      ]
    },
    {
      "id": "doc_2",
      "title": "文档 2",
      "order": 1,
      "children": []
    }
  ]
  ```

**PATCH /docs/:id/move**

- 功能：移动文档（改变父文档或排序）
- 权限：Space Editor 或 Owner
- 请求体：
  ```json
  {
    "parentId": "new_parent_id",
    "order": 2
  }
  ```
- 响应：更新后的文档对象

#### 前端功能

**文档编辑页** (`/spaces/:spaceId/docs/:docId`)

- 文档标题编辑
- 富文本编辑器（见下节）
- 自动保存指示器
- 面包屑导航
- 最后更新时间显示

**文档操作**

- 重命名文档
- 删除文档（需确认）
- 复制文档链接

---

### 3. Tiptap 编辑器集成（单用户版本）

#### 技术选型

- **Tiptap**: 基于 ProseMirror 的富文本编辑器
- **扩展**：
  - StarterKit（基础功能）
  - Table（表格）
  - CodeBlock（代码块）
  - TaskList（任务列表）
  - Placeholder（提示文本）
  - CharacterCount（字数统计）

#### 编辑器功能

**基础格式化**

- 标题（H1-H6）
- 加粗、斜体、删除线、下划线
- 有序列表、无序列表、任务列表
- 引用块
- 代码行、代码块
- 水平分割线

**高级功能**

- 表格插入和编辑
- Slash 命令菜单（输入 `/` 触发）
- 快捷键支持
- 撤销/重做
- 字数统计

**自动保存**

- 防抖保存（用户停止输入 1 秒后保存）
- 保存状态指示器：
  - "已保存"
  - "保存中..."
  - "保存失败"
- 离开页面前保存

#### Slash 命令清单

| 命令          | 功能     | 快捷键        |
| ------------- | -------- | ------------- |
| `/h1` - `/h6` | 插入标题 | `Cmd+Alt+1-6` |
| `/bold`       | 加粗     | `Cmd+B`       |
| `/italic`     | 斜体     | `Cmd+I`       |
| `/code`       | 代码块   | `Cmd+Shift+C` |
| `/bullet`     | 无序列表 | `Cmd+Shift+8` |
| `/number`     | 有序列表 | `Cmd+Shift+7` |
| `/todo`       | 任务列表 | -             |
| `/quote`      | 引用块   | `Cmd+Shift+B` |
| `/table`      | 插入表格 | -             |
| `/hr`         | 分割线   | -             |

#### 前端实现

```typescript
// 编辑器配置示例
const editor = useEditor({
  extensions: [
    StarterKit,
    Table,
    CodeBlockLowlight,
    TaskList,
    TaskItem,
    Placeholder.configure({
      placeholder: '输入 / 查看命令...',
    }),
  ],
  content: initialContent,
  onUpdate: ({ editor }) => {
    // 防抖保存
    debouncedSave(editor.getJSON());
  },
});
```

---

### 4. 文档树结构与导航

#### 功能设计

**侧边栏文档树**

- 树形结构展示所有文档
- 可展开/折叠节点
- 拖拽排序和移动
- 右键菜单：
  - 重命名
  - 删除
- 当前文档高亮
- 搜索文档（实时过滤）

**面包屑导航**

- 显示文档层级路径
- 点击可快速跳转
- 格式：`工作空间 > 父文档 > 当前文档`

**拖拽功能**

- 可拖拽文档到其他位置
- 可拖拽文档成为其他文档的子文档
- 拖拽时显示插入位置提示
- 拖拽完成后自动保存

#### 前端实现

使用库推荐：

- `@dnd-kit/core`: 拖拽功能
- `react-arborist` 或 `rc-tree`: 树形结构

#### UI/UX 设计

**侧边栏布局**

```
┌─────────────┬──────────────────────┐
│ 侧边栏      │ 主内容区              │
│ (200-300px) │                      │
│             │                      │
│ 📁 工作空间  │  📄 文档标题          │
│   └ 📄 文档1 │  ─────────────────  │
│   └ 📄 文档2 │  编辑器内容...       │
│       └ 📄 2.1│                     │
│   └ 📄 文档3 │                      │
│             │                      │
│ [+ 新建]    │                      │
└─────────────┴──────────────────────┘
```

**响应式设计**

- 桌面：侧边栏常驻
- 平板：侧边栏可折叠
- 移动：侧边栏抽屉式

---

## 数据库迁移

```bash
# 创建迁移文件
npx prisma migrate dev --name add_spaces_and_documents

# 迁移内容
# - 创建 Space 表
# - 创建 Document 表
# - 创建 SpacePermission 表（预留）
# - 创建索引和外键
```

---

## 技术实现要点

### 自动保存实现

```typescript
// 防抖保存
const debouncedSave = useMemo(
  () =>
    debounce(async (content: JSONContent) => {
      try {
        setSaveStatus('saving');
        await updateDocument(docId, { content: JSON.stringify(content) });
        setSaveStatus('saved');
      } catch (error) {
        setSaveStatus('error');
        toast.error('保存失败');
      }
    }, 1000),
  [docId]
);

// 离开前保存
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (hasUnsavedChanges) {
      e.preventDefault();
      e.returnValue = '';
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [hasUnsavedChanges]);
```

### 权限检查中间件

```typescript
// 后端权限检查
@UseGuards(JwtAuthGuard, SpacePermissionGuard)
@Permissions('editor', 'owner')
@Post('/spaces/:spaceId/docs')
async createDocument(@Param('spaceId') spaceId: string, @Body() dto: CreateDocumentDto) {
  // ...
}
```

---

## 验收标准

### Space 管理

- ✅ 用户可以创建工作空间
- ✅ 用户可以查看自己的工作空间列表
- ✅ 用户可以编辑工作空间信息
- ✅ 用户可以删除工作空间（级联删除文档）
- ✅ 可以设置工作空间为公开或私有

### Document CRUD

- ✅ 用户可以在工作空间中创建文档
- ✅ 用户可以编辑文档标题和内容
- ✅ 用户可以删除文档
- ✅ 用户可以创建子文档（多层嵌套）
- ✅ 文档内容可以正常保存和加载

### 编辑器

- ✅ 编辑器支持所有基础格式化功能
- ✅ Slash 命令菜单可用
- ✅ 自动保存功能正常工作
- ✅ 保存状态正确显示
- ✅ 表格和代码块可正常使用

### 文档树

- ✅ 文档树正确展示层级结构
- ✅ 可以展开/折叠节点
- ✅ 拖拽移动文档功能正常
- ✅ 面包屑导航正确显示
- ✅ 响应式布局在各设备上正常

---

## 下一步

完成 Stage 1 后，进入 **Stage 2: 公开访问层**，开始开发项目首页和公开内容展示功能。
