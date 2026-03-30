# DocStudio 开发计划

本目录包含 DocStudio v1 MVP 的完整开发规划，按阶段（Stage）组织。

---

## 📋 Stage 概览

| Stage | 名称             | 状态      | 预计时间 | 说明                                                 |
| ----- | ---------------- | --------- | -------- | ---------------------------------------------------- |
| 0     | 基础设施         | ✅ 已完成 | -        | 项目架构搭建、用户认证系统                           |
| 1     | 核心基础功能     | ✅ 已完成 | 4-6周    | 工作空间、文档CRUD、编辑器、文档树                   |
| 2     | 公开访问层       | ✅ 已完成 | 2-3周    | 首页、探索页、公开空间/文档浏览、SEO（sitemap/robots/JSON-LD/OG Tags） |
| 3     | 团队协作功能     | ✅ 已完成 | 3-4周    | 权限/成员/邀请/分享/分享管理/Rate Limiting 全部完成 |
| 4     | 高级功能         | ✅ 已完成 | 4-6周    | 实时协作、文件上传（Sharp 压缩+缩略图+附件）、版本历史、全文搜索、活动日志 |
| 5     | 超级管理员系统   | ✅ 已完成 | 2-3周    | 平台级管理控制台、用户管理、账号禁用删除             |
| 6     | 数据与洞察(Post) | ✅ 已完成 | 3-4周    | 已合并至 Stage 7 Phase 7（空间数据面板+文档统计+Dashboard 增强） |
| 7     | 产品打磨与增长   | ✅ 已完成 | 6-8周    | 回收站✅、通知✅、收藏✅、导入导出✅、文档互链✅、数据洞察✅、快捷键✅ |
| 8     | AI 辅助写作      | ✅ 已完成 | 2-3周    | AI 写作命令✅、Copilot 补全✅、AI 对话侧栏✅、AI 订阅制✅、AI 后台配置✅ |
| 9     | 上线前必备功能   | ✅ 已完成 | 2-3周    | 密码重置、邮箱验证、OAuth、错误页面、安全加固、移动端适配 |

**总预计时间**: 约 4-5 个月

---

## 📁 文档列表

- [Stage 0: 基础设施](./stage-0-基础设施.md) ✅
- [Stage 1: 核心基础功能](./stage-1-核心基础功能.md) ✅
- [Stage 2: 公开访问层](./stage-2-公开访问层.md) ✅
- [Stage 3: 团队协作功能](./stage-3-团队协作功能.md) ✅
- [Stage 4: 高级功能](./stage-4-高级功能.md) ✅
- [Stage 4 补充: 活动日志与最近访问](./stage-4-活动日志与最近访问.md) ✅
- [Stage 4 补充: 文档模板系统](./stage-4-文档模板.md) ✅
- [Stage 5: 超级管理员系统](./stage-5-超级管理员.md) ✅
- [Stage 6: 数据与洞察 (Post-MVP)](./stage-6-数据与洞察.md) ✅ (已合并至 Stage 7)
- [Stage 7: 产品打磨与增长](./stage-7-产品打磨与增长.md) ✅
- [Stage 8: AI 辅助写作](./stage-8-AI辅助写作.md) ✅
- [Stage 9: 上线前必备功能](./stage-9-上线前必备功能.md) ✅

---

## 🎯 产品定位

DocStudio 是一个**实时协作的知识管理平台**，具有两种使用模式：

### 🔒 私有模式（团队协作）

- 需要登录访问
- 团队成员协作编辑
- 严格的权限控制
- 可通过分享链接临时共享

### 🌐 公开模式（知识分享）

- 无需登录即可浏览
- 公开工作空间对所有人可见
- SEO 友好，可被搜索引擎索引
- 在项目首页展示

---

## 🚀 核心特性

1. **实时协作** - 多人同时编辑，冲突自动解决（Yjs + Hocuspocus）
2. **灵活权限** - 细粒度权限控制，公开/私有自由切换，文档级权限
3. **富文本编辑** - 基于 Tiptap，支持 Markdown、表格、代码块、Callout、数学公式、绘图等
4. **AI 辅助写作** - 续写/润色/翻译/摘要、Copilot 行内补全、AI 文档对话、深度思考模式
5. **文档互链** - `[[` 语法搜索和链接文档，构建知识网络
6. **导入导出** - 支持 Markdown/HTML/DOCX 导入，Markdown/HTML/PDF 导出
7. **数据洞察** - 空间数据面板、文档阅读统计、个人生产力指标
8. **通知系统** - SSE 实时推送，8 种通知类型，偏好设置
9. **版本历史** - 文档快照和版本恢复
10. **AI 订阅制** - 三档套餐（普通/VIP/Max），申请审批机制，按月/按年计费
11. **自托管** - 完全掌控数据，Docker 一键部署

