# Stage 7: 产品打磨与增长

**状态**: 🔄 进行中（Phase 1-5 + Phase 7 已完成）
**预估周期**: 6-8 周
**目标**: 从 MVP 走向可上线产品，补齐用户留存和增长的关键链路

---

## 产品现状评估

### 已完成能力（Stage 0-6）

| 维度 | 能力 | 完成度 |
|------|------|--------|
| 编辑器 | Tiptap + 40+ 扩展（Slash Commands、Callout、表格、代码块语法高亮、数学公式、画板、@提及、评论） | ★★★★★ |
| 协作 | Yjs + Hocuspocus 实时协作、光标同步、在线用户显示 | ★★★★★ |
| 权限 | 四级角色（OWNER/ADMIN/EDITOR/VIEWER）、邀请链接 | ★★★★☆ |
| 分享 | 公开/密码分享、SEO 优化 | ★★★★☆ |
| 内容管理 | 文档树、模板、版本快照、全文搜索 | ★★★★☆ |
| 基建 | MinIO 文件存储、Sharp 图片处理、活动日志、管理后台 | ★★★★☆ |

### 关键缺口分析

基于对标 Notion / 语雀 / 飞书文档的竞品分析，当前产品存在以下关键缺口：

| 缺口 | 严重度 | 说明 |
|------|--------|------|
| ~~无通知系统~~ | ✅ 已解决 | SSE 实时推送 + 通知面板 + 未读数 + 通知偏好设置 + 8 种通知类型 |
| ~~无回收站~~ | ✅ 已解决 | 软删除 + 30天自动清理 + 回收站页面 + 恢复/永久删除 |
| ~~无收藏/置顶~~ | ✅ 已解决 | DocumentFavorite 模型 + 星标按钮 + 收藏页面（分页表格）+ Dashboard 板块 |
| ~~无 PDF 导出~~ | ✅ 已解决 | 纯前端 PDF 导出（html2canvas + jsPDF），支持 A4 分页 |
| ~~无导入功能~~ | ✅ 已解决 | 支持 Markdown / HTML / Word (.docx) 导入，纯前端解析 |
| **无文档互链** | 🟠 中 | 知识库场景需要文档之间互相引用，构建知识网络。 |
| **无 AI 能力** | 🟠 中 | 2026 年编辑器产品没有 AI 辅助写作会被认为落后。 |
| **无数据看板** | 🟢 低 | Stage 6 已规划，属于增长阶段需求。 |

---

## 开发优先级排序

### 排序原则

1. **用户信任 > 用户体验 > 用户增长** — 先保住数据安全，再提升体验，最后做增长
2. **协作闭环优先** — 产品核心价值是协作，任何断裂的协作链路都是最高优先级
3. **高频场景优先** — 每天都用的功能 > 偶尔用的功能
4. **低成本高收益** — 实现简单但体验提升大的优先

---

## Phase 1: 安全网 — 回收站 ✅

**优先级**: P0 🔴
**状态**: ✅ 已完成（2026-03-21）

### 1.1 实现清单

**数据层：**
- [x] Document 模型新增 `deletedAt DateTime?` 字段
- [x] 新增 `@@index([spaceId, deletedAt])` 复合索引
- [x] Prisma migration 已执行：`20260321063652_add_soft_delete_and_favorites`
- [x] 所有文档查询（`findAll`、`exists`）默认过滤 `deletedAt: null`

**API（6 个端点）：**
- [x] `DELETE /documents/:id` → 软删除（设置 `deletedAt`，子文档一并移入回收站）
- [x] `GET /documents/trash?spaceId=xxx` → 回收站列表（按删除时间倒序）
- [x] `POST /documents/:id/restore` → 恢复文档（连同子文档，记录 RESTORE 活动日志）
- [x] `DELETE /documents/:id/permanent` → 永久删除（仅对回收站内文档生效，需前端二次确认）

