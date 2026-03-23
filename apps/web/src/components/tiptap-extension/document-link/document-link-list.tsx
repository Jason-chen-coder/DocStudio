'use client';

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
  useCallback,
  useRef,
} from 'react';
import { FileText } from 'lucide-react';

export interface DocumentLinkItem {
  id: string;
  title: string;
  spaceId: string;
}

export interface DocumentLinkListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

interface DocumentLinkListProps {
  items: DocumentLinkItem[];
  command: (item: DocumentLinkItem) => void;
}

export const DocumentLinkList = forwardRef<DocumentLinkListRef, DocumentLinkListProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      setSelectedIndex(0);
    }, [items]);

    useEffect(() => {
      const container = listRef.current;
      if (!container) return;
      const selected = container.querySelector('[data-selected="true"]');
      if (selected) selected.scrollIntoView({ block: 'nearest' });
    }, [selectedIndex]);

    const selectItem = useCallback(
      (index: number) => {
        const item = items[index];
        if (item) command(item);
      },
      [items, command],
    );

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (event.key === 'ArrowUp') {
          setSelectedIndex((prev) => (prev + items.length - 1) % items.length);
          return true;
        }
        if (event.key === 'ArrowDown') {
          setSelectedIndex((prev) => (prev + 1) % items.length);
          return true;
        }
        if (event.key === 'Enter') {
          selectItem(selectedIndex);
          return true;
        }
        return false;
      },
    }));

    if (items.length === 0) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-3 text-sm text-gray-400 dark:text-gray-500 text-center w-64">
          未找到文档
        </div>
      );
    }

    return (
      <div
        ref={listRef}
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden w-64 max-h-64 overflow-y-auto py-1"
      >
        {items.map((doc, index) => {
          const isSelected = index === selectedIndex;
          return (
            <button
              key={doc.id}
              data-selected={isSelected}
              onClick={() => selectItem(index)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-green-50 dark:bg-green-900/20'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isSelected
                    ? 'bg-green-100 dark:bg-green-800/30 text-green-600 dark:text-green-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
              </div>
              <p
                className={`text-sm font-medium truncate ${
                  isSelected
                    ? 'text-green-700 dark:text-green-300'
                    : 'text-gray-900 dark:text-gray-100'
                }`}
              >
                {doc.title}
              </p>
            </button>
          );
        })}
      </div>
    );
  },
);

DocumentLinkList.displayName = 'DocumentLinkList';
