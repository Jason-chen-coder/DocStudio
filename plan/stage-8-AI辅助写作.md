# Stage 8: AI 辅助写作

**预计周期**: 2-3 周
**优先级**: P1（2026 年文档产品标配能力，没有会被淘汰）
**前置依赖**: Stage 7 Phase 1-7 均已完成

---

## 一、市场调研

### 1.1 Tiptap 官方 AI 能力

Tiptap 提供三类 AI 扩展（**均为付费**，需私有 npm 源）：

| 扩展 | 价格 | 功能 |
|------|------|------|
| **AI Generation** (`@tiptap-pro/extension-ai`) | $49/月起 | Tab 触发补全、文本命令（摘要/改写/翻译）、流式输出、图片生成（DALL-E 3） |
| **AI Suggestion** | Business 计划 | 基于规则的 AI 建议、多选项呈现、内容锁定、自定义 LLM |
| **AI Toolkit** (Beta, 2026 替代上面两个) | Business 计划 | AI Agent 读写编辑器、文档分块、Google Docs 式 track changes、多文档 Agent |

**结论**：不用 Tiptap 付费扩展，自研 AI 功能。参考 Novel（开源 Tiptap+AI 编辑器）的模式，使用 Vercel AI SDK / Anthropic SDK 直接对接 LLM。

### 1.2 主流文档产品 AI 功能对比

| 能力分类 | Notion AI | Google Docs (Gemini) | 飞书 | 语雀 | WPS AI |
|----------|-----------|---------------------|------|------|--------|
| **AI 生成（从提示词写作）** | Yes | Yes | Yes | Yes | Yes |
| **续写** | Yes | Yes | — | Yes | Yes |
| **行内自动补全（Tab 接受）** | Yes | — | — | — | — |
| **改写/润色** | Yes | Yes | Yes | Yes | Yes |
| **语气调整** | Yes | Yes | — | — | — |
| **缩写/扩写** | Yes | Yes | — | Yes | — |
| **修正语法/拼写** | Yes | Yes | — | Yes | Yes |
| **翻译** | Yes | Yes | Yes | Yes | Yes |
| **摘要** | Yes | Yes | Yes | Yes | Yes |
| **文档 Q&A** | Yes (Agent) | Yes (侧栏) | Yes | Yes | Yes |
| **跨文档搜索/RAG** | Yes | Yes | Yes | Yes | — |
| **AI 审阅+评论** | — | Yes (建议) | — | — | — |
| **文本转表格** | Yes | — | Yes | Yes | — |
| **图片生成** | — | Yes | — | — | — |

### 1.3 功能优先级矩阵

基于「用户价值 * 实现成本」划分：

```
高价值低成本（P0 必做）        高价值高成本（P1 规划）
+----------------------+----------------------+
| . AI 续写             | . 行内自动补全(Copilot)|
| . 改写/润色           | . 文档 Q&A 侧栏       |
| . 缩写/扩写           | . 跨文档 RAG          |
| . 翻译               | . AI 审阅 + 评论       |
| . 摘要               |                      |
| . 语气调整            |                      |
| . 修正语法/拼写        |                      |
| . 自由提示词生成       |                      |
+----------------------+----------------------+
| . 文本转表格          | . 图片生成            |
| . 生成大纲            | . 文档转 PPT          |
|                      | . 自主 Agent          |
| 低价值低成本           | 低价值高成本           |
+----------------------+----------------------+
```

---

## 二、技术架构

### 2.1 整体架构

```
+--------------------------------------------------+
|                   Frontend (Next.js)              |
|                                                   |
|  +----------+  +-----------+  +--------------+    |
|  | 选中文本  |  | / 斜杠命令 |  | Cmd+J 快捷键 |    |
|  | AI 菜单   |  | /ai xxx   |  | AI 面板      |    |
|  +----+-----+  +-----+-----+  +------+-------+    |
|       +---------------+---------------+            |
|                       v                            |
|             AI 请求 Service (SSE)                   |
|                       |                            |
+--------------------------------------------------+
                        | POST /ai/completion (stream)
                        v
+--------------------------------------------------+
|                 Backend (NestJS)                   |
|                                                   |
|  +---------+  +----------+  +----------------+    |
|  | AiModule|--| AiService|--| LLM Provider   |    |
|  |         |  |          |  | (可切换)        |    |
|  +---------+  +----------+  | . OpenAI       |    |
|                             | . Anthropic    |    |
|                             | . DeepSeek     |    |
|                             | . 本地 Ollama   |    |
|                             +----------------+    |
|                                                   |
|  +---------------+  +------------------------+    |
|  | 用量限制       |  | Prompt Template Engine |    |
|  | (Redis/DB)    |  | (系统提示词管理)        |    |
|  +---------------+  +------------------------+    |
+--------------------------------------------------+
```

