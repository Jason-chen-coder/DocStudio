# Stage 4: 高级功能

**状态**: ⚡ 待开发  
**预计时间**: 4-6 周  
**目标**: 提升协作体验和产品完整度

---

## 概述

Stage 4 是产品的高级功能阶段，将实现实时多人协作、文件上传和版本历史等功能，让 DocStudio 成为一个功能完整的企业级文档协作平台。

---

## 功能清单

### 1. 实时协作（Yjs + Hocuspocus）

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

model YjsUpdate {
  id        String   @id @default(cuid())
  docId     String
  document  Document @relation(fields: [docId], references: [id], onDelete: Cascade)
  update    Bytes    // Yjs 增量更新
  createdAt DateTime @default(now())

  @@index([docId, createdAt])
}
```

#### Hocuspocus 服务器配置

```typescript
import { Server } from '@hocuspocus/server';
import { Database } from '@hocuspocus/extension-database';

const server = Server.configure({
  port: 1234,

  extensions: [
    new Database({
      fetch: async ({ documentName }) => {
        // 从数据库加载文档
        const doc = await prisma.document.findUnique({
          where: { ydocKey: documentName },
        });
        return doc?.ydocData || null;
      },

      store: async ({ documentName, state }) => {
        // 保存文档到数据库
        await prisma.document.update({
          where: { ydocKey: documentName },
          data: { ydocData: state },
        });
      },
    }),
  ],

  // 权限验证
  async onAuthenticate({ token, documentName }) {
    // 验证 JWT token
    const user = await verifyJWT(token);

    // 检查用户是否有权限访问此文档
    const doc = await prisma.document.findUnique({
      where: { ydocKey: documentName },
      include: { space: true },
    });

    const hasPermission = await checkPermission(user.id, doc.spaceId);

    if (!hasPermission) {
      throw new Error('Unauthorized');
    }

    return { user };
  },
});
```

#### 前端实现

**安装依赖**

```bash
npm install @tiptap/extension-collaboration @tiptap/extension-collaboration-cursor yjs y-websocket
```

**编辑器配置**

```typescript
import { useEditor } from '@tiptap/react';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

const ydoc = new Y.Doc();

const provider = new WebsocketProvider('ws://localhost:1234', docId, ydoc, {
  params: {
    token: authToken, // JWT token
  },
});

const editor = useEditor({
  extensions: [
    StarterKit.configure({
      history: false, // 禁用默认历史，使用 Yjs 的历史
    }),
    Collaboration.configure({
      document: ydoc,
    }),
    CollaborationCursor.configure({
      provider: provider,
      user: {
        name: currentUser.name,
        color: generateUserColor(currentUser.id),
      },
    }),
  ],
});
```

#### 在线用户显示

**功能**

- 显示当前在线编辑的用户列表
- 用户头像 + 昵称
- 最多显示 5 个，超过显示 "+N"
- 鼠标悬停显示所有在线用户

**UI 设计**

```
┌────────────────────────────────────┐
│ 📄 文档标题    [👤][👤][👤] +2  💾 已保存 │
└────────────────────────────────────┘
```

**实现**

```typescript
const onlineUsers = provider.awareness.getStates();
const users = Array.from(onlineUsers.values())
  .map((state) => state.user)
  .filter((user) => user.id !== currentUser.id);
```

#### 光标位置提示

**功能**

- 显示其他用户的光标位置
- 光标旁边显示用户名
- 每个用户有独特的颜色
- 鼠标悬停显示用户详情

**效果**

```
文档内容 [张三的光标] 更多内容 [李四的光标]
```

**颜色生成**

```typescript
function generateUserColor(userId: string): string {
  const colors = [
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#FFA07A',
    '#98D8C8',
    '#F7DC6F',
    '#BB8FCE',
    '#85C1E2',
  ];
  const hash = userId.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  return colors[Math.abs(hash) % colors.length];
}
```

---

### 2. 文件上传与图像处理

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

**NestJS 集成**

```typescript
import { Injectable } from '@nestjs/common';
import * as Minio from 'minio';

@Injectable()
export class MinioService {
  private client: Minio.Client;

  constructor() {
    this.client = new Minio.Client({
      endPoint: 'localhost',
      port: 9000,
      useSSL: false,
      accessKey: 'minioadmin',
      secretKey: 'minioadmin',
    });
  }

  async uploadFile(bucket: string, filename: string, file: Buffer) {
    await this.client.putObject(bucket, filename, file);
    return this.client.presignedGetObject(bucket, filename, 24 * 60 * 60);
  }
}
```

#### 图像处理（Sharp）

**安装**

```bash
npm install sharp
```

**图片压缩和格式转换**

```typescript
import sharp from 'sharp';

async processImage(buffer: Buffer, options: {
  width?: number;
  height?: number;
  quality?: number;
}) {
  return sharp(buffer)
    .resize(options.width, options.height, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: options.quality || 80 })
    .toBuffer();
}

