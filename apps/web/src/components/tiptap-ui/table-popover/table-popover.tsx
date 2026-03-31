'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Table } from 'lucide-react';
import { useTiptapEditor } from '@/hooks/use-tiptap-editor';
import type { Editor } from '@tiptap/core';

interface TablePopoverProps {
  editor?: Editor | null;
}

const MAX_ROWS = 6;
const MAX_COLS = 6;

export function TablePopover({ editor: providedEditor }: TablePopoverProps) {
  const { editor } = useTiptapEditor(providedEditor);
  const [isOpen, setIsOpen] = useState(false);
  const [hoverRow, setHoverRow] = useState(0);
  const [hoverCol, setHoverCol] = useState(0);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isOpen && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const popoverWidth = MAX_COLS * 28 + 24; // cell size + padding
      const popoverHeight = MAX_ROWS * 28 + 48; // cells + label + padding

      // Ensure popover stays within viewport
      let left = rect.left;
      let top = rect.bottom + 4;

      if (left + popoverWidth > window.innerWidth - 8) {
        left = window.innerWidth - popoverWidth - 8;
      }
      if (left < 8) {
        left = 8;
      }
      if (top + popoverHeight > window.innerHeight - 8) {
        top = rect.top - popoverHeight - 4;
      }

      setPos({ top, left });
    }
  }, [isOpen]);

  const handleInsert = useCallback(() => {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .insertTable({ rows: hoverRow, cols: hoverCol, withHeaderRow: true })
      .run();
    setIsOpen(false);
    setHoverRow(0);
    setHoverCol(0);
  }, [editor, hoverRow, hoverCol]);

  if (!editor) return null;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="tiptap-button flex items-center gap-1 px-2 py-1.5 rounded-md text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
        title="插入表格"
        aria-label="插入表格"
      >
        <Table className="w-4 h-4" />
      </button>

      {isOpen && createPortal(
        <>
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => { setIsOpen(false); setHoverRow(0); setHoverCol(0); }}
          />
          <div
            className="fixed z-[9999] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-3"
            style={{ top: pos.top, left: pos.left }}
          >
            <div
              className="grid gap-1"
              style={{ gridTemplateColumns: `repeat(${MAX_COLS}, 1fr)` }}
            >
              {Array.from({ length: MAX_ROWS * MAX_COLS }).map((_, i) => {
                const row = Math.floor(i / MAX_COLS) + 1;
                const col = (i % MAX_COLS) + 1;
                const isHighlighted = row <= hoverRow && col <= hoverCol;
                return (
                  <button
                    key={i}
                    type="button"
                    onMouseEnter={() => { setHoverRow(row); setHoverCol(col); }}
                    onClick={handleInsert}
                    className={`w-6 h-6 rounded border transition-colors cursor-pointer ${
                      isHighlighted
                        ? 'bg-blue-500 border-blue-400'
                        : 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                    aria-label={`${row}×${col} 表格`}
                  />
                );
              })}
            </div>
            <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-2 tabular-nums">
              {hoverRow > 0 && hoverCol > 0 ? `${hoverRow} × ${hoverCol} 表格` : '选择大小'}
            </p>
          </div>
        </>,
        document.body,
      )}
    </>
  );
}
