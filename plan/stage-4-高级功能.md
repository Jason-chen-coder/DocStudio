# Stage 4: 高级功能

**状态**: ✅ 已完成
**更新时间**: 2026-03-20
**目标**: 提升协作体验和产品完整度

> **全部完成**: 实时协作（Yjs + Hocuspocus）、文件上传（MinIO + Sharp 图片处理 + 通用附件）、版本历史（自动/手动快照 + 恢复）、全文搜索、活动日志与最近访问

---

## 概述

Stage 4 是产品的高级功能阶段，将实现实时多人协作、文件上传和版本历史等功能，让 DocStudio 成为一个功能完整的企业级文档协作平台。

---

## 功能清单

### 1. 实时协作（Yjs + Hocuspocus）✅ 已完成

#### 实现状态

| 功能 | 状态 | 实现位置 |
|------|------|---------|
| Hocuspocus Server | ✅ | `apps/api/src/collaboration/collaboration.service.ts` |
| Yjs 文档持久化（ydocKey + ydocData） | ✅ | Prisma schema + Hocuspocus Database extension |
| WebSocket JWT 鉴权 | ✅ | `onAuthenticate` hook 验证 JWT + 空间权限 + 禁用状态 |
| VIEWER 只读模式 | ✅ | WebSocket 鉴权返回 readOnly 标志 |
| 前端协作接入 | ✅ | `use-collaboration.ts` hook + `HocuspocusProvider` |
| 协作光标（yCursorPlugin） | ✅ | `custom-collaboration.ts` + y-prosemirror plugins |
| 在线用户头像栈 | ✅ | `online-users.tsx`（最多 5 个 + "+N"溢出） |
| 用户颜色生成 | ✅ | `generateUserColor()` 10 色板 hash 映射 |
| IndexedDB 离线缓存 | ✅ | `y-indexeddb` persistence |
| 断线重连 | ✅ | 指数退避策略（delay: 1000, maxAttempts: 30） |
| WebSocket 压缩 | ✅ | perMessageDeflate (Zlib) |
| 保存节流 | ✅ | debounce 2s, maxDebounce 30s |

> **注**: 未实现 `YjsUpdate` 增量更新表（计划中有），实际采用直接存储 `ydocData` 完整二进制的方式，效果等价且更简洁。

#### 技术架构

**核心技术**

- **Yjs**: CRDT（无冲突复制数据类型）库
- **Hocuspocus**: Yjs 的 WebSocket 服务器
- **Tiptap Collaboration Extension**: Tiptap 的协作扩展

**架构图**

```
Client 1 (Tiptap + Yjs)
    ↓ WebSocket
Hocuspocus Server (Yjs + Auth)
    ↓ WebSocket
Client 2 (Tiptap + Yjs)
    ↓
PostgreSQL (持久化 Yjs 更新)
```

#### 数据模型更新

```prisma
model Document {
  // ... 现有字段
  ydocKey   String   @unique // Yjs document key
  ydocData  Bytes?   // Yjs 文档二进制数据
}
```

#### 在线用户显示

**功能**

- 显示当前在线编辑的用户列表
- 用户头像 + 昵称
- 最多显示 5 个，超过显示 "+N"
- 鼠标悬停显示所有在线用户

#### 光标位置提示

**功能**

- 显示其他用户的光标位置
- 光标旁边显示用户名
- 每个用户有独特的颜色（10 色板 hash 映射）

---

### 2. 文件上传与图像处理 ✅ 已完成

#### 实现状态

| 功能 | 状态 | 实现位置 |
|------|------|---------|
| MinIO 对象存储 | ✅ | `apps/api/src/common/minio/minio.service.ts` |
| Docker Compose MinIO 服务 | ✅ | `docker-compose.yml`（端口 9000/9001） |
| Bucket 自动创建 + 公开读策略 | ✅ | MinioService 初始化逻辑 |
| POST /files/upload API | ✅ | `apps/api/src/files/files.controller.ts` |
| POST /files/upload-attachment API | ✅ | 通用附件上传（pdf/doc/xlsx/zip 等，20MB 限制） |
| 文件类型校验（jpg/png/gif/webp/svg） | ✅ | Controller 内白名单校验 |
| 文件大小限制（图片 5MB / 附件 20MB） | ✅ | Controller 内校验 + Fastify 全局 20MB |
| 前端图片粘贴上传 | ✅ | `image-extension.ts` PasteHandler plugin |
| 前端图片拖拽上传 | ✅ | `image-extension.ts` DropHandler plugin |
| 上传进度条 | ✅ | `image-upload-node` 组件 |
| 取消上传（AbortController） | ✅ | `image-upload-node` 组件 |
| **Sharp 图片压缩** | ✅ | `image-processing.service.ts`（最大 2560px，WebP quality 82） |
| **缩略图生成** | ✅ | 200×200 cover 缩略图，WebP quality 70 |
| **WebP 自动转换** | ✅ | jpg/png/webp → WebP，GIF/SVG 保持原格式 |
| **通用附件上传（pdf/doc/zip）** | ✅ | 13 种 MIME 类型，20MB 限制 |

