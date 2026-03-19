# Stage 4 补充: 活动日志 / 最近访问

**状态**: ✅ 已完成
**完成时间**: 2026-03-17
**目标**: 记录用户的文档浏览/编辑行为，提供最近访问快捷入口和空间操作审计能力

---

## 概述

本功能包含两个子模块：

1. **最近访问（Recent Visits）** — 用户维度，记录并展示用户最近浏览/编辑的文档列表
2. **活动日志（Activity Log）** — 空间维度，记录空间内的操作记录（谁在什么时间做了什么）

---

## 1. 数据模型（已实现）

### 1.1 活动日志表 `activity_logs`

```prisma
model ActivityLog {
  id         String       @id @default(cuid())
  userId     String
  action     ActivityAction
  entityType EntityType
  entityId   String
  entityName String?      // 冗余存储实体名称（实体删除后仍可显示）
  spaceId    String?      // 冗余存储，方便按空间查询
  spaceName  String?      // 冗余存储空间名称
  metadata   String?      @db.Text // JSON 额外信息
  createdAt  DateTime     @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, createdAt(sort: Desc)])
  @@index([spaceId, createdAt(sort: Desc)])
  @@index([entityType, entityId])
  @@map("activity_logs")
}
```

### 1.2 最近访问表 `document_visits`

```prisma
model DocumentVisit {
  id          String   @id @default(cuid())
  userId      String
  documentId  String
  spaceId     String
  visitCount  Int      @default(1)
  lastVisitAt DateTime @default(now())
  createdAt   DateTime @default(now())

  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  document Document @relation(fields: [documentId], references: [id], onDelete: Cascade)

  @@unique([userId, documentId])
  @@index([userId, lastVisitAt(sort: Desc)])
  @@index([spaceId])
  @@map("document_visits")
}
```

### 1.3 枚举类型

```prisma
enum ActivityAction {
  CREATE, UPDATE, DELETE, VIEW, MOVE,
  RESTORE, SHARE, JOIN, LEAVE, INVITE, ROLE_CHANGE
}

enum EntityType {
  DOCUMENT, SPACE, SNAPSHOT, SHARE_LINK, MEMBER
}
```

**与规划文档的差异说明**：
- 实际采用 `entityType + entityId` 通用实体设计（替代原方案的 `documentId` + Space 关联），更灵活
- 冗余存储 `entityName` / `spaceName`，即使实体删除后活动日志仍可读
- `DocumentVisit` 不关联 Space 模型（仅冗余 spaceId 字段），避免级联复杂度

---

## 2. 后端 API（已实现）

### 2.1 模块结构

```
apps/api/src/activity/
├── activity.module.ts      # @Global 全局模块
├── activity.controller.ts  # 3 个 API 端点
├── activity.service.ts     # 核心服务（日志 + 访问记录 + 查询 + 清理）
└── dto/                    # 预留 DTO 目录
```

### 2.2 API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/activity/recent-documents?limit=20` | 获取当前用户最近访问的文档 |
| GET | `/activity/my?page=1&limit=30` | 获取当前用户的活动流 |
| GET | `/activity/space/:spaceId?page=1&limit=30` | 获取空间内的活动流 |

### 2.3 ActivityService 核心方法

| 方法 | 说明 | 特性 |
|------|------|------|
| `log()` | 记录活动日志 | Fire-and-forget，异步不阻塞 |
| `recordDocumentVisit()` | 记录文档访问 | Upsert：存在则更新计数+时间 |
| `getRecentDocuments()` | 查询最近文档 | 带文档详情、空间名、创建者 |
| `getMyActivity()` | 查询个人活动 | 分页，JSON metadata 自动解析 |
| `getSpaceActivity()` | 查询空间活动 | 分页，按时间倒序 |
| `cleanupOldLogs()` | 清理旧日志 | 默认 90 天，可由定时任务调用 |

### 2.4 日志植入点

| 模块 | 方法 | Action | 说明 |
|------|------|--------|------|
| DocumentsService | `create()` | CREATE + DOCUMENT | 含文档标题和空间名 |
| DocumentsService | `findOne()` | — | 仅记录 DocumentVisit（不记录 VIEW 日志，避免噪声） |
| DocumentsService | `update()` | UPDATE + DOCUMENT | metadata 含 changedFields |
| DocumentsService | `remove()` | DELETE + DOCUMENT | 删除前读取文档信息冗余存储 |
| SpacesService | `create()` | CREATE + SPACE | — |
| SpacesService | `joinSpace()` | JOIN + SPACE | 接受邀请时触发 |
| SpacesService | `removeMember()` | LEAVE + MEMBER | metadata 含 removedUserId |