**前端：**
- [x] 侧栏底部固定「回收站」入口（文档树独立滚动，回收站不随文档滚动）
- [x] 全新 `/spaces/[id]/trash` 回收站页面：文档列表、剩余天数标签、恢复/永久删除按钮
- [x] 删除交互优化：toast 提示「已移至回收站」+ 蓝色撤销按钮
- [x] 文档树删除对话框文案改为「移至回收站」
- [x] 空间文档表格每行增加 hover 时显示的删除按钮

**相关文件：**
- `apps/api/prisma/schema.prisma` — `deletedAt` 字段 + 索引
- `apps/api/src/documents/documents.service.ts` — `remove`/`findTrash`/`restore`/`permanentlyDelete`
- `apps/api/src/documents/documents.controller.ts` — 4 个新端点
- `apps/web/src/app/(main)/spaces/[id]/trash/page.tsx` — 回收站页面
- `apps/web/src/hooks/use-documents.ts` — 删除改为软删除 + 撤销 toast
- `apps/web/src/components/layout/sidebar.tsx` — 侧栏回收站入口
- `apps/web/src/components/document/document-tree.tsx` — 删除对话框文案

### 1.2 待完善
- [ ] 30 天过期自动清理定时任务（需 cron job 或 NestJS Schedule）

---

## Phase 2: 协作闭环 — 通知系统 ✅

**优先级**: P0 🔴
**状态**: ✅ 已完成（2026-03-22）

### 2.1 实现清单

**数据层：**
- [x] `Notification` 模型（id/userId/type/title/body/sourceId/sourceType/actorId/spaceId/isRead/readAt）
- [x] `NotificationPreference` 模型（用户级通知偏好设置）
- [x] 8 种通知类型：SPACE_INVITATION / MEMBER_JOINED / ROLE_CHANGED / DOCUMENT_COMMENTED / DOCUMENT_MENTIONED / DOCUMENT_SHARED / DOCUMENT_UPDATED / SPACE_DELETED / SYSTEM

**API（8+ 端点）：**
- [x] `GET /notifications` — 获取通知列表（分页 + 类型筛选）
- [x] `GET /notifications/unread-count` — 未读数
- [x] `GET /notifications/sse` — SSE 实时推送通道
- [x] `PATCH /notifications/:id/read` — 标记单条已读
- [x] `PATCH /notifications/read-all` — 全部标记已读
- [x] `DELETE /notifications/:id` — 删除单条通知
- [x] `DELETE /notifications/clear-read` — 清除所有已读通知
- [x] `GET /notifications/preferences` — 获取通知偏好
- [x] `PATCH /notifications/preferences` — 更新通知偏好
- [x] `POST /notifications/cleanup` — 清理旧通知（管理员）

**前端：**
- [x] Header 右上角铃铛图标 + 未读数角标（`notification-bell.tsx`）
- [x] 通知下拉面板（`notification-dropdown.tsx`）：列表 / 标记已读 / 删除 / 筛选
- [x] SSE 实时推送连接，未读数实时更新
- [x] 设置页面通知偏好配置（`/settings/notifications`）

**实时推送：**
- [x] 采用 SSE（Server-Sent Events）方案，非轮询

**相关文件：**
- `apps/api/src/notifications/` — NotificationsModule/Controller/Service
- `apps/web/src/components/notification/` — notification-bell / notification-dropdown
- `apps/web/src/app/(main)/settings/notifications/page.tsx` — 通知偏好设置页

### 2.2 验收标准
- [x] @提及后对方收到通知
- [x] 评论/回复后相关方收到通知
- [x] 未读数实时更新（SSE）
- [x] 支持标记已读 / 全部已读
- [x] 通知偏好可自定义

---

## Phase 3: 效率提升 — 收藏与快捷访问 ✅

**优先级**: P1 🟡
**状态**: ✅ 已完成（2026-03-21）

### 3.1 实现清单

**数据层：**
- [x] 新增 `DocumentFavorite` 模型（userId + documentId 唯一约束）
- [x] `@@index([userId, createdAt(sort: Desc)])` 索引
- [x] User / Document 模型新增 `favorites` 关系
- [x] 与回收站共用同一次 migration