#### MinIO 对象存储

**Docker Compose 配置**

```yaml
services:
  minio:
    image: minio/minio
    ports:
      - '9000:9000'
      - '9001:9001'
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data
```

#### 前端实现

- Tiptap 图片扩展：`ImageExtension` 自定义 plugin（粘贴 + 拖拽）
- 图片上传节点：`ImageUploadNode` React NodeView（进度条 + 取消按钮）
- 图片缩放：编辑器内拖拽调整图片大小

---

### 3. 版本历史与快照 ✅ 已完成

#### 实现状态

| 功能 | 状态 | 实现位置 |
|------|------|---------|
| DocumentSnapshot 数据模型 | ✅ | Prisma schema（含 ydocData 二进制字段） |
| GET /documents/:docId/snapshots | ✅ | `snapshots.controller.ts` |
| POST /documents/:docId/snapshots | ✅ | 手动快照 + 版本说明 |
| GET /documents/:docId/snapshots/:id | ✅ | 快照内容预览（Yjs 二进制解码 → Tiptap JSON） |
| POST /documents/:docId/snapshots/:id/restore | ✅ | 恢复 + 连接锁机制 |
| 自动快照 | ✅ | 30 分钟间隔，每文档最多 50 个，自动裁剪 |
| 恢复锁（Restore Lock） | ✅ | Mutex-like Set 防止 Hocuspocus 覆盖恢复数据 |
| 前端版本历史面板 | ✅ | `version-history-panel` 组件 |
| 快照预览弹窗 | ✅ | 只读模式展示快照内容 |
| 恢复确认对话框 | ✅ | 恢复前确认 + toast 提示 |

#### 数据模型

```prisma
model DocumentSnapshot {
  id        String   @id @default(cuid())
  docId     String
  document  Document @relation(fields: [docId], references: [id], onDelete: Cascade)
  content   String   @db.Text
  ydocData  Bytes?
  message   String?
  createdBy String
  creator   User     @relation(fields: [createdBy], references: [id])
  createdAt DateTime @default(now())

  @@index([docId, createdAt])
}
```

#### 快照策略

**自动快照**

- 每次 Hocuspocus store 时检查
- 距离上次快照超过 30 分钟则创建新快照
- 每个文档最多保留 50 个快照（超过删除最旧的）
- 异步 fire-and-forget，不阻塞保存

**手动快照**

- 用户可以手动创建快照
- 可以添加版本说明

**恢复机制**

- 恢复前自动创建当前版本快照
- Mutex 锁定文档 5 秒，防止 Hocuspocus 内存覆盖
- 强制卸载内存文档，下次连接从 DB 加载最新数据

---

## 技术实现要点

### Yjs 文档持久化

- Hocuspocus Database extension 自动管理 fetch/store
- debounce 2s + maxDebounce 30s 批量写入
- WebSocket 级压缩减少带宽

### 文件上传

- Fastify multipart 原生处理（非 Express multer）
- MinIO 公开读策略，前端直接访问图片 URL
- 前端通过 CDN URL 映射（开发: localhost:9000, 生产: Nginx 反代）

### 快照性能优化

- 异步创建快照（不阻塞保存）
- Yjs 二进制快照（`Y.encodeSnapshot`）紧凑存储
- 定期清理旧快照（max 50 per doc）
- 恢复锁防止数据竞争

---

## 验收标准

### 实时协作

- ✅ 多个用户可以同时编辑同一文档
- ✅ 编辑内容实时同步
- ✅ 没有冲突问题（CRDT）
- ✅ 在线用户列表正确显示
- ✅ 光标位置提示正常工作
- ✅ 断线重连后数据不丢失

### 文件上传

- ✅ 可以上传图片到文档
- ✅ 图片自动压缩和 WebP 转换（Sharp, max 2560px, quality 82）
- ✅ 自动生成 200×200 封面缩略图
- ✅ 支持拖拽和粘贴上传
- ✅ 上传进度显示
- ✅ 可以上传附件（pdf/doc/xlsx/ppt/zip 等 13 种类型，20MB 限制）

### 版本历史

- ✅ 自动创建快照（30 分钟间隔）
- ✅ 可以手动创建快照
- ✅ 可以查看版本历史
- ✅ 可以预览历史版本
- ✅ 可以恢复到历史版本
- ✅ 恢复前自动保存当前版本（可回退）

---

## 补充功能（已在独立 plan 文件中）

以下功能属于 Stage 4 范畴，已单独成文并完成：

- **全文搜索** ✅ — `SearchModule` + 全局搜索 UI（⌘K），见 `stage-4` 相关说明
- **活动日志与最近访问** ✅ — `ActivityModule` + Dashboard 最近访问/活动时间线，见 `stage-4-活动日志与最近访问.md`
- **文档模板系统** ✅ — 三级作用域模板（SYSTEM/SPACE/USER），见 `stage-4-文档模板.md`

---