### 2.2 LLM Provider 抽象层

设计一个 Provider 接口，支持多模型切换：

```typescript
interface LlmProvider {
  id: string;                    // 'openai' | 'anthropic' | 'deepseek'
  name: string;                  // 显示名称
  chat(params: ChatParams): AsyncIterable<string>;  // 流式输出
}

interface ChatParams {
  model: string;                 // 具体模型名
  messages: Message[];           // 对话历史
  temperature?: number;
  maxTokens?: number;
}
```

### 2.3 流式传输方案

复用已有的 SSE 基础设施（通知系统已验证）：

```
POST /ai/completion
Content-Type: text/event-stream

data: {"type":"text","content":"你好"}
data: {"type":"text","content":"，这是"}
data: {"type":"done"}
```

---

## 三、功能分阶段实现

### Phase 1: 基础 AI 写作命令（5-7 天）

**后端**：

- 新建 `AiModule`（Controller + Service + Provider）
- 实现 `POST /ai/completion` SSE 流式端点
- 实现 Provider 抽象层（先接 OpenAI，预留 Anthropic/DeepSeek 接口）
- Prompt 模板系统（每个命令对应一个系统提示词）
- 基础用量限制（每用户每日 N 次，存 Redis 或 DB）

**前端**：

- 新建 `ai-service.ts`（SSE 客户端，流式消费）
- 选中文本浮动 AI 菜单（Bubble Menu 扩展）
- AI 结果面板（流式打字机效果 + 接受/拒绝/重试）
- Diff 对比视图（改写时显示修改前后差异）

**支持的命令**：

| 命令 | 触发方式 | 说明 |
|------|----------|------|
| 续写 | 选中 > 续写 / `/ai continue` | 基于上下文继续写作 |
| 润色 | 选中 > 润色 / `/ai polish` | 改善措辞，修正语法 |
| 缩写 | 选中 > 精简 / `/ai shorter` | 压缩内容 |
| 扩写 | 选中 > 扩展 / `/ai longer` | 丰富细节 |
| 翻译 | 选中 > 翻译 / `/ai translate` | 中英互译（自动检测语言） |
| 摘要 | 全文 > 生成摘要 / `/ai summary` | 提取要点，插入文档顶部 |
| 语气调整 | 选中 > 正式/轻松 | 调整文风 |
| 修正 | 选中 > 修正 / `/ai fix` | 修复语法、拼写、标点 |
| 自由提示 | 选中 > 自定义 / `/ai ask` | 用户输入自定义指令 |

### Phase 2: 行内自动补全 Copilot（3-4 天）

**实现方案**：

- 监听编辑器 `update` 事件，用户停止输入 500ms 后触发
- 发送当前段落 + 前后 2 段上下文到 LLM
- 以灰色虚文本（ghost text）显示补全建议
- Tab 键接受，Esc 键取消，继续输入自动取消
- 使用 ProseMirror Decoration 实现 ghost text 渲染
- 防抖 + 取消机制（新输入取消前一个请求）

**UX 细节**：

- ghost text 使用 `opacity: 0.4` + `italic` 样式
- 只在段落末尾或空行触发，不在代码块/表格内触发
- 设置开关（用户可关闭自动补全）

### Phase 3: 文档 Q&A 侧栏（4-5 天）

**功能**：

- 编辑器右侧可展开的 AI 对话面板
- 自动将当前文档内容作为上下文注入
- 支持多轮对话
- 回答可一键插入文档
- 对话历史持久化（存 DB 或 localStorage）

**后端**：

- `POST /ai/chat` — 带文档上下文的多轮对话
- 文档内容自动截断（超过 token 限制时取摘要）

### Phase 4: 高级功能（5-7 天）

按需求优先级选做：

- **跨文档 RAG**：基于空间内所有文档构建向量索引，支持知识库级别 Q&A
- **AI 审阅**：AI 阅读全文后以评论形式给出修改建议（复用已有评论系统）
- **文本转表格**：选中文本 > AI 解析为结构化表格 > 插入 Tiptap Table 节点
- **生成大纲**：从主题生成文档结构框架

---

## 四、Prompt 模板设计