**API（4 个端点）：**
- [x] `POST /documents/:id/favorite` — 收藏（upsert 避免重复）
- [x] `DELETE /documents/:id/favorite` — 取消收藏（不存在时静默处理）
- [x] `GET /documents/favorites` — 收藏列表（自动过滤已删除文档，含 creator 信息）
- [x] `isFavorited()` 内部方法

**前端：**
- [x] 空间文档表格每行名称前有 ⭐ 星标按钮（乐观更新，点击切换）
- [x] Dashboard 新增「收藏文档」板块（amber 主题色，最多显示 6 个，有收藏才显示）
- [x] 侧栏主菜单新增「我的收藏」入口（`/favorites`）
- [x] 独立收藏页面 `/favorites`：分页表格（名称/所有者/更新时间/收藏时间/操作），可排序，分页器
- [x] 取消收藏按钮（amber 星标，hover 变灰）

**相关文件：**
- `apps/api/prisma/schema.prisma` — `DocumentFavorite` 模型
- `apps/api/src/documents/documents.service.ts` — `favorite`/`unfavorite`/`getFavorites`/`isFavorited`
- `apps/api/src/documents/documents.controller.ts` — 4 个收藏端点
- `apps/web/src/app/(main)/favorites/page.tsx` — 收藏页面（分页表格）
- `apps/web/src/app/(main)/spaces/[id]/page.tsx` — 文档表格星标按钮
- `apps/web/src/app/(main)/dashboard/page.tsx` — Dashboard 收藏板块
- `apps/web/src/components/layout/sidebar.tsx` — 侧栏「我的收藏」入口
- `apps/web/src/types/document.ts` — `DocumentFavorite` 类型
- `apps/web/src/services/document-service.ts` — 收藏相关 API 调用

---

## Phase 4: 内容流通 — 导入导出增强 ✅

**优先级**: P1 🟡
**状态**: ✅ 已完成（2026-03-23）

### 4.1 导出功能（早期已完成）

三种导出格式均为纯前端实现，无需服务端：
- [x] Markdown 导出（`exportAsMarkdown`）— 递归遍历 Tiptap JSON 生成 .md
- [x] HTML 导出（`exportAsHTML`）— 带 print-friendly CSS 的完整 HTML
- [x] PDF 导出（`exportAsPDF`）— html2canvas + jsPDF，支持 A4 分页
- [x] 编辑器菜单已集成三种导出选项

### 4.2 导入功能

**架构决策：纯前端解析**
- 使用 `markdown-it` 将 Markdown → HTML
- 使用 `mammoth` 将 DOCX → HTML
- 使用 `@tiptap/core` 的 `generateJSON()` 将 HTML → Tiptap JSON
- 通过已有的 `POST /documents` API 创建文档，无后端改动

**实现清单：**
- [x] 安装依赖：`markdown-it`、`markdown-it-task-lists`、`mammoth`
- [x] 提取共享 Extension 列表（`tiptap-extensions.ts`）— `generateJSON()` 需要扩展数组来理解 schema
- [x] 重构 `SimpleEditor` 使用共享 Extension 列表
- [x] 创建导入工具函数（`import-utils.ts`）— 支持 .md / .html / .htm / .docx
- [x] 创建 `ImportDocumentDialog` 组件 — 拖拽/点击选择文件、标题编辑、文件类型识别
- [x] 集成到空间页面 — "导入"按钮位于"新建文档"按钮旁
- [x] TypeScript 编译零错误

**相关文件：**
- `apps/web/src/lib/tiptap-extensions.ts` — 共享 Extension 列表
- `apps/web/src/lib/import-utils.ts` — 三种格式解析（parseMarkdownFile / parseHTMLFile / parseDocxFile）
- `apps/web/src/components/document/import-document-dialog.tsx` — 导入对话框
- `apps/web/src/components/tiptap-templates/simple/simple-editor.tsx` — 重构使用共享 Extensions
- `apps/web/src/app/(main)/spaces/[id]/page.tsx` — 空间页面集成导入按钮