---

## 📊 开发里程碑

### 🎯 Milestone 1: 基础可用（Stage 0-1）

**目标**: 单用户可以创建工作空间和文档，并进行编辑

- 用户注册登录 ✅
- 工作空间管理 ✅
- 文档 CRUD ✅
- 富文本编辑器 ✅
- 文档树导航 ✅

### 🎯 Milestone 2: 公开展示（Stage 2）✅

**目标**: 产品具备对外展示能力，支持知识分享

- 项目首页 ✅
- 公开工作空间展示 ✅（探索页 + 公开空间详情页）
- 公开内容浏览 ✅（公开文档只读阅读）
- SEO 优化 ✅（sitemap.xml / robots.txt / JSON-LD / OG & Twitter Cards）

### 🎯 Milestone 3: 团队协作（Stage 3）✅

**目标**: 支持团队内部协作和安全分享

- 权限管理系统 ✅
- 成员邀请和管理 ✅
- 私密分享链接 ✅
- 分享列表查询 API（`GET /share/doc/:docId/list`）✅
- 删除分享链接 API（`DELETE /share/:shareId`）✅
- 安全加固（`@nestjs/throttler` Rate Limiting + FastifyThrottlerGuard）✅
- 前端分享管理 UI（列表 + 创建 + 删除）✅

### 🎯 Milestone 4: 企业级（Stage 4）✅

**目标**: 功能完整的企业级文档协作平台

- 实时多人协作 ✅
- 文件和图片上传 ✅（Sharp 压缩 + 缩略图 + WebP 转换 + 通用附件）
- 版本历史和恢复 ✅
- 全文搜索 ✅
- 活动日志 / 最近访问 ✅

### 🎯 Milestone 5: 平台管理（Stage 5）✅

**目标**: 平台级管理能力，保障运营安全

- 超级管理员角色 ✅
- 用户管理控制台（查看/搜索/筛选/禁用/删除）✅
- 管理员专属侧边栏导航 ✅
- 超管账号自动 Bootstrap 初始化 ✅
- 账号禁用实时生效（JwtStrategy 实时查库）✅

### 🎯 Milestone 6: 数据与洞察（Stage 6 → 已合并至 Stage 7）✅

**目标**: 提供深度的数据统计能力，帮助分析内容价值与团队信息流转

- 空间数据面板（文档增长趋势、热门文档 Top10、活跃成员 Top10、操作分布）✅
- 文档阅读统计（PV/UV + 7 日趋势）✅
- 个人生产力指标（本周创建/编辑数 + 被阅读总次数）✅

### 🎯 Milestone 7: 产品打磨与增长（Stage 7）✅

**目标**: 从 MVP 走向可上线产品，补齐留存和增长的关键链路

- 回收站（软删除 + 30 天自动清理）✅
- 通知系统（SSE 实时推送 + 8 种通知类型 + 偏好设置）✅
- 收藏与快捷访问 ✅
- 导入导出增强（Markdown/HTML/PDF 导出 + Markdown/HTML/DOCX 导入）✅
- 文档互链（`[[` 语法搜索链接 + 分享页权限检查）✅
- 数据洞察（空间面板 + 文档统计 + Dashboard 增强）✅
- 快捷键弹窗 ✅

### 🎯 Milestone 8: AI 辅助写作（Stage 8）✅

**目标**: 为文档编辑器注入 AI 能力，提升写作效率

- AI 基础命令（续写/润色/翻译/摘要/扩写/缩写/自定义指令）✅
- AI 内联面板（选中文字下方弹出，输入框+预设命令+流式结果+操作按钮）✅
- Copilot 行内补全（ghost text + Tab 接受 + 800ms 防抖）✅
- AI 文档对话侧栏（多轮对话 + 文档上下文注入 + Markdown 渲染）✅
- AI 浮窗/侧栏双模式（可拖拽浮窗 + 可调宽侧栏）✅
- 深度思考模式（思考过程折叠显示）✅
- AI 后台配置（管理员设置 Provider/Key/Model/限额，支持恢复默认）✅
- AI 订阅制（三档套餐：普通/VIP/Max，申请审批，按月/按年，到期自动处理）✅
- LLM Provider 抽象层（OpenAI 兼容，支持 MiniMax/DeepSeek 等国产模型）✅

### 🎯 Milestone 9: 上线前必备功能（Stage 9）✅

**目标**: 补齐上线前的安全、合规和体验短板

- P0 上线阻断项：密码重置✅、邮箱验证✅、邮件服务✅、错误页面✅、安全 Headers✅、健康检查✅、隐私/服务条款✅
- P1 强烈推荐：OAuth 登录✅、新用户引导✅、移动端适配✅、全局错误边界✅、邮件通知✅、JWT 刷新✅、账号删除✅
- P2 体验打磨：空间转让✅、用户模板管理✅、面包屑导航✅、Cookie 同意✅、CI/CD✅、结构化日志✅

