# Stage 4 补充: 文档模板系统

**状态**: ✅ 已完成
**完成时间**: 2026-03-18
**目标**: 提供预设和自定义文档模板，让用户创建文档时可以选择模板快速开始，避免空白页面

---

## 1. 架构设计总览

### 1.1 设计原则

| 原则 | 说明 |
|------|------|
| **三级作用域** | 系统级（内置）→ 空间级（团队共享）→ 个人级（私有） |
| **内容即快照** | 模板存储 Tiptap JSON，创建文档时深拷贝，后续独立演化 |
| **非侵入式** | 模板功能作为独立模块，不改动现有 Document 模型 |
| **渐进增强** | 第一期做「选择模板创建文档」，后续可扩展为「从文档另存为模板」 |

### 1.2 核心交互流程

```
用户点击「新建文档」
       │
       ▼
┌─────────────────────────────┐
│   模板选择弹窗               │
│                             │
│  ┌──────┐ ┌──────┐ ┌──────┐│
│  │ 空白  │ │会议记录│ │技术方案││
│  │ 文档  │ │      │ │      ││
│  └──────┘ └──────┘ └──────┘│
│  ┌──────┐ ┌──────┐ ┌──────┐│
│  │ 周报  │ │需求文档│ │ 自定义 ││
│  │      │ │      │ │      ││
│  └──────┘ └──────┘ └──────┘│
│                             │
│  [跳过，直接创建空白文档]      │
└─────────────────────────────┘
       │ 选择模板
       ▼
创建文档（title=模板标题, content=模板内容）
       │
       ▼
跳转到文档编辑器，用户继续编辑
```

### 1.3 系统架构图

```
┌─────────────────────────────────────────────────────┐
│                    Frontend                          │
│                                                     │
│  TemplatePickerModal ──→ useDocuments.createDocument │
│  (模板选择弹窗)           (传入 content + title)      │
│                                                     │
│  TemplateManagePage  ──→ templateService (CRUD)      │
│  (模板管理页面)                                       │
│                                                     │
│  SaveAsTemplateDialog ──→ templateService.create     │
│  (另存为模板弹窗)                                     │
├─────────────────────────────────────────────────────┤
│                    Backend                           │
│                                                     │
│  TemplatesModule                                    │
│  ├── templates.controller.ts  (REST API)            │
│  ├── templates.service.ts     (业务逻辑)             │
│  └── dto/                     (验证层)               │
│                                                     │
│  Prisma: DocumentTemplate 模型                       │
│  Seed: 系统内置模板初始化                              │
└─────────────────────────────────────────────────────┘
```

---

## 2. 数据模型

### 2.1 DocumentTemplate 表

```prisma
model DocumentTemplate {
  id          String        @id @default(cuid())
  name        String                          // 模板名称（如「会议记录」）
  description String?                         // 模板说明
  content     String        @db.Text          // Tiptap JSON 内容
  icon        String        @default("📄")    // 模板图标（emoji 或 icon name）
  category    TemplateCategory @default(OTHER) // 分类
  scope       TemplateScope @default(SYSTEM)  // 作用域

  // 归属（scope 决定哪个字段有值）
  spaceId     String?                         // SPACE 级模板所属空间
  createdBy   String                          // 创建者（SYSTEM 模板为 bootstrap 用户）

  // 排序 & 软删除
  sortOrder   Int           @default(0)       // 展示排序
  isActive    Boolean       @default(true)    // 软删除 / 隐藏

  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  // 关系
  creator     User          @relation(fields: [createdBy], references: [id])
  space       Space?        @relation(fields: [spaceId], references: [id], onDelete: Cascade)

  @@index([scope, category])
  @@index([spaceId])
  @@index([createdBy])
  @@map("document_templates")
}

enum TemplateScope {
  SYSTEM  // 系统内置，所有人可见
  SPACE   // 空间级，空间成员可见
  USER    // 个人级，仅创建者可见
}

enum TemplateCategory {
  MEETING     // 会议记录
  TECH        // 技术文档
  REPORT      // 报告 / 周报
  REQUIREMENT // 需求文档
  GUIDE       // 指南 / 教程
  OTHER       // 其他
}
```

### 2.2 关联模型更新

```prisma
// User 模型新增关系
model User {
  // ... 现有字段
  templates DocumentTemplate[]
}

// Space 模型新增关系
model Space {
  // ... 现有字段
  templates DocumentTemplate[]
}
```

### 2.3 设计决策说明