### 4.3 验收标准
- [x] 可导出为 PDF / Markdown / HTML
- [x] 可从 .md 文件导入创建文档
- [x] 可从 .html 文件导入创建文档
- [x] 可从 .docx 文件导入创建文档
- [x] 导入后格式保持（标题、段落、列表、代码块、表格、图片链接）
- [x] 拖拽上传和点击选择均可用
- [x] 文件大小限制（10MB）和格式校验

---

## Phase 5: 知识网络 — 文档互链 ✅

**优先级**: P1 🟡
**状态**: ✅ 已完成（2026-03-23）

### 5.1 实现方案

**架构**：自定义 Tiptap Node（`documentLink`）+ `@tiptap/suggestion` 插件
- 输入 `[[` 触发文档搜索弹窗（复用 @mention 的 ReactRenderer + tippy.js 模式）
- 选择文档后插入内联 atom 节点（绿色 chip 样式，带文档图标）
- 节点存储 `documentId`、`spaceId`、`title` 属性
- 编辑模式单击选中，只读模式点击跳转
- 斜杠命令 `/链接文档` 也可触发

**实现清单：**
- [x] `document-link-extension.ts` — Node 扩展 + Suggestion 插件
- [x] `document-link-list.tsx` — 下拉搜索列表组件（键盘导航）
- [x] `document-link-suggestion.tsx` — 弹窗配置（ReactRenderer + tippy.js）
- [x] 注册到 SimpleEditor（新增 `documentId` prop 防止自链接）
- [x] 透传 `documentId` 到 Editor 和文档页面
- [x] 注册到共享扩展 `tiptap-extensions.ts`（支持 import/export）
- [x] Markdown 导出支持（`export-utils.ts`）
- [x] 斜杠命令"链接文档"（`slash-commands-items.ts`）
- [x] 绿色标签样式（`simple-editor.scss`）
- [x] TypeScript 编译零错误

**相关文件：**
- `apps/web/src/components/tiptap-extension/document-link/` — 扩展目录（4 个文件）
- `apps/web/src/components/tiptap-templates/simple/simple-editor.tsx` — 编辑器集成
- `apps/web/src/components/editor/editor.tsx` — 透传 documentId
- `apps/web/src/lib/tiptap-extensions.ts` — 共享扩展注册
- `apps/web/src/lib/export-utils.ts` — 导出支持

### 5.2 未来增强（v2）
- [ ] 反向链接面板（文档底部展示引用此文档的其他文档）
- [ ] 链接标题动态解析（目标文档重命名后自动更新）
- [ ] 失效链接提示（目标文档被删除时显示警告样式）
- [ ] 跨空间文档搜索

---

## Phase 6: AI 写作助手（5-7 天）

**优先级**: P2 🟠
**理由**: 2026 年文档产品的标配能力。不是差异化优势，而是没有会被淘汰。

### 6.1 功能设计

**触发方式：**
- 选中文本 → 浮动菜单出现「AI」按钮
- 空行输入 `/ai` 触发 AI 命令
- 快捷键 `Cmd+J` 打开 AI 面板

**AI 能力：**

| 能力 | 触发 | 说明 |
|------|------|------|
| 续写 | 选中 → 续写 / 空行 `/ai 续写` | 基于上下文继续写作 |
| 润色 | 选中 → 润色 | 改善表达、修正语法 |
| 缩写 | 选中 → 精简 | 压缩内容、提取要点 |
| 扩写 | 选中 → 扩展 | 丰富细节、补充论据 |
| 翻译 | 选中 → 翻译为 XX | 中英互译 |
| 总结 | 全文 → 生成摘要 | 文档顶部插入摘要 |
| 修改语气 | 选中 → 更正式/更轻松 | 调整写作风格 |

### 6.2 技术方案

**后端：**
- 新增 `AiModule`，封装 LLM API 调用（支持 OpenAI / Claude / 国产模型）
- Streaming 响应（SSE）实现打字机效果
- 用量统计 + 限流（免费用户 X 次/天）

