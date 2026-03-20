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
| 6     | 数据与洞察(Post) | 💡 规划中 | 3-4周    | 文档访问统计、PV/UV、热门文档、仪表盘看板            |

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
- [Stage 6: 数据与洞察 (Post-MVP)](./stage-6-数据与洞察.md) 💡

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

1. **实时协作** - 多人同时编辑，冲突自动解决
2. **灵活权限** - 细粒度权限控制，公开/私有自由切换
3. **富文本编辑** - 基于 Tiptap，支持 Markdown、表格、代码块等
4. **文档树结构** - 层级组织，拖拽排序
5. **公开分享** - 工作空间级别的公开展示
6. **私密分享** - 带密码和有效期的临时分享
7. **版本历史** - 文档快照和版本恢复
8. **文件上传** - 图片和附件支持
9. **自托管** - 完全掌控数据，Docker 一键部署

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

### 🎯 Milestone 6: 数据与洞察（Stage 6 - Post-MVP）

**目标**: 提供深度的数据统计能力，帮助分析内容价值与团队信息流转

- 文档级基础统计（PV/UV/访问列表）
- 工作空间级聚合分析看板
- 访问轨迹与阅读时长深度分析

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

- **2026-03-20**: Stage 2 SEO 补全 + Stage 4 文件上传补全
  - Stage 2 SEO 全部完成：`sitemap.xml` 动态生成、`robots.txt`、JSON-LD 结构化数据（WebSite/CollectionPage/Space/Article/Breadcrumb）、完整 OG/Twitter Card meta 标签
  - 探索页增强：排序选择器（最近更新/创建时间/文档数/名称）、每页数量选择（12/24/48）、页码分页器、后端 sort/order 参数
  - 公开文档工具栏：复制链接 / 导出 HTML / 打印
  - Stage 4 文件上传补全：Sharp 图片压缩（max 2560px, WebP quality 82）、200×200 缩略图生成、WebP 自动转换、通用附件上传（13 种 MIME 类型, 20MB）
  - 新增 `ImageProcessingService`、`POST /files/upload-attachment` 端点
  - 全局站点配置 `site-config.ts`（URL/SEO/keywords 统一管理）
  - 修复 4 个 TypeScript 编译错误（dashboard-stats / comment-bubble-menu / search-dialog / simple-editor / use-collaboration）

---

## 🤝 贡献

如有建议或发现问题，请及时更新相关文档。

---

**让我们开始打造最好的文档协作平台！🚀**