每个 AI 命令对应一个精心设计的系统提示词：

```
prompts/
  continue.txt      # 续写
  polish.txt        # 润色
  shorter.txt       # 缩写
  longer.txt        # 扩写
  translate.txt     # 翻译
  summary.txt       # 摘要
  tone-formal.txt   # 语气-正式
  tone-casual.txt   # 语气-轻松
  fix-grammar.txt   # 修正语法
  custom.txt        # 自由提示（模板壳）
```

示例 — polish.txt：

```
你是一位专业的中文文案编辑。请润色以下文本：
- 修正语法和标点错误
- 改善措辞和句式，使其更加通顺流畅
- 保持原文的意思和语气不变
- 不要添加新的内容或改变结构
- 直接输出润色后的文本，不要加解释

原文：
{selected_text}
```

---

## 五、前端交互设计

### 5.1 触发方式

| 触发方式 | 入口 | 场景 |
|----------|------|------|
| **选中文本** > 浮动菜单出现 AI 按钮 | Bubble Menu | 对选中内容操作（改写/翻译/缩扩写） |
| **斜杠命令** `/ai` 或 `/续写` `/翻译` 等 | Slash Commands | 空行触发生成、或选中后触发 |
| **快捷键** `Cmd+J` | 键盘 | 快速打开 AI 命令面板 |
| **侧栏 AI 对话** | 编辑器右侧按钮 | 文档 Q&A |

### 5.2 AI 结果面板

```
+----------------------------------------+
| AI 润色                          [x]   |
+----------------------------------------+
|                                        |
|  润色后的文本内容在这里流式显示...       |
|  (打字机光标)                           |
|                                        |
+----------------------------------------+
| [接受]  [替换选中]  [重试]  [取消]      |
+----------------------------------------+
```

### 5.3 Diff 对比模式（改写/润色场景）

```
+----------------------------------------+
| AI 润色                          [x]   |
+----------------------------------------+
| 原文：                                 |
| 这个产品的 用户体验 很不好              |
|                                        |
| 润色：                                 |
| 这个产品的 使用体验 有待提升             |
+----------------------------------------+
| [接受]  [重试]  [取消]                  |
+----------------------------------------+
```

---

## 六、数据模型

### 6.1 AI 用量记录

```prisma
model AiUsageLog {
  id           String   @id @default(cuid())
  userId       String
  command      String   // 'continue' | 'polish' | 'translate' ...
  model        String   // 'gpt-4o' | 'claude-3.5-sonnet' ...
  inputTokens  Int
  outputTokens Int
  latencyMs    Int
  createdAt    DateTime @default(now())

  user User @relation(fields: [userId], references: [id])

  @@index([userId, createdAt])
}
```

### 6.2 用量限制配置

```env
AI_DAILY_LIMIT_FREE=20      # 免费用户每日 20 次
AI_DAILY_LIMIT_PRO=200      # Pro 用户每日 200 次
AI_MODEL_DEFAULT=gpt-4o-mini # 默认模型
AI_MODEL_PRO=gpt-4o         # Pro 用户模型
```

---

## 七、API 设计

### 7.1 AI 补全（流式）

```
POST /ai/completion
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "command": "polish",
  "text": "选中的文本内容",
  "context": "前后段落上下文",
  "language": "zh-CN",
  "customPrompt": ""
}

Response: text/event-stream
data: {"type":"text","content":"润色"}
data: {"type":"text","content":"后的"}
data: {"type":"text","content":"文本"}
data: {"type":"usage","inputTokens":150,"outputTokens":80}
data: {"type":"done"}
```

### 7.2 AI 对话（流式）

```
POST /ai/chat
Authorization: Bearer <token>

Request:
{
  "documentId": "xxx",
  "messages": [
    {"role": "user", "content": "这篇文章的主要观点是什么？"}
  ]
}

Response: text/event-stream（同上格式）
```

### 7.3 用量查询

```
GET /ai/usage
Authorization: Bearer <token>

Response:
{
  "todayUsed": 12,
  "dailyLimit": 20,
  "totalUsed": 456
}
```

---

## 八、文件清单

### 后端新建

