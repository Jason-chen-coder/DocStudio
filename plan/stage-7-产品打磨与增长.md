# Stage 7: 产品打磨与增长

**状态**: 🔄 进行中（Phase 1 + Phase 3 已完成）
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
| **无通知系统** | 🔴 致命 | @提及和评论已实现，但被提及方完全无法感知。协作闭环断裂。 |
| ~~无回收站~~ | ✅ 已解决 | 软删除 + 30天自动清理 + 回收站页面 + 恢复/永久删除 |
| ~~无收藏/置顶~~ | ✅ 已解决 | DocumentFavorite 模型 + 星标按钮 + 收藏页面（分页表格）+ Dashboard 板块 |
| **无 PDF 导出** | 🟡 高 | 商务场景刚需（合同、报告、方案），当前仅支持 Markdown/HTML。 |
| **无导入功能** | 🟡 高 | 新用户迁移成本高，无法从 Markdown/Word 导入。 |
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

## Phase 2: 协作闭环 — 通知系统（5-7 天）

**优先级**: P0 🔴
**理由**: @提及和评论没有通知 = 没有意义。这是协作产品最核心的链路。

### 2.1 功能设计

**通知触发场景（按优先级）：**

| 场景 | 接收方 | 优先级 |
|------|--------|--------|
| 被 @提及 | 被提及的用户 | 最高 |
| 文档收到新评论 | 文档创建者 | 高 |
| 评论被回复 | 原评论者 | 高 |
| 被邀请加入空间 | 被邀请者 | 中 |
| 文档被分享给你 | 被分享者 | 中 |
| 你的文档被编辑 | 文档创建者 | 低（聚合） |

### 2.2 实现要点

**数据层：**
```prisma
model Notification {
  id         String   @id @default(cuid())
  userId     String                         // 接收者
  type       NotificationType               // MENTION / COMMENT / REPLY / INVITE / SHARE / EDIT
  title      String
  body       String?
  sourceId   String?                        // 触发源 ID（文档/评论/空间）
  sourceType String?                        // DOCUMENT / COMMENT / SPACE
  actorId    String                         // 触发者
  spaceId    String?
  isRead     Boolean  @default(false)
  readAt     DateTime?
  createdAt  DateTime @default(now())

  user  User @relation(fields: [userId], references: [id], onDelete: Cascade)
  actor User @relation("NotificationActor", fields: [actorId], references: [id])

  @@index([userId, isRead, createdAt])
}
```

**API：**
- `GET /notifications` — 获取通知列表（分页 + 未读筛选）
- `GET /notifications/unread-count` — 未读数（轮询或 SSE）
- `PATCH /notifications/:id/read` — 标记已读
- `PATCH /notifications/read-all` — 全部标记已读

**前端：**
- Header 右上角铃铛图标 + 红色未读数角标
- 点击弹出通知面板（Popover）
  - 「全部」/「未读」Tab 切换
  - 每条通知：触发者头像 + 描述 + 时间 + 跳转链接
  - 「全部已读」按钮
- 点击通知跳转到对应文档/评论位置

**实时推送（可选增强）：**
- 初期用轮询（30s 间隔查未读数）
- 后期可升级为 SSE 或复用 WebSocket 通道

### 2.3 验收标准
- [ ] @提及后对方收到通知
- [ ] 评论/回复后相关方收到通知
- [ ] 点击通知跳转到对应位置
- [ ] 未读数实时更新
- [ ] 支持标记已读 / 全部已读

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

## Phase 4: 内容流通 — 导入导出增强（3-4 天）

**优先级**: P1 🟡
**理由**: 导出满足商务需求，导入降低迁移成本，两者都是用户决定是否长期使用的关键因素。

### 4.1 PDF 导出

**技术方案**：服务端使用 Puppeteer（或 Playwright）渲染 HTML → PDF

- 复用已有的 `exportAsHTML()` 生成带样式 HTML
- 服务端接收 HTML，通过 headless browser 渲染为 PDF
- 支持 A4 分页、页眉页脚、封面页

**API：**
- `POST /documents/:id/export/pdf` — 返回 PDF 文件流

