# Stage 6: 数据与洞察 (Post-MVP)

**状态**: 💡 规划中 (Post-MVP)  
**预计时间**: 3-4 周  
**目标**: 提供多维度的文档及工作空间访问行为分析，帮助内容创作者优化知识沉淀和团队信息流转。

---

## 概述

随着 DocStudio 内容的不断丰富，创作者和团队管理者需要了解知识的触达情况：

- 哪些文档最受欢迎？
- 公开分享的文档阅读量趋势如何？

Stage 6 致力于构建一套数据分析与洞察系统（Analytics），包括基础统计、访问轨迹和高级图表展示。它作为一个独立模块，在 v1 MVP 完成后再行开发，避免干扰核心协作功能的交付。

---

## 功能清单

### 1. 文档级基础数据分析 (Document Analytics)

这是最核心的需求，重点分析单篇文档的数据表现。

- **核心指标展示**：
  - **PV (Page Views)**：文档的总阅读次数。
  - **UV (Unique Visitors)**：独立访客数。
  - **访问者明细 (Visitor List)**：展现每一次的阅读记录，包含访问时间、所处地区（省份/城市），如果是未登录用户则标记为“游客”。
- **UI 展示层级**：
  - **文档详情页 Footer**：在文档内容底部显示本文档的访问总量（如 👁️ 1,234 次阅读）以及部分最近访客头像。
  - **文档 Analytics 面板**：在文档右上角提供入口，点击弹出一个侧边栏/模态框，展示该文档的访问图表趋势和带有地区信息的详细访客列表。

### 2. 工作空间级看板 (Space Dashboard)

面向该工作空间的所有成员或管理员，展示该空间整体的内容生态繁荣度。

- **展示位置**：**工作空间首页 (Space Home)**
  - 作为空间首页的默认模块或核心视图卡片。
- **概览面板**：
  - 整个工作空间内所有文档的总 PV/UV 汇总。
  - 最近 7 天/30 天的访问趋势面积图/折线图。
- **热门内容排行**：
  - 展现全空间阅读量最高的 Top 10 文档。
- **空间活跃度**：
  - 空间成员的贡献排行（创建文档数、获赞数等）。

### 3. 个人级数据仪表盘 (User Dashboard)

面向普通用户，用于追踪和管理**自己创建的内容**的受众数据。

- **展示位置**：全局导航的**个人仪表盘 (Dashboard) 页面**。
- **数据范围**：
  - 仅统计当前用户在所有工作空间中**创建或拥有的文档**的各项数据总和。
- **可视化图表**：
  - 用户个人作品的总阅读量与趋势图表。
  - 用户最近被访问的热闹文档动态。

面向内部团队协作场景，增强信息的到达率确认。

- **访问记录查询**：
  - 明确知道该用户在什么时间查看了文档。
- **阅读时长统计**（进阶）：
  - 记录用户在某个文档页面停留的有效阅读时长（排除页面后台挂起）。

### 4. 文档互动与评论 (Document Comments)

增强单篇文档的受众互动能力，打造更活跃的知识社区或团队交流氛围。

- **功能特性**：
  - **支持游客评论**：未登录的访问者依然能够留下评论。
  - **嵌套回复 (Threaded Replies)**：支持对某条评论进行次级回复（楼中楼模式）。
  - **身份标识 (Author Tag)**：如果评论者是该文档的作者（创建者），在其用户名称右侧会显式标记一个特殊的「作者」标签（如 🎖️ 作者）。
  - **访问特征展示**：在每条评论与回复的底部，显示该条评论的发表精确时间（如 "2小时前"）以及 IP 属地（如 "IP 属地：上海"）。
  - **点赞互动 (Like/Upvote)**：每条评论最右侧提供一个“爱心”点赞按钮。
    - **UI 状态**：点赞数为 0 时，只显示灰色空心爱心且不显示数字；点赞数 > 0 时，爱心转为实心，并在右侧显式展示具体数字。
    - **后台记录**：服务器严格记录每一位点赞者（包括注册用户和游客的设备指纹），防止恶意无限刷赞。
- **UI 布局**：
  - 放置在文档正文的底部（与文档访问总量 Footer 结合或在其下方），作为文档浏览的互动结尾。

### 5. 进阶体验与功能优化建议 (Optional Enhancements)

