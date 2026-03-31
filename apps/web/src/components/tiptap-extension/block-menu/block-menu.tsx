'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { GripVertical, Plus, Trash2, Copy, ArrowUp, ArrowDown } from 'lucide-react';
import type { Editor } from '@tiptap/core';

interface BlockMenuProps {
  editor: Editor;
}

/**
 * Floating block menu that appears on hover over editor blocks.
 * Shows a drag grip + action menu (add above, copy, delete, move up/down).
 */
export function BlockMenu({ editor }: BlockMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [top, setTop] = useState(0);
  const [blockPos, setBlockPos] = useState<number | null>(null);

  const updatePosition = useCallback(
    (event: MouseEvent) => {
      if (!editor.isEditable || menuOpen) return;

      const editorEl = editor.view.dom;
      const editorRect = editorEl.getBoundingClientRect();
      const { clientX, clientY } = event;

      // Only show when mouse is near the left edge of the editor
      if (
        clientX < editorRect.left - 60 ||
        clientX > editorRect.left + 40 ||
        clientY < editorRect.top ||
        clientY > editorRect.bottom
      ) {
        setVisible(false);
        return;
      }

      // Find the block node at the current Y position
      const pos = editor.view.posAtCoords({ left: editorRect.left + 10, top: clientY });
      if (!pos) {
        setVisible(false);
        return;
      }

      const resolved = editor.state.doc.resolve(pos.pos);
      // Get the top-level block (depth 1)
      const blockDepth = Math.min(resolved.depth, 1);
      const blockStart = resolved.before(blockDepth + 1);

      // Get the DOM node for this block
      const domNode = editor.view.nodeDOM(blockStart);
      if (!domNode || !(domNode instanceof HTMLElement)) {
        setVisible(false);
        return;
      }

      const nodeRect = domNode.getBoundingClientRect();
      const scrollContainer = editorEl.closest('.simple-editor-content');
      const containerRect = scrollContainer?.getBoundingClientRect() || editorRect;

      setTop(nodeRect.top - containerRect.top + (scrollContainer?.scrollTop || 0));
      setBlockPos(blockStart);
      setVisible(true);
    },
    [editor, menuOpen],
  );

  // Touch support: show block menu on tap near left edge of a block
  const handleTouchStart = useCallback(
    (event: TouchEvent) => {
      if (!editor.isEditable || menuOpen) return;

      const touch = event.touches[0];
      if (!touch) return;

      const editorEl = editor.view.dom;
      const editorRect = editorEl.getBoundingClientRect();

      // Find the block node at the touch position
      const pos = editor.view.posAtCoords({ left: editorRect.left + 10, top: touch.clientY });
      if (!pos) return;

      const resolved = editor.state.doc.resolve(pos.pos);
      const blockDepth = Math.min(resolved.depth, 1);
      const blockStart = resolved.before(blockDepth + 1);

      const domNode = editor.view.nodeDOM(blockStart);
      if (!domNode || !(domNode instanceof HTMLElement)) return;

      const nodeRect = domNode.getBoundingClientRect();
      const scrollContainer = editorEl.closest('.simple-editor-content');
      const containerRect = scrollContainer?.getBoundingClientRect() || editorRect;

      setTop(nodeRect.top - containerRect.top + (scrollContainer?.scrollTop || 0));
      setBlockPos(blockStart);
      setVisible(true);
    },
    [editor, menuOpen],
  );

  useEffect(() => {
    const editorEl = editor.view.dom;
    const container = editorEl.closest('.simple-editor-content') || editorEl.parentElement;
    if (!container) return;

    container.addEventListener('mousemove', updatePosition as EventListener);
    container.addEventListener('mouseleave', () => {
      if (!menuOpen) setVisible(false);
    });
    container.addEventListener('touchstart', handleTouchStart as EventListener, { passive: true });

    return () => {
      container.removeEventListener('mousemove', updatePosition as EventListener);
      container.removeEventListener('touchstart', handleTouchStart as EventListener);
    };
  }, [editor, updatePosition, handleTouchStart, menuOpen]);

  const handleAction = useCallback(
    (action: 'delete' | 'duplicate' | 'moveUp' | 'moveDown' | 'addAbove') => {
      if (blockPos === null) return;

      const { state } = editor;
      const node = state.doc.nodeAt(blockPos);
      if (!node) return;

      switch (action) {
        case 'delete':
          editor
            .chain()
            .focus()
            .command(({ tr }) => {
              tr.delete(blockPos, blockPos + node.nodeSize);
              return true;
            })
            .run();
          break;

        case 'duplicate':
          editor
            .chain()
            .focus()
            .command(({ tr }) => {
              tr.insert(blockPos + node.nodeSize, node.copy(node.content));
              return true;
            })
            .run();
          break;

        case 'addAbove':
          editor
            .chain()
            .focus()
            .command(({ tr }) => {
              const paragraph = state.schema.nodes.paragraph.create();
              tr.insert(blockPos, paragraph);
              return true;
            })
            .run();
          break;

        case 'moveUp': {
          if (blockPos === 0) break;
          const $pos = state.doc.resolve(blockPos);
          if ($pos.index($pos.depth) === 0) break;
          const prevNode = state.doc.child($pos.index($pos.depth) - 1);
          editor
            .chain()
            .focus()
            .command(({ tr }) => {
              const prevStart = blockPos - prevNode.nodeSize;
              tr.delete(blockPos, blockPos + node.nodeSize);
              tr.insert(prevStart, node);
              return true;
            })
            .run();
          break;
        }

        case 'moveDown': {
          const $pos = state.doc.resolve(blockPos);
          if ($pos.index($pos.depth) >= state.doc.childCount - 1) break;
          const nextNode = state.doc.child($pos.index($pos.depth) + 1);
          editor
            .chain()
            .focus()
            .command(({ tr }) => {
              const afterNext = blockPos + node.nodeSize + nextNode.nodeSize;
              tr.delete(blockPos, blockPos + node.nodeSize);
              tr.insert(afterNext - node.nodeSize, node);
              return true;
            })
            .run();
          break;
        }
      }

      setMenuOpen(false);
    },
    [editor, blockPos],
  );

  if (!editor.isEditable) return null;

  return (
    <div
      ref={menuRef}
      className="absolute z-30 flex items-center"
      style={{
        top: `${top}px`,
        left: '-36px',
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'opacity 0.15s ease',
      }}
    >
      {/* Grip handle / trigger */}
      <button
        type="button"
        onClick={() => setMenuOpen(!menuOpen)}
        onMouseDown={(e) => e.preventDefault()}
        className="p-1 text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors cursor-grab active:cursor-grabbing touch-manipulation"
        title="块操作"
        aria-label="块级操作菜单"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Dropdown menu */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl py-1 min-w-[140px]">
            {[
              { icon: Plus, label: '上方插入', action: 'addAbove' as const },
              { icon: Copy, label: '复制块', action: 'duplicate' as const },
              { icon: ArrowUp, label: '上移', action: 'moveUp' as const },
              { icon: ArrowDown, label: '下移', action: 'moveDown' as const },
              { icon: Trash2, label: '删除', action: 'delete' as const, danger: true },
            ].map((item) => (
              <button
                key={item.action}
                type="button"
                onClick={() => handleAction(item.action)}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-colors cursor-pointer ${
                  item.danger
                    ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