---

## 🛠️ 技术栈

### 前端

- **框架**: Next.js + React 19
- **编辑器**: Tiptap
- **协作**: Yjs + @hocuspocus/provider
- **样式**: Tailwind CSS
- **状态管理**: Zustand / React Query

### 后端

- **框架**: NestJS + Fastify
- **数据库**: PostgreSQL + Prisma
- **缓存**: Redis
- **协作服务**: Hocuspocus Server
- **对象存储**: MinIO
- **图像处理**: Sharp

### 部署

- **容器化**: Docker + Docker Compose
- **反向代理**: Nginx
- **监控**: Prometheus + Grafana

---

## 📖 使用指南

1. 按顺序阅读各个 Stage 的规划文档
2. 每个 Stage 文档包含：
   - 功能概述
   - 数据模型设计
   - API 接口设计
   - 前端功能设计
   - 技术实现要点
   - 验收标准
3. 开发时参考文档中的代码示例和最佳实践
4. 完成每个 Stage 后更新状态

---

## 📝 版本历史

- **2026-02-03**: 创建完整的 v1 MVP 规划文档
  - 定义 4 个开发阶段
  - 明确产品双模式定位
  - 细化所有功能的技术实现
- **2026-02-25**: 超级管理员系统（Stage 5）全部实现
  - 数据库扩展：`isSuperAdmin` / `isDisabled` 字段
  - 后端：`SuperAdminGuard`、`AdminModule`（6 个 API）、Bootstrap 自动初始化
  - 前端：`/admin/users` 用户管理页、侧边栏超管入口、路由守卫
- **2026-03-17**: 全文搜索功能（Stage 4 补充）已完成
  - 后端：SearchModule 全文搜索 API
  - 前端：全局搜索 UI，支持文档标题和内容搜索
  - 搜索结果高亮与跳转
- **2026-03-19**: Plan 审计与状态同步
  - Stage 2 更新为 ⚠️ 部分完成（首页/探索/公开浏览已完成，SEO 待补）
  - Stage 3 更新为 ⚠️ 部分完成（核心权限/邀请/分享已完成，管理 API 和安全加固待补）
  - Stage 4 高级功能更新为 ✅ 已完成
  - Stage 4 文档模板更新为 ✅ 已完成
  - 仪表盘/空间首页 UI 大幅升级（Hero Banner、动画、CountUp、卡片式布局）
  - 全局弹窗统一 AnimatedModal 动画
  - 侧边栏文档树 UI 升级
  - 用户菜单、Dropdown 组件优化（去黑边、圆角、图标容器）
  - 编辑器功能补全：Slash Commands、表格、Callout、@提及、图片上传+缩放
- **2026-03-17**: 活动日志与最近访问功能（Stage 4 补充）已完成
  - 数据库：ActivityLog（活动日志）+ DocumentVisit（最近访问）两表设计
  - 后端：ActivityModule（全局模块），3 个 API（最近文档/个人活动/空间活动）
  - 日志植入：DocumentsService（创建/查看/编辑/删除）、SpacesService（创建/加入/移除成员）
  - 前端：Dashboard 最近访问卡片 + 活动时间线、空间活动日志页面
  - 已删除文档保护：点击前验证存在性，toast 提示不跳转
  - 活动日志查看文档进入只读模式，提供"进入编辑"按钮

- **2026-03-20**: Stage 3 团队协作功能全部完成
  - 后端：`GET /share/doc/:docId/list`（分享列表查询）+ `DELETE /share/:shareId`（删除分享）
  - 安全加固：`@nestjs/throttler` 全局限流（60次/分钟）+ 密码验证限流（5次/5分钟/IP）
  - Fastify 适配：自定义 `FastifyThrottlerGuard` 正确获取客户端 IP
  - 前端 `ShareDialog` 升级：双视图（列表管理 + 创建链接），支持查看/复制/删除分享链接

- **2026-03-23**: Plan 审计 — Stage 7 Phase 2（通知系统）状态同步为已完成
  - 通知系统已实现：SSE 实时推送、8 种通知类型、通知偏好设置、未读数实时更新
  - 文档级权限控制已实现：可为单个文档设置独立的 EDITOR/VIEWER 权限
  - Stage 7 最小发布集（Phase 1 + 2 + 3）已全部完成