考虑到作为一个开放协作平台，数据与互动体系还可以往以下深度发展：

- **互动通知机制 (Notification)**：
  - 当一篇文档被评论，或一个用户的评论被他人回复/点赞时，应触发站内的顶部 "消息铃铛" 提醒（甚至可以扩展到邮件/微信推送），构成从互动到回访的闭环。
- **评论排序与热度算法**：
  - 除了默认的“按时间倒序”排列最近的评论，还应支持“按热度排序”（Top Comments），依据公式 `LikeCount * 权重 + 嵌套回复数 - 时间衰减`，让神评或最优解答浮在其顶部（特别是对于知识分享和 QA 文档）。
- **内容审核与软删除 (Soft Delete/Moderation)**：
  - 因为允许未登录的游客发表言论，极易引来大量无意义广告或违规发言。
  - 需要在 `Comment` 数据模型上增加一个 `isDeleted` 或者 `status` (pending/approved/declined) 字段，实现软删除和**敏感词预审系统**。超级管理员和该文档的 Owner 应具备直接删除某条不良评论的权限。
- **防止 XSS 攻击**：
  - 对用户输入的所有评论内容（尤其是富文本或涉及换行片段的）都必须经过后端的 `DOMPurify` 或者基于正则表达式的标签转义进行安全过滤，防止在详情页注入恶意脚本。

---

## 技术实现架构参考

为了不影响主业务数据库的性能，并满足未来大数据量的写入，需要采用适合高频写入的架构设计。

### 1. 数据模型设计 (PostgreSQL)

初期考虑到数据量不至于海量，可以先在 PostgreSQL 中增加相关统计表。若量级增大可引入 ClickHouse 或 Elasticsearch。

```prisma
model DocumentVisitLog {
  id          String   @id @default(cuid())
  docId       String
  document    Document @relation(fields: [docId], references: [id], onDelete: Cascade)

  // 访客信息
  userId      String?  // 登录用户则记录 ID，为 null 时表示游客 (Guest)
  user        User?    @relation(fields: [userId], references: [id])
  visitorId   String?  // 匿名用户的设备指纹 / Cookie ID（用于区分不同游客）

  // 访问特征
  ipAddress   String?  // 脱敏或原始 IP，用于解析地区
  region      String?  // 解析后的地区信息（例如：中国 上海市 / 美国 加利福尼亚州）
  userAgent   String?  // 浏览器与系统 UA
  referer     String?  // 来源页面

  // 访问记录
  visitedAt   DateTime @default(now()) // 每一次访问的精确时间
  duration    Int      @default(0) // 停留时长（秒）

  @@index([docId, visitedAt])
  @@index([userId, docId])
}

// 可选：为了避免高频 count 带来的性能开销，可以在 Document 增加缓存字段
model DocumentStats {
  id          String   @id @default(cuid())
  docId       String   @unique
  document    Document @relation(fields: [docId], references: [id], onDelete: Cascade)

  totalViews  Int      @default(0) // 累计 PV
  uniqueViews Int      @default(0) // 累计 UV
  updatedAt   DateTime @updatedAt
}

// 评论互动模型
model Comment {
  id          String    @id @default(cuid())
  docId       String
  document    Document  @relation(fields: [docId], references: [id], onDelete: Cascade)

  // 评论者信息
  userId      String?   // 为 null 时表示游客
  user        User?     @relation(fields: [userId], references: [id])
  visitorName String?   // 游客名称（可选填写，后端可自动生成佚名）

  // 内容与特征
  content     String    @db.Text
  ipAddress   String?   // 原始 IP 用于定位
  region      String?   // 解析后的评论属地（如：广东/香港）

  // 嵌套回复结构
  parentId    String?   // 如果有值，代表是一条回复
  parent      Comment?  @relation("CommentReplies", fields: [parentId], references: [id], onDelete: Cascade)
  replies     Comment[] @relation("CommentReplies")

  // 点赞关联与统计
  likes       CommentLike[]
  likeCount   Int       @default(0) // 快照数量，便于列表查询直接渲染

  createdAt   DateTime  @default(now())

  @@index([docId, createdAt])
  @@index([parentId])
}

// 评论点赞记录模型
model CommentLike {
  id          String   @id @default(cuid())
  commentId   String
  comment     Comment  @relation(fields: [commentId], references: [id], onDelete: Cascade)

  // 点赞者特征
  userId      String?  // 登录用户则记录 ID
  user        User?    @relation(fields: [userId], references: [id])
  visitorId   String?  // 游客标记

  createdAt   DateTime @default(now())

  // 为了限制同一个用户/设备刷赞，通常靠业务层兜底判断，但也可以建唯一索引（需要区分对待 userId 和 visitorId）
  @@index([commentId, userId, visitorId])
}
```