## Phase: 代码块增强（语法高亮 + 语言选择器）✅ 已完成

**完成时间**: 2026-03-19

| 功能 | 状态 | 实现位置 |
|------|------|---------|
| CodeBlockLowlight + createLowlight(all) 全语言高亮 | ✅ | `simple-editor.tsx` |
| GitHub Light / Dark 语法高亮 CSS（全 hljs token） | ✅ | `code-block-node/code-block-node.scss` |
| ReactNodeViewRenderer 自定义代码块 NodeView | ✅ | `code-block-node/code-block-extension.ts` |
| 语言选择器下拉菜单（26 种常用语言 + 搜索 + 键盘导航） | ✅ | `code-block-node/code-block-node-view.tsx` |
| 代码块复制按钮（clipboard 反馈） | ✅ | `code-block-node/code-block-node-view.tsx` |
| 只读模式隐藏下拉箭头、禁用切换 | ✅ | `code-block-node/code-block-node-view.tsx` |
| 修复下拉菜单被 overflow:hidden 裁剪 | ✅ | `code-block-node/code-block-node.scss` |

---

## Phase: 编辑器性能优化 + 协作样式增强 ✅ 已完成

**完成时间**: 2026-03-19

| 功能 | 状态 | 实现位置 |
|------|------|---------|
| `shouldRerenderOnTransaction: false` 减少重渲染 | ✅ | `simple-editor.tsx` |
| 远程协作光标样式（闪烁 + 出现动画 + 用户名标签 2.5s） | ✅ | `simple-editor.scss` |
| 远程用户选区高亮（selectionBuilder + DecorationAttrs） | ✅ | `custom-collaboration.ts` |
| hexToRgba 工具函数 | ✅ | `custom-collaboration.ts` |

---

## Phase: 分享页面 UI 重设计 ✅ 已完成

**完成时间**: 2026-03-19

| 功能 | 状态 | 实现位置 |
|------|------|---------|
| 顶部导航栏（应用图标 + 标题面包屑 + 分享/复制 + 只读徽章） | ✅ | `share/[token]/page.tsx` |
| 骨架屏加载状态 | ✅ | `share/[token]/page.tsx` |
| 错误状态卡片（AlertTriangle + 重试） | ✅ | `share/[token]/page.tsx` |
| 密码门重设计（锁图标 + 渐变按钮） | ✅ | `share/[token]/page.tsx` |
| 作者信息卡片（头像光环 + 渐变分割线 + 相对时间 + 品牌水印） | ✅ | `share/[token]/page.tsx` |
| 左上角 Logo 点击跳转首页 | ✅ | `share/[token]/page.tsx` |

---

## Phase: 分享页面内容渲染修复 ✅ 已完成

**完成时间**: 2026-03-19

| 功能 | 状态 | 实现位置 |
|------|------|---------|
| 修复 tagToTiptapType camelCase 问题（bulletList/taskItem 等） | ✅ | `apps/api/src/common/ydoc-utils.ts` |

> Yjs 存储 camelCase 节点名，之前错误地全部小写化导致 Tiptap 无法识别。改为先查 HTML 标签映射表，未命中则直接透传 camelCase 名称。

---

## Phase: 空间首页优化（文档列表 + 布局重构）✅ 已完成

**完成时间**: 2026-03-20

| 功能 | 状态 | 实现位置 |
|------|------|---------|
| 文档列表改为可排序表格（名称/所有者/更新时间/创建时间/操作） | ✅ | `spaces/[id]/page.tsx` |
| 按名称/更新时间/创建时间排序（升序/降序） | ✅ | `spaces/[id]/page.tsx` |
| 响应式列隐藏（sm/md/lg 断点） | ✅ | `spaces/[id]/page.tsx` |
| API findAll 补充返回 createdAt + creator 字段 | ✅ | `documents.service.ts` |
| 固定头部卡片 + 文档表格占满剩余空间独立滚动 | ✅ | `spaces/[id]/page.tsx` |
| 头部卡片（空间名/标签/描述/统计/快捷操作） | ✅ | `spaces/[id]/page.tsx` |
| 表头 sticky + backdrop-blur 毛玻璃 | ✅ | `spaces/[id]/page.tsx` |
| 操作列始终显示 | ✅ | `spaces/[id]/page.tsx` |
| 空状态引导 + 骨架屏加载态 | ✅ | `spaces/[id]/page.tsx` |

---

## v1 MVP 完成标志

完成 Stage 4 后，DocStudio v1 MVP 正式完成！系统已具备：

- ✅ 完整的用户认证
- ✅ 工作空间和文档管理
- ✅ 富文本编辑器
- ✅ 公开知识分享
- ✅ 团队权限管理
- ✅ 私密分享
- ✅ 实时多人协作
- ✅ 文件上传（图片 Sharp 压缩/缩略图/WebP + 通用附件）
- ✅ 版本历史
- ✅ 全文搜索
- ✅ 活动日志与最近访问
- ✅ 文档模板系统

可以开始内测和用户反馈收集，准备下一个版本的规划。