---

## 3. 前端（已实现）

### 3.1 文件结构

```
apps/web/src/
├── services/
│   └── activity-service.ts            # API 客户端 + TypeScript 类型定义
├── components/activity/
│   ├── recent-documents.tsx           # 最近访问文档列表组件
│   └── activity-timeline.tsx          # 活动时间线组件（支持个人/空间两种模式）
├── app/(main)/
│   ├── dashboard/page.tsx             # 已改造：最近访问 + 活动时间线
│   └── spaces/[id]/
│       ├── page.tsx                   # 已改造：增加「活动日志」入口按钮
│       └── activity/page.tsx          # 新增：空间活动日志页面
```

### 3.2 Dashboard 布局

```
┌────────────────────────────────────────────────────────────────┐
│  👋 欢迎回来，张三                                              │
├────────────────────────────────────┬───────────────────────────┤
│  📄 最近访问（占 2/3 宽度）         │  用户信息卡片              │
│  ┌──────────────────────────────┐  │  ┌─────────────────────┐  │
│  │ 📝 API 文档  产品空间  2分钟前 │  │  │ 邮箱 / 注册时间      │  │
│  │ 📝 数据库设计 技术空间  1小时前│  │  ├─────────────────────┤  │
│  │ 📝 Q1 总结   团队管理  昨天   │  │  │ 快速操作             │  │
│  │ ...                          │  │  │ → 管理工作空间        │  │
│  └──────────────────────────────┘  │  └─────────────────────┘  │
├────────────────────────────────────┴───────────────────────────┤
│  📋 我的活动                                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 🟢 张三 创建了文档 API 设计文档              2分钟前       │  │
│  │ 🔵 张三 编辑了文档 数据库设计                1小时前       │  │
│  │ 🔴 张三 删除了文档 ~~废弃文档~~              昨天          │  │
│  │ [加载更多]                                               │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

### 3.3 空间活动日志页面

路由: `/spaces/:id/activity`

- 按日期分组展示
- 无限加载分页
- 点击文档名跳转到文档（只读模式）
- 已删除文档显示删除线样式，不可点击

### 3.4 已删除文档保护

| 场景 | 处理方式 |
|------|----------|
| 活动日志中 DELETE 类型记录 | 文档名显示为 ~~删除线~~，不可点击 |
| 活动日志中其他记录但文档已被删除 | 点击时 API 验证，失败则 toast 提示 |
| 最近访问中文档已被删除 | 点击时 API 验证，失败则 toast 提示 + 从列表移除 |

### 3.5 只读模式

从活动日志点击文档 → URL 带 `?readonly=true` → 文档页进入只读模式：
- 标题不可编辑
- 编辑器 `editable=false`
- 状态栏显示「只读模式」
- 有编辑权限的用户显示「进入编辑」按钮（去掉 query param 即可切换）

---

## 4. 验收标准

### 最近访问

- [x] 用户打开文档时自动记录访问（DocumentsService.findOne 中 fire-and-forget）
- [x] Dashboard 展示最近访问文档列表（按时间倒序，默认 10 条）
- [x] 显示文档标题、所属空间、访问时间、访问次数、创建者
- [x] 点击可跳转到文档编辑页
- [x] 文档删除后点击提示 toast，自动从列表移除
- [x] 访问记录不影响文档加载性能（异步 upsert）

### 活动日志

- [x] 文档 CRUD 操作自动记录日志
- [x] 空间创建/加入/成员移除自动记录日志
- [x] 空间内可查看活动时间线（`/spaces/:id/activity`）
- [x] Dashboard 可查看个人活动流（compact 模式）
- [x] 日志按日期分组展示
- [x] 分页加载（加载更多按钮）
- [x] 已删除文档视觉区分（删除线 + 不可点击）
- [x] 日志记录失败不影响主业务流程（fire-and-forget + catch）
- [x] 提供 `cleanupOldLogs()` 方法支持定期清理

### 只读浏览

- [x] 从活动日志进入文档为只读模式
- [x] 有编辑权限时显示「进入编辑」按钮
- [x] VIEWER 角色始终只读，不显示编辑按钮
