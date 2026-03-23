'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
const mod = isMac ? '⌘' : 'Ctrl';
const alt = isMac ? '⌥' : 'Alt';
const shift = '⇧';

interface ShortcutGroup {
  title: string;
  items: { label: string; keys: string }[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: '文本格式',
    items: [
      { label: '加粗', keys: `${mod} B` },
      { label: '斜体', keys: `${mod} I` },
      { label: '下划线', keys: `${mod} U` },
      { label: '删除线', keys: `${mod} ${shift} S` },
      { label: '行内代码', keys: `${mod} E` },
      { label: '上标', keys: `${mod} .` },
      { label: '下标', keys: `${mod} ,` },
    ],
  },
  {
    title: '段落与标题',
    items: [
      { label: '正文', keys: `${mod} ${alt} 0` },
      { label: '标题 1', keys: `${mod} ${alt} 1` },
      { label: '标题 2', keys: `${mod} ${alt} 2` },
      { label: '标题 3', keys: `${mod} ${alt} 3` },
    ],
  },
  {
    title: '列表',
    items: [
      { label: '无序列表', keys: `${mod} ${shift} 8` },
      { label: '有序列表', keys: `${mod} ${shift} 7` },
      { label: '待办列表', keys: `${mod} ${shift} 9` },
      { label: '增加缩进', keys: 'Tab' },
      { label: '减少缩进', keys: `${shift} Tab` },
    ],
  },
  {
    title: '区块',
    items: [
      { label: '引用', keys: `${mod} ${shift} B` },
      { label: '代码块', keys: `${mod} ${alt} C` },
      { label: '分割线', keys: `${mod} ${alt} -` },
    ],
  },
  {
    title: '编辑操作',
    items: [
      { label: '撤销', keys: `${mod} Z` },
      { label: '重做', keys: `${mod} ${shift} Z` },
      { label: '保存', keys: `${mod} S` },
      { label: '链接', keys: `${mod} K` },
    ],
  },
  {
    title: '快捷输入',
    items: [
      { label: '斜杠命令', keys: '/' },
      { label: '@提及成员', keys: '@' },
      { label: '[[链接文档', keys: '[[' },
    ],
  },
];

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsDialog({ open, onOpenChange }: KeyboardShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>快捷键</DialogTitle>
          <DialogDescription>编辑器常用快捷键一览</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-2 overflow-y-auto flex-1 min-h-0 pr-1">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title}>
              <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                {group.title}
              </h4>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {item.label}
                    </span>
                    <div className="flex items-center gap-1">
                      {item.keys.split(' ').map((key, i) => (
                        <kbd
                          key={i}
                          className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/70 border border-gray-200 dark:border-gray-600 rounded-md"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
