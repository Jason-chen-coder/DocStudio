'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { PublicHeader } from '@/components/layout/public-header';
import {
  BookOpen, Zap, Users, Sparkles, FileDown, Keyboard,
  Search, FileText, ChevronRight, ChevronDown,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────

interface Article {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface Section {
  id: string;
  icon: typeof BookOpen;
  title: string;
  articles: Article[];
}

// ── Content ────────────────────────────────────────────────────────────────

const SECTIONS: Section[] = [
  {
    id: 'quickstart',
    icon: Zap,
    title: '快速上手',
    articles: [
      {
        id: 'register',
        title: '注册与登录',
        content: (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p>DocStudio 支持以下登录方式：</p>
            <ul>
              <li><strong>邮箱注册</strong>：填写邮箱、密码即可完成注册，系统会发送验证邮件。</li>
              <li><strong>Google 登录</strong>：点击「使用 Google 登录」，授权后自动创建账号。</li>
              <li><strong>GitHub 登录</strong>：点击「使用 GitHub 登录」，适合开发者快速接入。</li>
            </ul>
            <p>首次登录后将自动进入控制台 Dashboard，可在此创建工作空间开始使用。</p>
          </div>
        ),
      },
      {
        id: 'create-space',
        title: '创建第一个工作空间',
        content: (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p>工作空间是文档的顶级容器，可以理解为一个「项目」或「团队」。</p>
            <ol>
              <li>在侧边栏点击 <strong>「+ 新建空间」</strong>。</li>
              <li>填写空间名称和描述，选择可见性（公开 / 私有）。</li>
              <li>点击「创建」，系统自动为你创建一篇欢迎文档。</li>
            </ol>
            <p>创建后可在空间设置中随时修改名称、图标、可见性和成员权限。</p>
          </div>
        ),
      },
      {
        id: 'create-doc',
        title: '创建与编辑文档',
        content: (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p>进入工作空间后，在左侧文档树中操作文档：</p>
            <ul>
              <li>点击 <strong>「+」</strong> 按钮新建文档，支持设置父文档（嵌套层级）。</li>
              <li>拖拽文档卡片可以调整层级顺序。</li>
              <li>双击文档标题可以重命名。</li>
              <li>右键文档可复制、移动、删除或归档到回收站。</li>
            </ul>
          </div>
        ),
      },
    ],
  },
  {
    id: 'editor',
    icon: FileText,
    title: '编辑器使用',
    articles: [
      {
        id: 'basic-editing',
        title: '基础格式化',
        content: (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p>选中文字后浮出工具栏，支持以下格式：</p>
            <ul>
              <li><strong>粗体</strong> <code>Ctrl/⌘ + B</code></li>
              <li><em>斜体</em> <code>Ctrl/⌘ + I</code></li>
              <li><u>下划线</u> <code>Ctrl/⌘ + U</code></li>
              <li><s>删除线</s> <code>Ctrl/⌘ + Shift + S</code></li>
              <li>行内代码 <code>Ctrl/⌘ + E</code></li>
              <li>超链接 <code>Ctrl/⌘ + K</code></li>
            </ul>
            <p>输入 <code>/</code> 唤起斜杠命令菜单，快速插入各类内容块。</p>
          </div>
        ),
      },
      {
        id: 'slash-commands',
        title: '斜杠命令',
        content: (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p>在文档任意位置输入 <code>/</code> 即可唤起命令菜单：</p>
            <div className="overflow-x-auto">
              <table className="text-sm w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 pr-4 font-medium text-gray-700 dark:text-gray-300">命令</th>
                    <th className="text-left py-2 font-medium text-gray-700 dark:text-gray-300">说明</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {[
                    ['/h1 /h2 /h3', '插入各级标题'],
                    ['/bullet', '无序列表'],
                    ['/ordered', '有序列表'],
                    ['/todo', '待办事项（可勾选）'],
                    ['/table', '插入表格'],
                    ['/code', '代码块（支持语法高亮）'],
                    ['/image', '上传或粘贴图片'],
                    ['/callout', '高亮提示块'],
                    ['/math', '数学公式（KaTeX）'],
                    ['/divider', '分隔线'],
                    ['[[', '内链其他文档'],
                  ].map(([cmd, desc]) => (
                    <tr key={cmd}>
                      <td className="py-2 pr-4 font-mono text-xs text-blue-600 dark:text-blue-400">{cmd}</td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ),
      },
      {
        id: 'doc-link',
        title: '文档互链',
        content: (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p>输入 <code>[[</code> 可以搜索并链接到当前工作空间内的其他文档。</p>
            <ul>
              <li>搜索结果实时显示，选择后自动插入链接。</li>
              <li>链接会显示为文档标题，点击可跳转。</li>
              <li>分享页面会对无权限文档链接进行检查和提示。</li>
            </ul>
          </div>
        ),
      },
      {
        id: 'version-history',
        title: '版本历史',
        content: (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p>文档每次保存都会自动创建版本快照：</p>
            <ol>
              <li>点击右上角菜单 → <strong>版本历史</strong>。</li>
              <li>侧边栏列出所有历史版本及操作者。</li>
              <li>点击某个版本可预览其内容。</li>
              <li>点击「恢复此版本」可将文档回滚至该版本。</li>
            </ol>
          </div>
        ),
      },
    ],
  },
  {
    id: 'collab',
    icon: Users,
    title: '团队协作',
    articles: [
      {
        id: 'invite',
        title: '邀请成员',
        content: (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p>在工作空间设置 → 成员管理中邀请协作者：</p>
            <ol>
              <li>输入对方邮箱地址，选择角色（编辑者 / 查看者）。</li>
              <li>点击「发送邀请」，对方收到邮件后点击链接即可加入。</li>
              <li>也可以复制邀请链接直接发送。</li>
            </ol>
            <p>成员角色说明：</p>
            <ul>
              <li><strong>所有者（Owner）</strong>：可管理成员、删除空间。</li>
              <li><strong>编辑者（Editor）</strong>：可创建和编辑文档。</li>
              <li><strong>查看者（Viewer）</strong>：仅可查看，无法编辑。</li>
            </ul>
          </div>
        ),
      },
      {
        id: 'realtime',
        title: '实时多人协作',
        content: (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p>多人同时打开同一文档时，协作模式自动启用：</p>
            <ul>
              <li>右上角显示在线成员头像。</li>
              <li>不同用户的光标以不同颜色标注，显示对方姓名。</li>
              <li>编辑内容实时同步，基于 Yjs CRDT 自动解决冲突。</li>
              <li>网络断开后会自动重连，离线编辑内容不会丢失。</li>
            </ul>
          </div>
        ),
      },
      {
        id: 'comments',
        title: '评论与标注',
        content: (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p>选中文字后可以添加行内评论：</p>
            <ol>
              <li>选中一段文字，在浮出工具栏点击评论图标。</li>
              <li>输入评论内容，回车发送。</li>
              <li>其他成员可以回复评论，形成讨论串。</li>
              <li>问题解决后可以标记为「已解决」，评论会折叠归档。</li>
            </ol>
            <p>所有评论可在右侧评论面板统一查看和管理。</p>
          </div>
        ),
      },
      {
        id: 'share',
        title: '分享文档',
        content: (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p>点击右上角「分享」按钮可生成公开分享链接：</p>
            <ul>
              <li>可设置链接密码，限制访问人群。</li>
              <li>可设置链接有效期，到期自动失效。</li>
              <li>公开链接访问者无需登录即可查看文档。</li>
              <li>在分享管理中可随时撤销所有已生成的链接。</li>
            </ul>
          </div>
        ),
      },
    ],
  },
  {
    id: 'ai',
    icon: Sparkles,
    title: 'AI 写作助手',
    articles: [
      {
        id: 'ai-inline',
        title: 'AI 内联面板',
        content: (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p>选中文字后，在浮出工具栏点击「AI 创作」即可唤起 AI 面板：</p>
            <ul>
              <li><strong>润色/修正</strong>：优化表达，修正语法错误。</li>
              <li><strong>扩写</strong>：丰富内容，增加细节。</li>
              <li><strong>精简</strong>：保留核心，压缩篇幅。</li>
              <li><strong>翻译</strong>：快速翻译为其他语言（需 VIP 套餐）。</li>
              <li><strong>摘要</strong>：提取关键信息（需 VIP 套餐）。</li>
              <li><strong>自定义指令</strong>：输入任意指令（需 VIP 套餐）。</li>
            </ul>
            <p>结果流式输出完成后，可以选择替换原文、插入到后方或复制。</p>
          </div>
        ),
      },
      {
        id: 'ai-chat',
        title: 'AI 对话侧栏',
        content: (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p>点击编辑器右下角的 AI 助手按钮，打开对话侧栏（需 VIP 套餐）：</p>
            <ul>
              <li>支持多轮对话，可以引用文档内容进行提问。</li>
              <li>支持深度思考模式，输出过程可视化。</li>
              <li>侧栏和浮窗两种显示模式，可随时切换。</li>
              <li>对话历史在当前页面持久保存。</li>
            </ul>
          </div>
        ),
      },
      {
        id: 'ai-subscription',
        title: 'AI 订阅套餐',
        content: (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p>AI 功能按套餐分级，在「个人中心 → AI 订阅」中申请：</p>
            <div className="overflow-x-auto">
              <table className="text-sm w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 pr-4 font-medium">套餐</th>
                    <th className="text-left py-2 pr-4 font-medium">功能</th>
                    <th className="text-left py-2 font-medium">每日额度</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  <tr>
                    <td className="py-2 pr-4 font-medium text-blue-600 dark:text-blue-400">普通</td>
                    <td className="py-2 pr-4 text-gray-600 dark:text-gray-400">续写、润色、扩写、缩写</td>
                    <td className="py-2 text-gray-600 dark:text-gray-400">30 次</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-medium text-blue-600 dark:text-blue-400">VIP</td>
                    <td className="py-2 pr-4 text-gray-600 dark:text-gray-400">普通全部 + 翻译、摘要、自定义、AI 对话</td>
                    <td className="py-2 text-gray-600 dark:text-gray-400">100 次</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-medium text-amber-600 dark:text-amber-400">Max</td>
                    <td className="py-2 pr-4 text-gray-600 dark:text-gray-400">VIP 全部功能，优先模型</td>
                    <td className="py-2 text-gray-600 dark:text-gray-400">500 次</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>申请后由管理员审批，审批通过后立即生效。</p>
          </div>
        ),
      },
    ],
  },
  {
    id: 'import-export',
    icon: FileDown,
    title: '导入与导出',
    articles: [
      {
        id: 'import',
        title: '导入文档',
        content: (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p>支持将以下格式导入为 DocStudio 文档：</p>
            <ul>
              <li><strong>Markdown (.md)</strong>：完整保留标题、列表、代码块等结构。</li>
              <li><strong>HTML (.html)</strong>：导入并解析为富文本格式。</li>
              <li><strong>Word (.docx)</strong>：提取正文内容，尽量保留格式。</li>
            </ul>
            <p>在文档工具栏点击「…更多」→「导入文件」，选择本地文件即可。</p>
          </div>
        ),
      },
      {
        id: 'export',
        title: '导出文档',
        content: (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p>文档支持导出为以下格式：</p>
            <ul>
              <li><strong>Markdown</strong>：纯文本，适合存档或迁移。</li>
              <li><strong>HTML</strong>：保留样式，适合发布到网页。</li>
              <li><strong>PDF</strong>：打印友好，适合正式文件。</li>
            </ul>
            <p>在文档工具栏点击「…更多」→「导出为」，选择目标格式。</p>
          </div>
        ),
      },
    ],
  },
  {
    id: 'shortcuts',
    icon: Keyboard,
    title: '快捷键',
    articles: [
      {
        id: 'keyboard-shortcuts',
        title: '全部快捷键',
        content: (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-gray-500 dark:text-gray-400 text-xs mb-4">
              在编辑器内按{' '}
              <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-mono text-xs border border-gray-300 dark:border-gray-600">?</kbd>
              {' '}可随时唤起快捷键速查面板
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-0">
              {[
                ['Ctrl/⌘ + B', '粗体'],
                ['Ctrl/⌘ + I', '斜体'],
                ['Ctrl/⌘ + U', '下划线'],
                ['Ctrl/⌘ + E', '行内代码'],
                ['Ctrl/⌘ + K', '插入链接'],
                ['Ctrl/⌘ + Z', '撤销'],
                ['Ctrl/⌘ + Shift + Z', '重做'],
                ['Ctrl/⌘ + S', '手动保存'],
                ['Ctrl/⌘ + /', '添加评论'],
                ['Tab', '列表缩进'],
                ['Shift + Tab', '列表减进'],
                ['/', '打开斜杠命令菜单'],
                ['[[', '插入文档内链'],
                ['@', '@提及成员'],
              ].map(([key, desc]) => (
                <div key={key} className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-gray-600 dark:text-gray-400 text-xs">{desc}</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-mono text-xs border border-gray-300 dark:border-gray-600 ml-3 whitespace-nowrap">{key}</kbd>
                </div>
              ))}
            </div>
          </div>
        ),
      },
    ],
  },
];

// ── Constants ──────────────────────────────────────────────────────────────

const easeExpo = [0.16, 1, 0.3, 1] as const;

// ── ArticleRow ─────────────────────────────────────────────────────────────

function ArticleRow({ article }: { article: Article }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left group hover:bg-gray-50/80 dark:hover:bg-white/[0.025] transition-colors duration-150"
      >
        <span className="text-[13.5px] text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors duration-150 font-medium">
          {article.title}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-gray-300 dark:text-gray-600 flex-shrink-0 ml-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: easeExpo }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-5 pb-5 pt-1 border-t border-gray-100 dark:border-white/[0.04]">
              {article.content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function HelpPage() {
  const [search, setSearch] = useState('');
  const [activeSectionId, setActiveSectionId] = useState<string>(SECTIONS[0].id);

  const filtered = search.trim()
    ? SECTIONS.map((s) => ({
        ...s,
        articles: s.articles.filter((a) =>
          a.title.toLowerCase().includes(search.toLowerCase())
        ),
      })).filter((s) => s.articles.length > 0)
    : SECTIONS;

  const scrollToSection = (id: string) => {
    setActiveSectionId(id);
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 88;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] dark:bg-[#0D0D10]">
      {/* Dot grid */}
      <div
        aria-hidden
        className="fixed inset-0 pointer-events-none opacity-[0.32] dark:opacity-[0.11]"
        style={{
          backgroundImage: 'radial-gradient(circle, #a1a1aa 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <PublicHeader />

      {/* Hero */}
      <div className="relative pt-20">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-52 pointer-events-none bg-gradient-to-b from-blue-100/25 dark:from-blue-900/[0.05] to-transparent"
        />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-12 pb-9 border-b border-gray-200/60 dark:border-white/[0.055]">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easeExpo }}
          >
            <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-blue-500 dark:text-blue-400 mb-2">
              Documentation
            </p>
            <h1 className="text-[22px] font-bold text-gray-900 dark:text-gray-50 tracking-tight">
              帮助中心
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              使用文档、操作指南和常见问题
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.07, ease: easeExpo }}
            className="mt-6 relative max-w-xs"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="搜索帮助文档…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400/50 transition-all duration-200"
            />
          </motion.div>
        </div>
      </div>

      {/* Body */}
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-10 flex gap-10">

        {/* Sidebar — lg+ only */}
        {!search && (
          <aside className="hidden lg:block w-44 flex-shrink-0">
            <nav className="sticky top-24">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600 px-2 mb-2">
                目录
              </p>
              <div className="space-y-px">
                {SECTIONS.map((s) => {
                  const Icon = s.icon;
                  const active = activeSectionId === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => scrollToSection(s.id)}
                      className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all duration-150 ${
                        active
                          ? 'bg-blue-50 dark:bg-blue-500/[0.09] text-blue-700 dark:text-blue-400 font-medium'
                          : 'text-gray-500 dark:text-gray-500 hover:text-gray-800 dark:hover:text-gray-300 hover:bg-gray-100/60 dark:hover:bg-white/[0.04]'
                      }`}
                    >
                      <Icon
                        className={`w-3.5 h-3.5 flex-shrink-0 ${
                          active ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-600'
                        }`}
                      />
                      <span className="text-[13px] truncate">{s.title}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-8 pt-5 border-t border-gray-200/60 dark:border-white/[0.055]">
                <p className="text-[11px] text-gray-400 dark:text-gray-600 px-2 mb-2">
                  没有找到答案？
                </p>
                <Link
                  href="/contact"
                  className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-[13px] text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/[0.09] transition-colors duration-150"
                >
                  联系我们
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </nav>
          </aside>
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {/* Mobile section pills */}
          {!search && (
            <div className="flex lg:hidden gap-1.5 overflow-x-auto pb-4 mb-8" style={{ scrollbarWidth: 'none' }}>
              {SECTIONS.map((s) => {
                const Icon = s.icon;
                const active = activeSectionId === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => scrollToSection(s.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[12px] font-medium whitespace-nowrap flex-shrink-0 transition-all duration-150 ${
                      active
                        ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/25 text-blue-700 dark:text-blue-400'
                        : 'bg-white dark:bg-white/[0.03] border-gray-200 dark:border-white/[0.07] text-gray-500 dark:text-gray-500'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    {s.title}
                  </button>
                );
              })}
            </div>
          )}

          <div className="space-y-10">
            {filtered.map((section, si) => {
              const Icon = section.icon;
              return (
                <motion.section
                  key={section.id}
                  id={section.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.4, delay: si * 0.03, ease: easeExpo }}
                  onViewportEnter={() => !search && setActiveSectionId(section.id)}
                >
                  {/* Section heading */}
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-[3px] h-[18px] rounded-full bg-blue-500 dark:bg-blue-400 flex-shrink-0" />
                    <Icon className="w-[15px] h-[15px] text-gray-400 dark:text-gray-500" />
                    <h2 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">
                      {section.title}
                    </h2>
                    <span className="ml-1 text-[11px] text-gray-400 dark:text-gray-600 font-mono">
                      {section.articles.length}
                    </span>
                  </div>

                  {/* Article list */}
                  <div className="rounded-2xl border border-gray-200/70 dark:border-white/[0.06] bg-white dark:bg-white/[0.015] overflow-hidden divide-y divide-gray-100/80 dark:divide-white/[0.045]">
                    {section.articles.map((article) => (
                      <ArticleRow key={article.id} article={article} />
                    ))}
                  </div>
                </motion.section>
              );
            })}

            {filtered.length === 0 && (
              <div className="py-20 text-center">
                <Search className="w-7 h-7 mx-auto mb-3 text-gray-300 dark:text-gray-700" />
                <p className="text-sm text-gray-400 dark:text-gray-600">
                  没有找到与「{search}」相关的内容
                </p>
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="mt-3 text-xs text-blue-500 dark:text-blue-400 hover:underline underline-offset-2"
                >
                  清除搜索
                </button>
              </div>
            )}
          </div>

          {/* Mobile footer CTA */}
          <div className="lg:hidden mt-12 pt-6 border-t border-gray-200/60 dark:border-white/[0.055] flex items-center justify-between">
            <p className="text-sm text-gray-400 dark:text-gray-600">没有找到答案？</p>
            <Link
              href="/contact"
              className="flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline underline-offset-2"
            >
              联系我们
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