**前端：**
- 编辑器工具栏 / 文档菜单中添加「导出」下拉菜单
- 选项：Markdown / HTML / PDF

### 4.2 Markdown 导入

- 前端文件选择器 → 读取 .md 文件内容
- 使用 Tiptap 的 Markdown → ProseMirror 解析（或 markdown-it + 自定义转换）
- 创建新文档并填充解析后的内容

### 4.3 Word 导入（可选）

- 使用 `mammoth.js` 将 .docx 转换为 HTML
- 再通过 Tiptap 的 `setContent(html)` 导入
- 可作为增强项后续迭代

### 4.4 验收标准
- [ ] 可导出为 PDF（正确分页、样式保持）
- [ ] 可从 .md 文件导入创建文档
- [ ] 导入后格式基本保持（标题、列表、代码块、图片链接）

---

## Phase 5: 知识网络 — 文档互链与反向链接（3-4 天）

**优先级**: P1 🟡
**理由**: 知识库的核心价值是知识的连接。文档互链让零散文档变成有结构的知识网络。

### 5.1 功能设计

**文档链接：**
- Slash Command `/link` 或输入 `[[` 触发文档搜索
- 下拉列表搜索当前空间文档
- 选择后插入为内部链接（可点击跳转）
- 链接样式：带文档图标的 chip，区别于普通 URL 链接

**反向链接面板：**
- 文档底部或侧栏展示「引用了此文档的其他文档」
- 帮助用户发现文档之间的关联

### 5.2 实现要点

- 自定义 Tiptap Mark 或 Node：`docLink`，存储 `{ docId, title }`
- 解析文档内容中的 docLink 节点，建立反向索引
- 渲染时检查目标文档是否存在（处理已删除的情况）

### 5.3 验收标准
- [ ] `[[` 触发文档搜索并插入链接
- [ ] 点击链接跳转到目标文档
- [ ] 文档底部显示反向链接列表
- [ ] 目标文档被删除时链接优雅降级

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

## Phase 7: 数据洞察（Stage 6 已规划）（4-5 天）

**优先级**: P2 🟠
**理由**: 内容创作者需要反馈循环。知道"谁在看我的文档"能激励持续创作。

> 详细设计见 `stage-6-数据与洞察.md`，此处列出核心优先项：

- 文档阅读量统计（PV/UV）
- 空间数据面板（文档增长趋势、活跃成员排行）
- 个人工作台数据卡片（本周创建/编辑文档数、被阅读次数）

---

## 实施路线图

```
第 1 周    ┃ Phase 1: 回收站（3天）
           ┃ Phase 3: 收藏功能（2天）← 可与回收站并行
           ┃
第 2-3 周  ┃ Phase 2: 通知系统（5-7天）← 最关键，需要充足时间
           ┃
第 4 周    ┃ Phase 4: 导入导出增强（3-4天）
           ┃
第 5 周    ┃ Phase 5: 文档互链（3-4天）
           ┃
第 6-7 周  ┃ Phase 6: AI 写作助手（5-7天）
           ┃
第 8 周    ┃ Phase 7: 数据洞察（4-5天）
           ┃ 缓冲 + Bug 修复 + 体验打磨
```

---

## 决策建议

### 如果时间紧张，必须做的（最小发布集）

**Phase 1 + Phase 2 + Phase 3**（约 2 周）

这三个功能构成「可信赖的协作产品」的底线：
- 回收站 → 用户敢用（数据安全）
- 通知 → 协作有意义（闭环打通）
- 收藏 → 用得顺手（效率提升）

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
| 通知系统实时性 | 用户期望即时通知 | 初期轮询，后续升级 SSE/WebSocket |
| PDF 导出复杂排版 | 表格、代码块、图片分页 | 限定 A4 简洁样式，不追求完美还原 |
| AI API 成本 | 高频使用时费用可观 | 免费额度 + 用量限制 + 可选用户自备 API Key |
| 文档互链一致性 | 目标文档删除/移动后链接失效 | 软删除（回收站）+ 链接检查 + 优雅降级提示 |