| 决策 | 理由 |
|------|------|
| 独立表而非复用 Document | 模板不参与文档树、协作、版本历史，职责完全不同 |
| `content` 存 Tiptap JSON | 与编辑器一致，创建文档时直接深拷贝，保留所有格式 |
| `icon` 用 emoji 字符串 | 简单直观，前端直接渲染，无需额外图标库 |
| `scope` 三级作用域 | 系统级确保开箱即用，空间级支持团队标准化，个人级支持自定义 |
| `category` 枚举分类 | 第一期模板数量有限，枚举够用；后期可改为 tag 模式 |
| `sortOrder` 手动排序 | 系统模板需要控制展示顺序 |

---

## 3. 后端 API 设计

### 3.1 模块结构

```
apps/api/src/templates/
├── templates.module.ts
├── templates.controller.ts
├── templates.service.ts
├── templates.seed.ts            # 系统模板种子数据
└── dto/
    ├── create-template.dto.ts
    ├── update-template.dto.ts
    └── query-template.dto.ts
```

### 3.2 API 端点

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/templates` | 登录用户 | 获取可用模板列表（按作用域合并） |
| GET | `/templates/:id` | 登录用户 | 获取单个模板详情（含 content） |
| POST | `/templates` | 登录用户 | 创建模板（SPACE 需要 OWNER/ADMIN 权限） |
| PATCH | `/templates/:id` | 创建者/管理员 | 更新模板 |
| DELETE | `/templates/:id` | 创建者/管理员 | 删除模板（软删除） |
| POST | `/templates/from-document/:documentId` | EDITOR+ | 从现有文档另存为模板 |

### 3.3 GET /templates — 模板列表

**查询参数**：

```typescript
class QueryTemplateDto {
  spaceId?: string;         // 可选，传入则包含该空间的模板
  category?: TemplateCategory; // 可选，按分类过滤
  scope?: TemplateScope;    // 可选，按作用域过滤
}
```

**业务逻辑**：

```typescript
async findAll(userId: string, query: QueryTemplateDto) {
  // 合并三个作用域的模板：
  // 1. SYSTEM 模板（所有人可见）
  // 2. SPACE 模板（如果传了 spaceId，且用户是该空间成员）
  // 3. USER 模板（仅当前用户自己的）
  const where: Prisma.DocumentTemplateWhereInput = {
    isActive: true,
    OR: [
      { scope: 'SYSTEM' },
      ...(query.spaceId ? [{ scope: 'SPACE' as const, spaceId: query.spaceId }] : []),
      { scope: 'USER', createdBy: userId },
    ],
    ...(query.category ? { category: query.category } : {}),
  };

  return this.prisma.documentTemplate.findMany({
    where,
    orderBy: [{ scope: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      name: true,
      description: true,
      icon: true,
      category: true,
      scope: true,
      sortOrder: true,
      // 列表不返回 content（节省带宽），仅在 findOne 中返回
    },
  });
}
```

**响应格式**：

```json
{
  "data": [
    {
      "id": "tpl_xxx",
      "name": "会议记录",
      "description": "标准团队会议记录模板，包含议程、讨论要点和行动项",
      "icon": "📋",
      "category": "MEETING",
      "scope": "SYSTEM"
    },
    {
      "id": "tpl_yyy",
      "name": "我的周报模板",
      "description": null,
      "icon": "📝",
      "category": "REPORT",
      "scope": "USER"
    }
  ]
}
```

### 3.4 GET /templates/:id — 模板详情

返回完整模板（含 `content` 字段），用于：
- 模板预览
- 创建文档时获取内容

```json
{
  "id": "tpl_xxx",
  "name": "会议记录",
  "description": "...",
  "icon": "📋",
  "category": "MEETING",
  "scope": "SYSTEM",
  "content": "{\"type\":\"doc\",\"content\":[...]}",
  "creator": { "id": "...", "name": "系统" }
}
```

### 3.5 POST /templates — 创建模板

```typescript
class CreateTemplateDto {
  @IsString() @IsNotEmpty()
  name: string;

  @IsString() @IsOptional()
  description?: string;

  @IsString() @IsNotEmpty()
  content: string;       // Tiptap JSON

  @IsString() @IsOptional()
  icon?: string;         // 默认 📄

  @IsEnum(TemplateCategory) @IsOptional()
  category?: TemplateCategory;

  @IsEnum(TemplateScope)
  scope: TemplateScope;  // USER 或 SPACE

  @IsString() @IsOptional()
  spaceId?: string;      // scope=SPACE 时必填
}
```

**权限校验逻辑**：

```typescript
async create(userId: string, dto: CreateTemplateDto) {
  // 1. SYSTEM 模板只能由超级管理员创建
  if (dto.scope === 'SYSTEM') {
    throw new ForbiddenException('系统模板不可手动创建');
  }

  // 2. SPACE 模板需要校验用户是该空间的 OWNER 或 ADMIN
  if (dto.scope === 'SPACE') {
    if (!dto.spaceId) throw new BadRequestException('空间模板必须指定 spaceId');
    await this.validateSpaceAdmin(userId, dto.spaceId);
  }

  // 3. USER 模板直接创建
  return this.prisma.documentTemplate.create({
    data: {
      ...dto,
      createdBy: userId,
    },
  });
}
```

### 3.6 POST /templates/from-document/:documentId — 从文档另存为模板

```typescript
async createFromDocument(userId: string, documentId: string, dto: SaveAsTemplateDto) {
  // 1. 获取文档内容
  const doc = await this.prisma.document.findUnique({
    where: { id: documentId },
    select: { title: true, content: true, spaceId: true },
  });
  if (!doc) throw new NotFoundException('文档不存在');

  // 2. 获取协作内容（如果有 Yjs 数据，优先从 Yjs 提取 JSON）
  // 如果文档通过协作编辑，content 字段可能是纯文本提取
  // 需要尝试从前端传入完整 Tiptap JSON
  const content = dto.content || doc.content;

  // 3. 创建模板
  return this.prisma.documentTemplate.create({
    data: {
      name: dto.name || doc.title,
      description: dto.description,
      content,
      icon: dto.icon || '📄',
      category: dto.category || 'OTHER',
      scope: dto.scope,
      spaceId: dto.scope === 'SPACE' ? doc.spaceId : null,
      createdBy: userId,
    },
  });
}
```

### 3.7 系统模板种子数据

```typescript
// templates.seed.ts
export const SYSTEM_TEMPLATES: Omit<DocumentTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: '会议记录',
    description: '标准团队会议记录模板，包含议程、讨论要点和行动项',
    icon: '📋',
    category: 'MEETING',
    scope: 'SYSTEM',
    sortOrder: 1,
    content: JSON.stringify({
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: '会议记录' }] },
        { type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: '日期：' }, { type: 'text', text: 'YYYY-MM-DD' }] },
        { type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: '参会人：' }, { type: 'text', text: '...' }] },
        { type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: '会议主题：' }, { type: 'text', text: '...' }] },
        { type: 'horizontalRule' },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '议程' }] },
        { type: 'orderedList', content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '议题一' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '议题二' }] }] },
        ]},
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '讨论要点' }] },
        { type: 'bulletList', content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '要点一' }] }] },
        ]},
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '行动项' }] },
        { type: 'taskList', content: [
          { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: '任务一 - 负责人 - 截止日期' }] }] },
          { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: '任务二 - 负责人 - 截止日期' }] }] },
        ]},
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '下次会议' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '时间：待定' }] },
      ],
    }),
  },
  {
    name: '技术方案',
    description: '技术设计文档模板，包含背景、方案设计、风险评估等章节',
    icon: '🏗️',
    category: 'TECH',
    scope: 'SYSTEM',
    sortOrder: 2,
    content: '...', // Tiptap JSON
  },
  {
    name: '周报',
    description: '个人/团队周报模板，包含本周完成、下周计划、问题与风险',
    icon: '📊',
    category: 'REPORT',
    scope: 'SYSTEM',
    sortOrder: 3,
    content: '...', // Tiptap JSON
  },
  {
    name: '需求文档',
    description: 'PRD 模板，包含需求背景、用户故事、功能描述、验收标准',
    icon: '📐',
    category: 'REQUIREMENT',
    scope: 'SYSTEM',
    sortOrder: 4,
    content: '...', // Tiptap JSON
  },
  {
    name: '操作指南',
    description: '使用指南/操作手册模板，适合编写操作流程和使用说明',
    icon: '📖',
    category: 'GUIDE',
    scope: 'SYSTEM',
    sortOrder: 5,
    content: '...', // Tiptap JSON
  },
];
```

**种子执行时机**：在应用启动时（`onModuleInit`）检查 SYSTEM 模板是否存在，不存在则创建。

---

## 4. 前端设计

### 4.1 新增文件

```
apps/web/src/
├── services/
│   └── template-service.ts               # API 客户端
├── types/
│   └── template.ts                       # TypeScript 类型
├── components/template/
│   ├── template-picker-modal.tsx          # 模板选择弹窗（核心组件）
│   ├── template-card.tsx                  # 单个模板卡片
│   ├── template-preview-dialog.tsx        # 模板预览弹窗（只读渲染内容）
│   ├── template-manage-list.tsx           # 模板管理列表（用于管理页面）
│   └── save-as-template-dialog.tsx        # 从文档另存为模板弹窗
├── app/(main)/
│   └── spaces/[id]/
│       └── templates/
│           └── page.tsx                   # 空间模板管理页面
```

### 4.2 TypeScript 类型定义

```typescript
// types/template.ts
export type TemplateScope = 'SYSTEM' | 'SPACE' | 'USER';
export type TemplateCategory = 'MEETING' | 'TECH' | 'REPORT' | 'REQUIREMENT' | 'GUIDE' | 'OTHER';

