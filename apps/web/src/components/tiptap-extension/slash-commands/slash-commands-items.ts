import {
  Heading1,
  Heading2,
  Heading3,
  Type,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Minus,
  Table,
  ImagePlus,
  AlertCircle,
  Smile,
  Sigma,
  PenTool,
} from 'lucide-react';
import type { Editor } from '@tiptap/core';
import type { LucideIcon } from 'lucide-react';

export interface SlashCommandItem {
  title: string;
  description: string;
  icon: LucideIcon;
  group: string;
  aliases: string[];
  command: (editor: Editor) => void;
}

export const SLASH_COMMAND_ITEMS: SlashCommandItem[] = [
  // ── 基础 ──
  {
    title: '正文',
    description: '普通段落文本',
    icon: Type,
    group: '基础',
    aliases: ['text', 'paragraph', 'p', 'zhengwen'],
    command: (editor) => {
      editor.chain().focus().setParagraph().run();
    },
  },
  {
    title: '标题 1',
    description: '大标题',
    icon: Heading1,
    group: '基础',
    aliases: ['h1', 'heading1', 'biaoti'],
    command: (editor) => {
      editor.chain().focus().setHeading({ level: 1 }).run();
    },
  },
  {
    title: '标题 2',
    description: '中标题',
    icon: Heading2,
    group: '基础',
    aliases: ['h2', 'heading2'],
    command: (editor) => {
      editor.chain().focus().setHeading({ level: 2 }).run();
    },
  },
  {
    title: '标题 3',
    description: '小标题',
    icon: Heading3,
    group: '基础',
    aliases: ['h3', 'heading3'],
    command: (editor) => {
      editor.chain().focus().setHeading({ level: 3 }).run();
    },
  },

  // ── 列表 ──
  {
    title: '无序列表',
    description: '项目符号列表',
    icon: List,
    group: '列表',
    aliases: ['bullet', 'ul', 'list', 'wuxu'],
    command: (editor) => {
      editor.chain().focus().toggleBulletList().run();
    },
  },
  {
    title: '有序列表',
    description: '编号列表',
    icon: ListOrdered,
    group: '列表',
    aliases: ['numbered', 'ol', 'ordered', 'youxu'],
    command: (editor) => {
      editor.chain().focus().toggleOrderedList().run();
    },
  },
  {
    title: '待办清单',
    description: '可勾选任务列表',
    icon: CheckSquare,
    group: '列表',
    aliases: ['todo', 'task', 'checklist', 'daiban'],
    command: (editor) => {
      editor.chain().focus().toggleTaskList().run();
    },
  },

  // ── 区块 ──
  {
    title: '引用',
    description: '引用文本块',
    icon: Quote,
    group: '区块',
    aliases: ['quote', 'blockquote', 'yinyong'],
    command: (editor) => {
      editor.chain().focus().toggleBlockquote().run();
    },
  },
  {
    title: '代码块',
    description: '语法高亮代码',
    icon: Code,
    group: '区块',
    aliases: ['code', 'codeblock', 'daima'],
    command: (editor) => {
      editor.chain().focus().toggleCodeBlock().run();
    },
  },
  {
    title: '分割线',
    description: '水平分隔线',
    icon: Minus,
    group: '区块',
    aliases: ['hr', 'divider', 'line', 'fenge'],
    command: (editor) => {
      editor.chain().focus().setHorizontalRule().run();
    },
  },
  {
    title: '提示块',
    description: '信息/警告/错误提示框',
    icon: AlertCircle,
    group: '区块',
    aliases: ['callout', 'alert', 'info', 'warning', 'tishi'],
    command: (editor) => {
      editor.chain().focus().insertCallout('info').run();
    },
  },

  // ── 表格 ──
  {
    title: '表格',
    description: '插入 3×3 表格',
    icon: Table,
    group: '插入',
    aliases: ['table', 'biaoge'],
    command: (editor) => {
      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    },
  },

  // ── 媒体 ──
  {
    title: '图片',
    description: '上传或粘贴图片',
    icon: ImagePlus,
    group: '插入',
    aliases: ['image', 'img', 'photo', 'tupian'],
    command: (editor) => {
      // Insert an imageUpload node to trigger the upload UI
      editor.chain().focus().insertContent({ type: 'imageUpload' }).run();
    },
  },
  {
    title: 'Emoji',
    description: '插入表情符号',
    icon: Smile,
    group: '插入',
    aliases: ['emoji', 'smile', 'biaoqing'],
    command: (editor) => {
      editor.chain().focus().insertContent('😀').run();
    },
  },
  {
    title: '数学公式',
    description: 'LaTeX 数学公式',
    icon: Sigma,
    group: '插入',
    aliases: ['math', 'formula', 'latex', 'katex', 'gongshi'],
    command: (editor) => {
      editor.chain().focus().insertMathBlock().run();
    },
  },
  {
    title: '画板',
    description: '自由绘图画布',
    icon: PenTool,
    group: '插入',
    aliases: ['drawing', 'draw', 'canvas', 'sketch', 'paint', 'huaban', 'huihua'],
    command: (editor) => {
      editor.chain().focus().insertDrawing().run();
    },
  },
];