### 2. 后端服务端实现策略

#### API 设计

1. `POST /api/docs/:id/analytics/visit`：文档访问上报接口。
   - 前端在文档加载完毕后触发。
   - 后端通过请求头获取客户端 IP 并使用 IP 库（如 `geoip-lite` 或第三方 API）解析为具体 `region`（国家/省市）。
   - 若请求中不含有效的访问 Token，记录为游客（分配一个追踪的 `visitorId` 但 `userId` 为 null）。
   - **去重逻辑 (Debounce / Deduplication)**：通过缓存机制（如 Redis）记录 `docId:visitorId/userId` 的最近访问时间。如果在指定时间窗口内（如 30 分钟）同一用户/设备再次访问该文档，则**不新增访问记录表条目，仅更新原记录的最后活跃时间并累加时间**，避免刷量导致的无意义数据及 PV 异常飙升。
2. `POST /api/docs/:id/analytics/leave`：离开页面时上报阅读时长。
3. `GET /api/docs/:id/analytics/summary`：获取单篇文档的数据聚合（PV/UV、图表数据系列）。
4. `GET /api/docs/:id/analytics/logs`：获取访问明细列表（时间、地区、访问者身份）。
5. `GET /api/spaces/:id/analytics`：获取工作空间仪表盘数据。
6. `POST /api/docs/:id/comments`：发表评论/回复，同理需经请求头提取 IP 进行属地解析，无 Token 的则记作游客。
7. `GET /api/docs/:id/comments`：获取由该文档承载的分页评论及嵌套级联回复列表。
8. `POST /api/comments/:commentId/like`：对某条评论进行点赞/取消点赞的 Toggle 接口。后台校验此 `userId` 或 `visitorId` 是否已点过赞，防止重复叠加。

#### 高并发上报处理 (关键优化点)

直接在高频接口写入 PostgreSQL 会导致锁冲突及性能下降：

- **引入 Redis 缓冲层**：
  - 使用 Redis 的 `HyperLogLog` 结构统计近似 UV。
  - 使用 Redis 的 `Hash` 或计数器对 PV 进行累加。
  - 将 `DocumentVisitLog` 的明细数据推入 Redis Stream 或消息队列（如 RabbitMQ / Kafka）。
- **异步消费者持久化**：
  - NestJS 的微服务或后台定时任务 (Cron) 消费 Redis 数据，批量写入 PostgreSQL。

### 3. 前端实现策略

- **埋点与上报**：
  - 提供一个全局的 Hook：`useDocumentAnalytics(docId)`，在组件 `useEffect` 内处理挂载上报、卸载上报。
  - 区分“有效阅读”与“发呆”，监听 `visibilitychange`、`scroll` 鼠标事件，非活跃状态暂停计时。
- **可视化图表**：
  - 引入成熟的图表库，如 `Recharts`、`ECharts for React` 或 `Chart.js`，实现美观的大屏/仪表盘数据呈现。
- **防刷及去重机制**：
  - 同一个 IP/User 同一时间窗口内（推荐 30 分钟 - 1 小时）的连续打开/刷新，不会写入多条 Access Log，仅在当前会话记录上叠加阅读时长，或者做幂等处理。
  - 对于短时间（<3秒）即退出的访问，可以选择不记录，过滤掉无效爬虫和爬取试探。
  - 服务端接口启用 Rate Limiting，防止恶意脚本大规模刷 PV。

---

## 阶段推进建议

1. 首先实现**轻量级 MVP**：仅在数据库里增加简单的 Redis 计数，能够展示 PV/UV。
2. 后续迭代**完整追踪**：引入日志明细表，展现人员阅读列表。
3. 最终进化为**数据驾驶舱**：工作空间级别的完整仪表盘视图，面向大型企业或重度知识库社区用户。
