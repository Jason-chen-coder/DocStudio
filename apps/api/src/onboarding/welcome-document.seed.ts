/**
 * 新用户欢迎文档 — 展示 DocStudio 编辑器的全部功能
 * 内容格式：Tiptap JSON (ProseMirror)
 */

export const WELCOME_DOCUMENT_TITLE = '欢迎使用 DocStudio';

const WELCOME_CONTENT = {
  type: 'doc',
  content: [
    // ==================== Logo ====================
    {
      type: 'image',
      attrs: {
        src: '/docStudio_icon.png',
        alt: 'DocStudio Logo',
        title: 'DocStudio Logo',
        alignment: 'center',
        width: 120,
      },
    },

    // ==================== H1 标题 ====================
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: '欢迎使用 DocStudio 🎉' }],
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: '这是你的第一篇文档！本文档将带你快速了解 DocStudio 编辑器的所有功能。你可以随意编辑、删除或替换这些内容。',
        },
      ],
    },

    { type: 'horizontalRule' },

    // ==================== 文本格式 ====================
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: '📝 文本格式' }],
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'DocStudio 支持丰富的文本格式：' },
      ],
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          marks: [{ type: 'bold' }],
          text: '粗体文本',
        },
        { type: 'text', text: '、' },
        {
          type: 'text',
          marks: [{ type: 'italic' }],
          text: '斜体文本',
        },
        { type: 'text', text: '、' },
        {
          type: 'text',
          marks: [{ type: 'bold' }, { type: 'italic' }],
          text: '粗斜体',
        },
        { type: 'text', text: '、' },
        {
          type: 'text',
          marks: [{ type: 'code' }],
          text: '行内代码',
        },
        { type: 'text', text: '、' },
        {
          type: 'text',
          marks: [{ type: 'highlight', attrs: { color: '#fef08a' } }],
          text: '高亮文本',
        },
        { type: 'text', text: '、' },
        {
          type: 'text',
          marks: [{ type: 'subscript' }],
          text: '下标',
        },
        { type: 'text', text: ' 和 ' },
        {
          type: 'text',
          marks: [{ type: 'superscript' }],
          text: '上标',
        },
        { type: 'text', text: '。' },
      ],
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: '你还可以插入' },
        {
          type: 'text',
          marks: [
            {
              type: 'link',
              attrs: {
                href: 'https://github.com',
                target: '_blank',
              },
            },
          ],
          text: '超链接',
        },
        { type: 'text', text: '，快捷键 ' },
        {
          type: 'text',
          marks: [{ type: 'code' }],
          text: 'Ctrl/⌘ + K',
        },
        { type: 'text', text: '。' },
      ],
    },

    // ==================== 标题层级 ====================
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: '📑 标题层级' }],
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: '支持 H1 到 H6 共六级标题，使用 ' },
        { type: 'text', marks: [{ type: 'code' }], text: '#' },
        { type: 'text', text: ' 空格快速输入：' },
      ],
    },
    {
      type: 'heading',
      attrs: { level: 3 },
      content: [{ type: 'text', text: '这是三级标题（H3）' }],
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: '标题会自动生成文档大纲，方便快速导航。' },
      ],
    },

    // ==================== 列表 ====================
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: '📋 列表' }],
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          marks: [{ type: 'bold' }],
          text: '无序列表',
        },
        { type: 'text', text: '（输入 ' },
        { type: 'text', marks: [{ type: 'code' }], text: '-' },
        { type: 'text', text: ' 空格）：' },
      ],
    },
    {
      type: 'bulletList',
      content: [
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: '支持多级嵌套' }],
            },
          ],
        },
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: '按 ' },
                { type: 'text', marks: [{ type: 'code' }], text: 'Tab' },
                { type: 'text', text: ' 键缩进，' },
                { type: 'text', marks: [{ type: 'code' }], text: 'Shift+Tab' },
                { type: 'text', text: ' 取消缩进' },
              ],
            },
          ],
        },
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: '自动延续列表项' }],
            },
          ],
        },
      ],
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          marks: [{ type: 'bold' }],
          text: '有序列表',
        },
        { type: 'text', text: '（输入 ' },
        { type: 'text', marks: [{ type: 'code' }], text: '1.' },
        { type: 'text', text: ' 空格）：' },
      ],
    },
    {
      type: 'orderedList',
      content: [
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: '第一步：创建工作空间' }],
            },
          ],
        },
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: '第二步：新建文档' }],
            },
          ],
        },
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: '第三步：邀请团队成员协作' }],
            },
          ],
        },
      ],
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          marks: [{ type: 'bold' }],
          text: '任务列表',
        },
        { type: 'text', text: '（输入 ' },
        { type: 'text', marks: [{ type: 'code' }], text: '[]' },
        { type: 'text', text: ' 空格）：' },
      ],
    },
    {
      type: 'taskList',
      content: [
        {
          type: 'taskItem',
          attrs: { checked: true },
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: '注册 DocStudio 账号' }],
            },
          ],
        },
        {
          type: 'taskItem',
          attrs: { checked: true },
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: '阅读欢迎文档' }],
            },
          ],
        },
        {
          type: 'taskItem',
          attrs: { checked: false },
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: '尝试创建自己的文档' }],
            },
          ],
        },
        {
          type: 'taskItem',
          attrs: { checked: false },
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: '邀请团队成员一起协作' }],
            },
          ],
        },
      ],
    },

    // ==================== 引用 ====================
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: '💬 引用' }],
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: '输入 ' },
        { type: 'text', marks: [{ type: 'code' }], text: '>' },
        { type: 'text', text: ' 空格创建引用块：' },
      ],
    },
    {
      type: 'blockquote',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: '好的文档不仅是信息的载体，更是团队协作的桥梁。',
            },
          ],
        },
      ],
    },

    // ==================== Callout ====================
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: '🔔 Callout 提示框' }],
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: '使用斜杠命令 /callout 插入提示框，支持四种类型：',
        },
      ],
    },
    {
      type: 'callout',
      attrs: { type: 'info' },
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              marks: [{ type: 'bold' }],
              text: '💡 信息提示：',
            },
            {
              type: 'text',
              text: '使用斜杠命令 / 可以快速插入各种内容块。',
            },
          ],
        },
      ],
    },
    {
      type: 'callout',
      attrs: { type: 'warning' },
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              marks: [{ type: 'bold' }],
              text: '⚠️ 注意事项：',
            },
            {
              type: 'text',
              text: '删除操作不可恢复，请在操作前确认。',
            },
          ],
        },
      ],
    },
    {
      type: 'callout',
      attrs: { type: 'success' },
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              marks: [{ type: 'bold' }],
              text: '✅ 小技巧：',
            },
            {
              type: 'text',
              text: '按 Ctrl/⌘ + Z 可以撤销任何操作。',
            },
          ],
        },
      ],
    },

    // ==================== 代码块 ====================
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: '💻 代码块' }],
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: '输入 ' },
        { type: 'text', marks: [{ type: 'code' }], text: '```' },
        { type: 'text', text: ' 加语言名称创建代码块，支持语法高亮：' },
      ],
    },
    {
      type: 'codeBlock',
      attrs: { language: 'typescript' },
      content: [
        {
          type: 'text',
          text: `// TypeScript 示例\ninterface User {\n  id: string;\n  name: string;\n  email: string;\n}\n\nfunction greet(user: User): string {\n  return \`Hello, \${user.name}!\`;\n}`,
        },
      ],
    },
    {
      type: 'codeBlock',
      attrs: { language: 'python' },
      content: [
        {
          type: 'text',
          text: `# Python 示例\ndef fibonacci(n: int) -> list[int]:\n    if n <= 0:\n        return []\n    fib = [0, 1]\n    for i in range(2, n):\n        fib.append(fib[i-1] + fib[i-2])\n    return fib[:n]\n\nprint(fibonacci(10))`,
        },
      ],
    },

    // ==================== 表格 ====================
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: '📊 表格' }],
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: '通过斜杠命令 /table 插入表格，支持列宽调整和表头行：',
        },
      ],
    },
    {
      type: 'table',
      content: [
        {
          type: 'tableRow',
          content: [
            {
              type: 'tableHeader',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: '快捷键' }],
                },
              ],
            },
            {
              type: 'tableHeader',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: '功能' }],
                },
              ],
            },
            {
              type: 'tableHeader',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: '说明' }],
                },
              ],
            },
          ],
        },
        {
          type: 'tableRow',
          content: [
            {
              type: 'tableCell',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      marks: [{ type: 'code' }],
                      text: 'Ctrl/⌘ + B',
                    },
                  ],
                },
              ],
            },
            {
              type: 'tableCell',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: '粗体' }],
                },
              ],
            },
            {
              type: 'tableCell',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    { type: 'text', text: '选中文本后切换粗体' },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: 'tableRow',
          content: [
            {
              type: 'tableCell',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      marks: [{ type: 'code' }],
                      text: 'Ctrl/⌘ + I',
                    },
                  ],
                },
              ],
            },
            {
              type: 'tableCell',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: '斜体' }],
                },
              ],
            },
            {
              type: 'tableCell',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    { type: 'text', text: '选中文本后切换斜体' },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: 'tableRow',
          content: [
            {
              type: 'tableCell',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      marks: [{ type: 'code' }],
                      text: 'Ctrl/⌘ + Z',
                    },
                  ],
                },
              ],
            },
            {
              type: 'tableCell',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: '撤销' }],
                },
              ],
            },
            {
              type: 'tableCell',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    { type: 'text', text: '撤销上一次操作' },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: 'tableRow',
          content: [
            {
              type: 'tableCell',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      marks: [{ type: 'code' }],
                      text: '/',
                    },
                  ],
                },
              ],
            },
            {
              type: 'tableCell',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: '斜杠命令' }],
                },
              ],
            },
            {
              type: 'tableCell',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: '打开命令面板，快速插入内容',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },

    // ==================== 数学公式 ====================
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: '🔢 数学公式' }],
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: '通过斜杠命令 /math 插入 LaTeX 数学公式：',
        },
      ],
    },
    {
      type: 'math',
      attrs: {
        latex: 'E = mc^2',
      },
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: '还支持复杂公式，例如：' },
      ],
    },
    {
      type: 'math',
      attrs: {
        latex:
          '\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}',
      },
    },

    // ==================== 文本对齐 ====================
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: '↔️ 文本对齐' }],
    },
    {
      type: 'paragraph',
      attrs: { textAlign: 'left' },
      content: [{ type: 'text', text: '← 左对齐（默认）' }],
    },
    {
      type: 'paragraph',
      attrs: { textAlign: 'center' },
      content: [{ type: 'text', text: '— 居中对齐 —' }],
    },
    {
      type: 'paragraph',
      attrs: { textAlign: 'right' },
      content: [{ type: 'text', text: '右对齐 →' }],
    },

    { type: 'horizontalRule' },

    // ==================== 协作功能 ====================
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: '👥 协作功能' }],
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'DocStudio 支持强大的团队协作能力：' },
      ],
    },
    {
      type: 'bulletList',
      content: [
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  marks: [{ type: 'bold' }],
                  text: '实时协作',
                },
                {
                  type: 'text',
                  text: ' — 多人同时编辑同一文档，实时看到彼此的光标和修改',
                },
              ],
            },
          ],
        },
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  marks: [{ type: 'bold' }],
                  text: '评论与讨论',
                },
                {
                  type: 'text',
                  text: ' — 选中文本后添加评论，进行针对性讨论',
                },
              ],
            },
          ],
        },
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  marks: [{ type: 'bold' }],
                  text: '@提及',
                },
                {
                  type: 'text',
                  text: ' — 输入 @ 提及团队成员，对方会收到通知',
                },
              ],
            },
          ],
        },
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  marks: [{ type: 'bold' }],
                  text: '文档互链',
                },
                {
                  type: 'text',
                  text: ' — 输入 [[ 搜索并链接其他文档，构建知识网络',
                },
              ],
            },
          ],
        },
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  marks: [{ type: 'bold' }],
                  text: '版本历史',
                },
                {
                  type: 'text',
                  text: ' — 自动保存版本快照，随时恢复到任意历史状态',
                },
              ],
            },
          ],
        },
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  marks: [{ type: 'bold' }],
                  text: '分享链接',
                },
                {
                  type: 'text',
                  text: ' — 生成公开链接或密码保护链接分享给外部人员',
                },
              ],
            },
          ],
        },
      ],
    },

    { type: 'horizontalRule' },

    // ==================== 快速开始 ====================
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: '🚀 快速开始' }],
    },
    {
      type: 'callout',
      attrs: { type: 'info' },
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              marks: [{ type: 'bold' }],
              text: '试试这些操作：',
            },
          ],
        },
        {
          type: 'orderedList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: '在任意空行输入 / 唤出斜杠命令面板',
                    },
                  ],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: '选中文本后，使用浮动工具栏调整格式',
                    },
                  ],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: '拖拽文档树中的文档来调整层级结构',
                    },
                  ],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: '点击右上角「分享」按钮，将文档分享给他人',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: '祝你使用愉快！如有任何问题，欢迎通过帮助页面联系我们。',
        },
      ],
    },
  ],
};

export const WELCOME_CONTENT_JSON = WELCOME_CONTENT;
export const WELCOME_DOCUMENT_CONTENT = JSON.stringify(WELCOME_CONTENT);

export const DEFAULT_SPACE_NAME = '我的工作空间';
export const DEFAULT_SPACE_DESCRIPTION = '你的默认工作空间，开始创建和管理文档吧';