- **2026-03-26**: Stage 8 AI 辅助写作全部完成 + AI 订阅制
  - AI Phase 1: 基础写作命令（续写/润色/翻译/摘要/扩写/缩写/自定义）+ SSE 流式
  - AI Phase 2: Copilot 行内补全（ghost text + Tab 接受 + ProseMirror Decoration）
  - AI Phase 3: 文档 Q&A 对话侧栏（多轮对话 + 文档上下文 + Markdown 渲染）
  - AI 内联面板重构：选中文字下方弹出（输入框 + 预设命令 + 流式结果 + 操作栏）
  - AI 浮窗/侧栏双模式：可拖拽浮窗 + 可调宽侧栏 + 一键切换
  - 深度思考模式：输入框脑袋按钮切换，思考过程折叠显示
  - AI 后台配置：管理员页面配置 Provider/Key/Model/限额，支持恢复 .env 默认值
  - AI 订阅制：三档套餐（普通 30次/VIP 100次/Max 500次），申请审批，按月/按年（年付翻倍），自动到期处理 + 7 天预警
  - LLM Provider 抽象层：OpenAI 兼容接口，支持 MiniMax/DeepSeek 等国产模型
  - 选中文本气泡菜单重构：AI 创作 + 格式工具合并，BubbleMenu pluginKey 冲突修复
  - 图片气泡菜单：OCR 文字提取、样式调整、替换、删除
  - Bug 修复：getCdnUrl 头像修复、login console.log 清理、LoadingScreen z-index 修复

- **2026-03-23**: Stage 7 Phase 4-7 完成 + Stage 9 规划
  - Phase 4: 导入导出（markdown-it + mammoth 客户端解析，generateJSON 共享扩展列表）
  - Phase 5: 文档互链（`[[` 触发 Suggestion 搜索，分享页权限检查弹窗）
  - Phase 7: 数据洞察（空间数据面板 + 文档 PV/UV + Dashboard 生产力卡片）
  - 快捷键弹窗（编辑器更多菜单入口）
  - 分享页增强：文档链接权限检查 + 登录 returnTo 跳转
  - 文档 API 权限守卫（非空间成员拦截）
  - Stage 9 上线前必备功能清单（P0/P1/P2 分级，20 项）

- **2026-03-21**: Stage 7 Phase 1（回收站）+ Phase 3（收藏）已完成
  - 数据库：Document 新增 `deletedAt` 软删除字段 + `DocumentFavorite` 收藏模型
  - 后端：软删除/恢复/永久删除/回收站列表 + 收藏/取消/列表 共 8 个新 API
  - 前端：回收站页面（恢复/永久删除/剩余天数）、侧栏回收站入口（底部固定）
  - 前端：收藏星标（乐观更新）、收藏页面（分页表格）、Dashboard 收藏板块、侧栏「我的收藏」入口
  - 删除交互优化：toast「已移至回收站」+ 撤销按钮

- **2026-03-20**: Stage 2 SEO 补全 + Stage 4 文件上传补全
  - Stage 2 SEO 全部完成：`sitemap.xml` 动态生成、`robots.txt`、JSON-LD 结构化数据（WebSite/CollectionPage/Space/Article/Breadcrumb）、完整 OG/Twitter Card meta 标签
  - 探索页增强：排序选择器（最近更新/创建时间/文档数/名称）、每页数量选择（12/24/48）、页码分页器、后端 sort/order 参数
  - 公开文档工具栏：复制链接 / 导出 HTML / 打印
  - Stage 4 文件上传补全：Sharp 图片压缩（max 2560px, WebP quality 82）、200×200 缩略图生成、WebP 自动转换、通用附件上传（13 种 MIME 类型, 20MB）
  - 新增 `ImageProcessingService`、`POST /files/upload-attachment` 端点
  - 全局站点配置 `site-config.ts`（URL/SEO/keywords 统一管理）
  - 修复 4 个 TypeScript 编译错误（dashboard-stats / comment-bubble-menu / search-dialog / simple-editor / use-collaboration）

- **2026-03-30**: Stage 9 上线前必备功能全部完成 + README 状态同步
  - P0（7 项）：密码重置、邮箱验证、邮件服务（Nodemailer+SMTP+Handlebars）、404/500 错误页、Helmet 安全 Headers、Health Check、隐私/服务条款
  - P1（7 项）：OAuth 登录（Google+GitHub）、新用户引导（4 步弹窗）、移动端适配、全局错误边界、邮件通知、JWT 刷新（token 轮换）、账号删除（GDPR）
  - P2（6 项）：空间所有权转让、用户模板管理、面包屑导航、Cookie 同意横幅、CI/CD（GitHub Actions）、结构化日志（nestjs-pino）
  - 全部 9 个 Stage 共 20 项功能均已实现，项目达到 MVP 上线标准

---

## 🤝 贡献

如有建议或发现问题，请及时更新相关文档。

---

**让我们开始打造最好的文档协作平台！🚀**