export interface DocumentTemplate {
  id: string;
  name: string;
  description: string | null;
  content: string;       // 仅 findOne 返回
  icon: string;
  category: TemplateCategory;
  scope: TemplateScope;
  spaceId: string | null;
  sortOrder: number;
  createdAt: string;
  creator?: {
    id: string;
    name: string;
  };
}

// 列表项（无 content，节省带宽）
export type TemplateListItem = Omit<DocumentTemplate, 'content'>;

export interface CreateTemplateDto {
  name: string;
  description?: string;
  content: string;
  icon?: string;
  category?: TemplateCategory;
  scope: TemplateScope;
  spaceId?: string;
}

export interface SaveAsTemplateDto {
  name?: string;
  description?: string;
  content?: string;      // 可从前端传入完整 Tiptap JSON
  icon?: string;
  category?: TemplateCategory;
  scope: TemplateScope;
}

// 分类中文映射
export const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  MEETING: '会议记录',
  TECH: '技术文档',
  REPORT: '报告周报',
  REQUIREMENT: '需求文档',
  GUIDE: '指南教程',
  OTHER: '其他',
};

// 作用域标签
export const SCOPE_LABELS: Record<TemplateScope, string> = {
  SYSTEM: '系统内置',
  SPACE: '空间模板',
  USER: '我的模板',
};
```

### 4.3 模板选择弹窗（核心组件）

**触发位置**：所有「新建文档」按钮（空间首页、文档树右键菜单、空页面提示）

**布局设计**：

```
┌───────────────────────────────────────────────────────────┐
│  📄 选择模板                                        [✕]   │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  分类筛选：[全部] [会议记录] [技术文档] [报告] [需求] [指南]  │
│                                                           │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐     │
│  │   ➕    │  │   📋    │  │   🏗️    │  │   📊    │     │
│  │         │  │         │  │         │  │         │     │
│  │ 空白文档 │  │ 会议记录 │  │ 技术方案 │  │  周报   │     │
│  │         │  │ 系统内置 │  │ 系统内置 │  │ 系统内置 │     │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘     │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                   │
│  │   📐    │  │   📖    │  │   📝    │                   │
│  │         │  │         │  │         │                   │
│  │ 需求文档 │  │ 操作指南 │  │ 我的模板 │                   │
│  │ 系统内置 │  │ 系统内置 │  │ 我的模板 │                   │
│  └─────────┘  └─────────┘  └─────────┘                   │
│                                                           │
│  点击模板卡片可预览内容                                      │
│                                                           │
│                        [使用此模板]  [跳过，创建空白文档]     │
└───────────────────────────────────────────────────────────┘
```

**交互流程**：

1. 用户点击「新建文档」→ 弹出模板选择弹窗
2. 默认展示所有可用模板（系统 + 空间 + 个人），按分类筛选
3. 点击模板卡片 → 选中高亮 + 底部预览区域（或弹出预览 Dialog）
4. 点击「使用此模板」→ 调用 `createDocument({ title: template.name, content: template.content, spaceId })` → 跳转到新文档
5. 点击「跳过」或「空白文档」卡片 → 直接创建空白文档（当前逻辑）
6. 弹窗关闭后不创建

**关键实现**：

```tsx
// template-picker-modal.tsx (核心逻辑伪代码)
function TemplatePickerModal({ spaceId, onSelect, onSkip, open, onOpenChange }) {
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [category, setCategory] = useState<TemplateCategory | 'ALL'>('ALL');
  const [previewContent, setPreviewContent] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      templateService.getTemplates({ spaceId }).then(setTemplates);
    }
  }, [open, spaceId]);

  const filtered = category === 'ALL'
    ? templates
    : templates.filter(t => t.category === category);

  const handleUseTemplate = async () => {
    if (!selectedId) return;
    const detail = await templateService.getTemplate(selectedId);
    onSelect({ title: detail.name, content: detail.content });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* 分类 tabs + 模板卡片网格 + 预览 + 操作按钮 */}
    </Dialog>
  );
}
```

### 4.4 改造现有「新建文档」流程

**当前流程**（直接创建空白文档）：
```typescript
const handleCreate = async () => {
  const newDoc = await createDocument({ title: '无标题文档', spaceId: id });
  router.push(`/spaces/${id}/documents/${newDoc.id}`);
};
```

**改造后**（先选模板 → 再创建）：
```typescript
const [showTemplatePicker, setShowTemplatePicker] = useState(false);

