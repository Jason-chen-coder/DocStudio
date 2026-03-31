'use client';

import { useState, useCallback, useRef } from 'react';
import { BubbleMenu } from '@tiptap/react/menus';
import type { Editor } from '@tiptap/core';
import { NodeSelection } from '@tiptap/pm/state';
import {
  Sparkles,
  Bold,
  Italic,
  Strikethrough,
  Underline,
  Code,
  Link,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Highlighter,
  MessageSquarePlus,
} from 'lucide-react';

interface AiBubbleMenuProps {
  editor: Editor;
  isAiPanelOpen?: boolean;
  onAiPanelOpen?: () => void;
  canUseCommand?: (command: string) => boolean;
  onUpgradeNeeded?: () => void;
  onAddComment?: (quote: string, firstMessage: string) => string;
  onCommentAdded?: (commentId: string) => void;
}

// Formatting button helper
function FmtBtn({ active, onClick, title, children }: { active?: boolean; onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-md transition-colors ${
        active
          ? 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
      }`}
    >
      {children}
    </button>
  );
}

export function AiBubbleMenu({ editor, isAiPanelOpen, onAiPanelOpen, canUseCommand, onUpgradeNeeded, onAddComment, onCommentAdded }: AiBubbleMenuProps) {
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  const iconSize = 'w-3.5 h-3.5';

  return (
    <BubbleMenu
      editor={editor}
      pluginKey="textBubbleMenu"
      shouldShow={({ editor: e, state }) => {
        // Hide when AI inline panel is open
        if (isAiPanelOpen) return false;
        // Only show for text selections (not image/node selections)
        if (!e.isEditable) return false;
        if (state.selection instanceof NodeSelection) return false;
        const { from, to } = state.selection;
        if (from === to) return false;
        if (e.isActive('image')) return false;
        return true;
      }}
      options={{
        placement: 'top-start',
        offset: { mainAxis: 8, crossAxis: 0 },
      }}
    >
      <div className="flex items-center max-w-[calc(100vw-2rem)] overflow-x-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg px-1 py-0.5 gap-0.5">
        {/* AI 创作 button — opens inline panel (or upgrade modal for non-subscribers) */}
        <button
          type="button"
          onClick={canUseCommand ? onAiPanelOpen : onUpgradeNeeded}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors whitespace-nowrap"
        >
          <Sparkles className={iconSize} />
          AI 创作
        </button>
        <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-0.5" />

        {/* Formatting tools */}
        <FmtBtn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="加粗">
          <Bold className={iconSize} />
        </FmtBtn>
        <FmtBtn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="斜体">
          <Italic className={iconSize} />
        </FmtBtn>
        <FmtBtn active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} title="删除线">
          <Strikethrough className={iconSize} />
        </FmtBtn>
        <FmtBtn active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title="下划线">
          <Underline className={iconSize} />
        </FmtBtn>

        <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-0.5" />

        <FmtBtn active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()} title="行内代码">
          <Code className={iconSize} />
        </FmtBtn>
        <FmtBtn active={editor.isActive('link')} onClick={() => {
          if (editor.isActive('link')) {
            editor.chain().focus().unsetLink().run();
          } else {
            const url = window.prompt('输入链接 URL');
            if (url) editor.chain().focus().setLink({ href: url }).run();
          }
        }} title="链接">
          <Link className={iconSize} />
        </FmtBtn>
        <FmtBtn active={editor.isActive('highlight')} onClick={() => editor.chain().focus().toggleHighlight().run()} title="高亮">
          <Highlighter className={iconSize} />
        </FmtBtn>

        <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-0.5" />

        <FmtBtn active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()} title="左对齐">
          <AlignLeft className={iconSize} />
        </FmtBtn>
        <FmtBtn active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()} title="居中">
          <AlignCenter className={iconSize} />
        </FmtBtn>
        <FmtBtn active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()} title="右对齐">
          <AlignRight className={iconSize} />
        </FmtBtn>

        {/* Comment button */}
        {onAddComment && (
          <>
            <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-0.5" />
            <div className="relative">
              <FmtBtn active={commentOpen} onClick={() => {
                setCommentOpen((v) => !v);
                setTimeout(() => commentInputRef.current?.focus(), 50);
              }} title="添加评论">
                <MessageSquarePlus className={iconSize} />
              </FmtBtn>
              {commentOpen && (
                <div className="absolute top-full right-0 mt-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-2 min-w-[220px] z-50">
                  <textarea
                    ref={commentInputRef}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        if (!commentText.trim()) return;
                        const { from, to } = editor.state.selection;
                        const quote = editor.state.doc.textBetween(from, to, ' ');
                        const commentId = onAddComment(quote, commentText.trim());
                        editor.chain().focus().setCommentMark(commentId).run();
                        onCommentAdded?.(commentId);
                        setCommentText('');
                        setCommentOpen(false);
                      }
                      if (e.key === 'Escape') { setCommentOpen(false); setCommentText(''); }
                    }}
                    placeholder="输入评论... (⌘+Enter 发送)"
                    rows={2}
                    className="w-full px-2 py-1.5 text-xs bg-transparent border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-blue-500 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 resize-none"
                  />
                  <div className="flex justify-end mt-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (!commentText.trim()) return;
                        const { from, to } = editor.state.selection;
                        const quote = editor.state.doc.textBetween(from, to, ' ');
                        const commentId = onAddComment(quote, commentText.trim());
                        editor.chain().focus().setCommentMark(commentId).run();
                        onCommentAdded?.(commentId);
                        setCommentText('');
                        setCommentOpen(false);
                      }}
                      disabled={!commentText.trim()}
                      className="px-2.5 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-40 transition-colors"
                    >
                      评论
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </BubbleMenu>
  );
}
