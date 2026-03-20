'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Smile } from 'lucide-react';
import { useTiptapEditor } from '@/hooks/use-tiptap-editor';
import type { Editor } from '@tiptap/core';

interface EmojiPopoverProps {
  editor?: Editor | null;
}

const EMOJI_GROUPS: { label: string; emojis: string[] }[] = [
  {
    label: '常用',
    emojis: ['😀', '😂', '🤣', '😊', '😍', '🥰', '😎', '🤔', '😮', '😢', '😡', '🥳', '👍', '👎', '👏', '🙌', '🎉', '🔥', '❤️', '💯', '✅', '❌', '⚠️', '💡'],
  },
  {
    label: '表情',
    emojis: ['😄', '😁', '😆', '😅', '🤗', '🤩', '😇', '🥺', '😤', '😳', '🤯', '😱', '🤭', '😈', '💀', '🤡', '👻', '😴', '🤮', '🥱', '😏', '🙄', '😐', '🫡'],
  },
  {
    label: '手势',
    emojis: ['👋', '✌️', '🤞', '🤙', '👌', '🤘', '👆', '👇', '👈', '👉', '✋', '🤚', '🖐️', '💪', '🙏', '🤝', '☝️', '👊', '✊', '🫶', '🫰', '🫵', '🤌', '🫳'],
  },
  {
    label: '物品',
    emojis: ['📝', '📌', '📎', '🔗', '📂', '📊', '📈', '📉', '🗓️', '⏰', '💻', '🖥️', '📱', '🔒', '🔑', '🏷️', '📦', '🎯', '🏆', '⭐', '🌟', '💎', '🔔', '📢'],
  },
];

export function EmojiPopover({ editor: providedEditor }: EmojiPopoverProps) {
  const { editor } = useTiptapEditor(providedEditor);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isOpen && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.left });
    }
  }, [isOpen]);

  if (!editor) return null;

  const insertEmoji = (emoji: string) => {
    editor.chain().focus().insertContent(emoji).run();
    setIsOpen(false);
    setSearch('');
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="tiptap-button flex items-center gap-1 px-2 py-1.5 rounded-md text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
        title="插入 Emoji"
        aria-label="插入 Emoji"
      >
        <Smile className="w-4 h-4" />
      </button>

      {isOpen && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => { setIsOpen(false); setSearch(''); }} />
          <div
            className="fixed z-[9999] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl w-72 max-h-80 flex flex-col overflow-hidden"
            style={{ top: pos.top, left: pos.left }}
          >
            <div className="p-2 border-b border-gray-100 dark:border-gray-700">
              <input
                type="text"
                placeholder="搜索 emoji..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:border-blue-400 dark:focus:border-blue-500 text-gray-900 dark:text-gray-100 placeholder-gray-400"
                autoFocus
              />
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-3">
              {EMOJI_GROUPS.map((group) => (
                <div key={group.label}>
                  <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1 px-1">
                    {group.label}
                  </p>
                  <div className="grid grid-cols-8 gap-0.5">
                    {group.emojis.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => insertEmoji(emoji)}
                        className="w-8 h-8 flex items-center justify-center text-lg rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                        title={emoji}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>,
        document.body,
      )}
    </>
  );
}