// 生成缩略图
async generateThumbnail(buffer: Buffer) {
  return sharp(buffer)
    .resize(200, 200, { fit: 'cover' })
    .webp({ quality: 70 })
    .toBuffer();
}
```

#### API 接口

**POST /upload/image**

- 功能：上传图片
- 权限：需要登录
- 请求：multipart/form-data
- 业务逻辑：
  1. 验证文件类型（jpg, png, gif, webp）
  2. 验证文件大小（< 5MB）
  3. 图片压缩和格式转换
  4. 生成缩略图
  5. 上传到 MinIO
  6. 返回 URL
- 响应：
  ```json
  {
    "url": "https://cdn.docstudio.com/images/xxx.webp",
    "thumbnail": "https://cdn.docstudio.com/images/xxx_thumb.webp",
    "size": 125678,
    "width": 1920,
    "height": 1080
  }
  ```

**POST /upload/file**

- 功能：上传附件
- 支持类型：pdf, doc, docx, xls, xlsx, zip 等
- 文件大小限制：< 20MB

#### 前端实现

**Tiptap 图片扩展**

```typescript
import Image from '@tiptap/extension-image';

const editor = useEditor({
  extensions: [
    Image.configure({
      inline: true,
      allowBase64: false,
    }),
  ],
});

// 插入图片
const insertImage = async (file: File) => {
  const formData = new FormData();
  formData.append('image', file);

  const { url } = await uploadImage(formData);

  editor.chain().focus().setImage({ src: url }).run();
};
```

**拖拽上传**

```typescript
const handleDrop = (event: DragEvent) => {
  const files = event.dataTransfer?.files;
  if (!files) return;

  Array.from(files).forEach((file) => {
    if (file.type.startsWith('image/')) {
      insertImage(file);
    }
  });
};
```

**粘贴上传**

```typescript
const handlePaste = (event: ClipboardEvent) => {
  const items = event.clipboardData?.items;
  if (!items) return;

  Array.from(items).forEach((item) => {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile();
      if (file) insertImage(file);
    }
  });
};
```

---

### 3. 版本历史与快照

#### 数据模型

```prisma
model DocumentSnapshot {
  id        String   @id @default(cuid())
  docId     String
  document  Document @relation(fields: [docId], references: [id], onDelete: Cascade)
  content   String   @db.Text // 快照内容
  message   String?  // 版本说明（可选）
  createdBy String
  creator   User     @relation(fields: [createdBy], references: [id])
  createdAt DateTime @default(now())

  @@index([docId, createdAt])
}
```

#### 快照策略

**自动快照**

- 每次保存文档时检查
- 如果距离上次快照超过 1 小时，创建新快照
- 每个文档最多保留 50 个快照（超过删除最旧的）

**手动快照**

- 用户可以手动创建快照
- 可以添加版本说明

#### API 接口

**GET /docs/:id/snapshots**

- 功能：获取文档的版本历史
- 权限：Space 成员
- 响应：
  ```json
  [
    {
      "id": "snapshot_id",
      "message": "添加了 API 文档章节",
      "creator": {
        "id": "user_id",
        "name": "张三"
      },
      "createdAt": "2026-02-03T10:00:00.000Z"
    }
  ]
  ```

**POST /docs/:id/snapshots**

- 功能：手动创建快照
- 权限：Space Editor/Owner
- 请求体：
  ```json
  {
    "message": "版本 1.0 发布"
  }
  ```

**GET /docs/:id/snapshots/:snapshotId**

- 功能：获取快照内容（预览）
- 权限：Space 成员
- 响应：快照的完整内容

**POST /docs/:id/restore/:snapshotId**

- 功能：恢复到指定版本
- 权限：Space Owner
- 业务逻辑：
  1. 创建当前版本的快照（自动）
  2. 将文档内容恢复到快照版本
  3. 记录恢复操作

#### 前端功能

**版本历史侧边栏**

- 位置：文档编辑页右侧
- 触发：点击"版本历史"按钮
- 展示：时间线式列表
  - 快照时间
  - 创建者
  - 版本说明
  - 操作按钮（预览、恢复）

**版本预览**

- 模态窗口展示快照内容
- 只读模式
- 显示差异对比（可选，使用 diff 库）
- "恢复此版本"按钮

**版本对比**（可选）

- 选择两个版本进行对比
- 高亮显示差异
- 类似 Git diff 的视图

---

## 技术实现要点

### Yjs 文档持久化

```typescript
// 定期保存 Yjs 文档
setInterval(async () => {
  const state = Y.encodeStateAsUpdate(ydoc);
  await saveYdocState(docId, state);
}, 30000); // 每 30 秒保存一次
```

### 文件上传性能优化

- 客户端压缩（浏览器端使用 Canvas API）
- 分片上传（大文件）
- 并行上传（多文件）
- 上传进度显示

### 快照性能优化

- 异步创建快照（不阻塞保存）
- 压缩快照内容（gzip）
- 定期清理旧快照

---

## 验收标准

### 实时协作

- ✅ 多个用户可以同时编辑同一文档
- ✅ 编辑内容实时同步
- ✅ 没有冲突问题
- ✅ 在线用户列表正确显示
- ✅ 光标位置提示正常工作
- ✅ 断线重连后数据不丢失

### 文件上传

- ✅ 可以上传图片到文档
- ✅ 图片自动压缩和格式转换
- ✅ 支持拖拽和粘贴上传
- ✅ 上传进度显示
- ✅ 可以上传附件

### 版本历史

- ✅ 自动创建快照
- ✅ 可以手动创建快照
- ✅ 可以查看版本历史
- ✅ 可以预览历史版本
- ✅ 可以恢复到历史版本
- ✅ 恢复操作可以撤销

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
- ✅ 文件上传
- ✅ 版本历史

可以开始内测和用户反馈收集，准备下一个版本的规划。