| 文件 | 说明 |
|------|------|
| `apps/api/src/ai/ai.module.ts` | AI 模块 |
| `apps/api/src/ai/ai.controller.ts` | API 端点（/completion, /chat, /usage） |
| `apps/api/src/ai/ai.service.ts` | AI 业务逻辑（Prompt 组装、流式处理、用量控制） |
| `apps/api/src/ai/providers/llm-provider.interface.ts` | LLM Provider 抽象接口 |
| `apps/api/src/ai/providers/openai.provider.ts` | OpenAI 实现 |
| `apps/api/src/ai/providers/anthropic.provider.ts` | Anthropic 实现（预留） |
| `apps/api/src/ai/providers/deepseek.provider.ts` | DeepSeek 实现（预留） |
| `apps/api/src/ai/prompts/` | Prompt 模板目录 |
| `apps/api/src/ai/dto/` | 请求 DTO |
| `prisma/migrations/xxx_add_ai_usage.sql` | AI 用量表 migration |

### 前端新建

| 文件 | 说明 |
|------|------|
| `apps/web/src/services/ai-service.ts` | AI API 客户端（SSE 流式消费） |
| `apps/web/src/components/editor/ai-bubble-menu.tsx` | 选中文本 AI 浮动菜单 |
| `apps/web/src/components/editor/ai-result-panel.tsx` | AI 结果面板（流式渲染+操作按钮） |
| `apps/web/src/components/editor/ai-chat-panel.tsx` | 文档 Q&A 侧栏 |
| `apps/web/src/components/editor/ai-command-palette.tsx` | Cmd+J AI 命令面板 |
| `apps/web/src/components/editor/ai-ghost-text.ts` | Copilot 行内补全（ProseMirror Decoration） |
| `apps/web/src/hooks/use-ai-completion.ts` | AI 流式请求 Hook |

### 前端修改

| 文件 | 说明 |
|------|------|
| `simple-editor.tsx` | 集成 AI Bubble Menu + AI Chat Panel |
| `slash-commands-items.ts` | 添加 `/ai` 系列斜杠命令 |
| `document page.tsx` | 添加 AI Chat 侧栏入口按钮 |

---

## 九、实施路线

```
Week 1 (Phase 1):
  Day 1-2: 后端 AiModule + Provider 抽象 + OpenAI 接入 + SSE 流式
  Day 3:   Prompt 模板系统 + 用量限制
  Day 4-5: 前端 AI Bubble Menu + Result Panel + 流式渲染
  Day 6:   斜杠命令 /ai 集成 + Cmd+J 快捷键
  Day 7:   端到端测试 + 边界处理

Week 2 (Phase 2 + 3):
  Day 1-2: 行内自动补全 Copilot（ghost text + Tab 接受）
  Day 3-4: 文档 Q&A 侧栏（多轮对话 + 上下文注入）
  Day 5:   整体 QA + 性能优化 + 用量限制验证

Week 3 (Phase 4, 可选):
  跨文档 RAG（向量检索）
  AI 审阅 + 评论
  文本转表格
```

---

## 十、环境变量

```env
# AI Provider Configuration
AI_PROVIDER=openai
AI_OPENAI_API_KEY=sk-xxx
AI_OPENAI_MODEL=gpt-4o-mini
AI_OPENAI_BASE_URL=

# AI_ANTHROPIC_API_KEY=
# AI_DEEPSEEK_API_KEY=

# Usage Limits
AI_DAILY_LIMIT=50
AI_MAX_INPUT_TOKENS=4000
AI_MAX_OUTPUT_TOKENS=2000

# Feature Flags
AI_COPILOT_ENABLED=false
AI_CHAT_ENABLED=false
```

---

## 十一、关键复用

| 已有基础设施 | 复用方式 |
|------------|---------|
| SSE 通知系统 | 流式传输架构（@Sse 装饰器 + Observable） |
| 斜杠命令系统 | 添加 /ai 命令组 |
| Bubble Menu | 扩展选中文本菜单增加 AI 按钮 |
| 评论系统 | AI 审阅复用 CommentThread 结构 |
| 快捷键弹窗 | AI 命令面板 (Cmd+J) 复用 Dialog 模式 |
| toast 提示 | 用量超限、错误提示 |

---

## 十二、竞品差异化方向

| 方向 | 说明 | 难度 |
|------|------|------|
| **多模型切换** | 用户选择 GPT-4o / Claude / DeepSeek | 低 |
| **协作 AI** | 多人协作时 AI 建议对所有人可见 | 中 |
| **自定义 Prompt** | 用户保存常用 AI 指令为"我的命令" | 低 |
| **AI 模板** | 结合文档模板，AI 自动填充模板内容 | 中 |
| **空间知识库 RAG** | 基于整个空间文档的智能问答 | 高 |
| **AI 写作风格学习** | 从用户历史文档学习写作风格 | 高 |