const handleCreate = () => {
  setShowTemplatePicker(true); // 弹出模板选择弹窗
};

const handleTemplateSelect = async ({ title, content }: { title: string; content: string }) => {
  setShowTemplatePicker(false);
  const newDoc = await createDocument({ title, content, spaceId: id });
  window.dispatchEvent(new Event('document-updated'));
  router.push(`/spaces/${id}/documents/${newDoc.id}`);
};

const handleSkipTemplate = async () => {
  setShowTemplatePicker(false);
  const newDoc = await createDocument({ title: '无标题文档', spaceId: id });
  window.dispatchEvent(new Event('document-updated'));
  router.push(`/spaces/${id}/documents/${newDoc.id}`);
};
```

**需要改造的位置**：
1. `apps/web/src/app/(main)/spaces/[id]/page.tsx` — 空间首页的「新建文档」按钮
2. `apps/web/src/components/document/document-tree.tsx` — 文档树的「新建」操作（如果有）

### 4.5 另存为模板（从编辑器中）

在文档编辑器的工具栏或菜单中添加「另存为模板」按钮：

```
文档编辑器标题栏
┌──────────────────────────────────────────────────────────┐
│  📄 API 设计文档                    [分享] [另存为模板] [⋯]│
└──────────────────────────────────────────────────────────┘
```

点击后弹出 `SaveAsTemplateDialog`：
- 预填名称（当前文档标题）
- 选择作用域（我的模板 / 空间模板）
- 选择分类
- 可编辑描述
- 确认后调用 `POST /templates/from-document/:documentId`

### 4.6 空间模板管理页面

路由：`/spaces/:id/templates`

入口：空间首页 header 区域增加「模板管理」按钮（OWNER/ADMIN 可见）

```
┌───────────────────────────────────────────────────────────┐
│  📄 模板管理 - 产品文档空间                                  │
│                                                           │
│  系统模板（不可编辑）                                        │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ 📋 会议记录    | 📊 周报    | 🏗️ 技术方案  | ...     │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                           │
│  空间模板                                    [+ 创建模板]  │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ 📐 产品 PRD 模板         REQUIREMENT    [编辑] [删除]  │ │
│  │ 📋 产品评审会议模板       MEETING        [编辑] [删除]  │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                           │
│  我的模板                                    [+ 创建模板]  │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ 📝 我的周报模板           REPORT         [编辑] [删除]  │ │
│  └──────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────┘
```

---

## 5. 实现步骤

### Phase 1: 数据层 + 后端 API（~3天）

1. **更新 Prisma Schema** — 添加 `DocumentTemplate` 模型、枚举类型、关联关系
2. **运行数据库迁移** — `pnpm prisma migrate dev --name add-document-templates`
3. **编写系统模板种子数据** — 5 个精心设计的 Tiptap JSON 模板
4. **创建 TemplatesModule** — module, controller, service, DTOs
5. **实现 CRUD API** — 6 个端点（列表/详情/创建/更新/删除/从文档创建）
6. **种子逻辑** — `onModuleInit` 中 upsert 系统模板

### Phase 2: 前端模板选择（~3天）

7. **创建 template-service.ts** — API 客户端封装
8. **创建 types/template.ts** — TypeScript 类型定义
9. **实现 TemplatePickerModal** — 模板选择弹窗（分类筛选 + 卡片网格 + 预览）
10. **实现 TemplateCard** — 单个模板卡片组件
11. **改造「新建文档」流程** — 所有入口改为先弹模板选择
12. **实现 TemplatePreviewDialog** — 模板内容只读预览

### Phase 3: 模板管理 + 另存为（~3天）

13. **实现 SaveAsTemplateDialog** — 从文档另存为模板
14. **在文档编辑器中接入** — 添加「另存为模板」入口
15. **创建空间模板管理页面** — `/spaces/:id/templates`
16. **实现 TemplateManageList** — 模板列表的编辑/删除 UI
17. **在空间首页添加入口** — header 区域「模板管理」按钮

---

## 6. 系统模板详细设计（5 个内置模板）

### 6.1 📋 会议记录
```
# 会议记录
日期：YYYY-MM-DD | 参会人：... | 会议主题：...
---
## 议程
1. 议题一
2. 议题二