**前端：**
- AI 浮动面板组件（选中文本时出现）
- 流式输出渲染（逐字插入编辑器）
- 「接受」/「拒绝」/「重试」操作按钮
- 历史对比：显示修改前后的 diff

### 6.3 验收标准
- [ ] 选中文本可触发 AI 操作
- [ ] 流式输出，打字机效果
- [ ] 可接受/拒绝 AI 生成结果
- [ ] 续写、润色、翻译、总结基本可用

---

## Phase 7: 数据洞察 ✅

**优先级**: P2 🟠
**状态**: ✅ 已完成（2026-03-23）

### 7.1 实现方案

**后端 API**（3 个新端点）：
- [x] `GET /activity/space/:spaceId/stats` — 空间统计（文档数、成员数、阅读量、增长趋势、热门文档 Top10、活跃成员 Top10、操作分布）
- [x] `GET /activity/document/:documentId/stats` — 文档阅读统计（UV/PV + 7 日趋势）
- [x] `GET /activity/my/stats` — 个人生产力（本周/上周创建数、编辑数、被阅读总次数）

**前端页面**：
- [x] 空间数据面板页面（`/spaces/[id]/analytics`）— 4 个概览卡片 + 4 个 recharts 图表
- [x] 空间页面"数据"快捷入口（BarChart3 图标）
- [x] 文档编辑器阅读统计徽章（Eye 图标 + PV 数字）
- [x] 个人 Dashboard 增强（本周创建/编辑 + vs 上周趋势 + 被阅读总次数）

**相关文件**：
- `apps/api/src/activity/activity.service.ts` — 3 个统计聚合方法
- `apps/api/src/activity/activity.controller.ts` — 3 个 API 端点
- `apps/web/src/services/activity-service.ts` — 前端调用 + 类型
- `apps/web/src/app/(main)/spaces/[id]/analytics/page.tsx` — 空间数据面板
- `apps/web/src/components/editor/document-stats-badge.tsx` — 阅读统计徽章
- `apps/web/src/app/(main)/dashboard/page.tsx` — Dashboard 增强

---

## 实施路线图

```
✅ 已完成   ┃ Phase 1: 回收站 ✅
           ┃ Phase 2: 通知系统 ✅
           ┃ Phase 3: 收藏功能 ✅
           ┃ Phase 4: 导入导出增强 ✅
           ┃ Phase 5: 文档互链 ✅
           ┃ Phase 7: 数据洞察 ✅
           ┃
待开发      ┃ Phase 6: AI 写作助手（5-7天）
           ┃ 缓冲 + Bug 修复 + 体验打磨
```

---

## 决策建议

### 如果时间紧张，必须做的（最小发布集）

**Phase 1 + Phase 2 + Phase 3** ✅ 已全部完成

这三个功能构成「可信赖的协作产品」的底线：
- 回收站 ✅ → 用户敢用（数据安全）
- 通知 ✅ → 协作有意义（闭环打通）
- 收藏 ✅ → 用得顺手（效率提升）

### 如果要对外推广，还需要加上

**+ Phase 4（导出）+ Phase 6（AI）**

- PDF 导出 → 商务场景可用
- AI → 产品卖点和传播点

### 如果定位知识库产品

**+ Phase 5（文档互链）+ Phase 7（数据）**

- 文档互链 → 知识网络效应
- 数据洞察 → 创作者激励循环

---

## 技术风险提示

| 风险 | 影响 | 缓解策略 |
|------|------|---------|
| ~~通知系统实时性~~ | ✅ 已解决 | 已采用 SSE 实时推送方案 |
| PDF 导出复杂排版 | 表格、代码块、图片分页 | 限定 A4 简洁样式，不追求完美还原 |
| AI API 成本 | 高频使用时费用可观 | 免费额度 + 用量限制 + 可选用户自备 API Key |
| 文档互链一致性 | 目标文档删除/移动后链接失效 | 软删除（回收站）+ 链接检查 + 优雅降级提示 |