## 讨论要点
- 要点一
- 要点二

## 行动项
☐ 任务一 - 负责人 - 截止日期
☐ 任务二 - 负责人 - 截止日期

## 下次会议
时间：待定
```

### 6.2 🏗️ 技术方案
```
# 技术方案：[项目名称]
作者：... | 日期：YYYY-MM-DD | 状态：草稿
---
## 1. 背景与目标
### 1.1 背景
### 1.2 目标

## 2. 方案设计
### 2.1 架构概览
### 2.2 核心流程
### 2.3 数据模型

## 3. 详细设计
### 3.1 API 设计
### 3.2 前端设计

## 4. 风险评估
| 风险 | 影响 | 概率 | 缓解措施 |

## 5. 排期与里程碑
☐ Phase 1: ...
☐ Phase 2: ...
```

### 6.3 📊 周报
```
# 周报 - YYYY 第 N 周
---
## 本周完成
- [项目A] 完成 xxx
- [项目B] 完成 yyy

## 下周计划
- [项目A] 计划 xxx
- [项目B] 计划 yyy

## 问题与风险
- ⚠️ 问题描述 → 计划解决方案

## 数据指标
| 指标 | 本周 | 上周 | 变化 |
```

### 6.4 📐 需求文档
```
# PRD：[功能名称]
产品经理：... | 版本：v1.0 | 日期：YYYY-MM-DD
---
## 1. 需求背景
### 1.1 业务背景
### 1.2 用户痛点

## 2. 需求概述
### 2.1 用户故事
> 作为 [角色]，我希望 [功能]，以便 [价值]

### 2.2 核心功能列表
| 功能 | 优先级 | 说明 |

## 3. 详细设计
### 3.1 功能描述
### 3.2 交互说明
### 3.3 异常处理

## 4. 非功能需求
- 性能要求
- 兼容性要求

## 5. 验收标准
☐ 标准一
☐ 标准二

## 6. 排期
| 阶段 | 时间 | 产出 |
```

### 6.5 📖 操作指南
```
# [系统/功能] 操作指南
版本：v1.0 | 更新日期：YYYY-MM-DD
---
## 概述
简要介绍本指南的目的和适用范围。

## 前置条件
- 条件一
- 条件二

## 操作步骤
### 步骤 1：[操作名称]
详细说明...

### 步骤 2：[操作名称]
详细说明...

### 步骤 3：[操作名称]
详细说明...

## 常见问题
### Q: 问题一？
A: 解答...

### Q: 问题二？
A: 解答...

## 注意事项
> ⚠️ 重要提醒内容
```

---

## 7. 验收标准

### 模板选择

- [x] 点击「新建文档」弹出模板选择弹窗
- [x] 展示系统模板 + 空间模板 + 个人模板（按作用域合并）
- [x] 支持按分类筛选（全部 / 会议 / 技术 / 报告 / 需求 / 指南）
- [x] 点击模板卡片可选中，支持预览模板内容
- [x] 选择模板创建文档后，文档标题 = 模板名，内容 = 模板内容
- [x] 可跳过模板直接创建空白文档
- [x] 创建后跳转到编辑器，内容正常渲染

### 系统模板

- [x] 应用启动时自动种子 5 个系统模板
- [x] 系统模板所有用户可见，不可编辑/删除
- [x] 模板内容为标准 Tiptap JSON，编辑器可正确渲染

### 模板管理

- [x] 用户可创建个人模板
- [x] 空间 OWNER/ADMIN 可创建空间模板
- [x] 可编辑和删除自己创建的模板
- [x] 空间模板管理页面 OWNER/ADMIN 可访问（`/spaces/:id/templates`）
- [x] 空间首页 header 增加「模板管理」入口（OWNER/ADMIN 可见）

### 另存为模板

- [x] 文档编辑器中可触发「另存为模板」
- [x] 预填当前文档标题，可选择作用域和分类
- [x] 保存后模板出现在对应作用域中
