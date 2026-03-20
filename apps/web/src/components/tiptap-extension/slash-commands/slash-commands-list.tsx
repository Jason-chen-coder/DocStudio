'use client';

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
  useCallback,
  useRef,
} from 'react';
import type { SlashCommandItem } from './slash-commands-items';

export interface SlashCommandsListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

interface SlashCommandsListProps {
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
}

export const SlashCommandsList = forwardRef<SlashCommandsListRef, SlashCommandsListProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const listRef = useRef<HTMLDivElement>(null);

    // Reset selection when items change
    useEffect(() => {
      setSelectedIndex(0);
    }, [items]);

    // Scroll selected item into view
    useEffect(() => {
      const container = listRef.current;
      if (!container) return;
      const selected = container.querySelector('[data-selected="true"]');
      if (selected) {
        selected.scrollIntoView({ block: 'nearest' });
      }
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
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-4 text-sm text-gray-400 dark:text-gray-500 text-center w-72">
          未找到匹配的命令
        </div>
      );
    }

    // Group items
    const groups: Record<string, SlashCommandItem[]> = {};
    items.forEach((item) => {
      if (!groups[item.group]) groups[item.group] = [];
      groups[item.group].push(item);
    });

    let flatIndex = 0;

    return (
      <div
        ref={listRef}
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden w-72 max-h-80 overflow-y-auto"
      >
        {Object.entries(groups).map(([groupName, groupItems]) => (
          <div key={groupName}>
            {/* Group header */}
            <div className="px-3 pt-2.5 pb-1">
              <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                {groupName}
              </span>
            </div>

            {/* Items */}
            {groupItems.map((item) => {
              const currentIndex = flatIndex++;
              const isSelected = currentIndex === selectedIndex;
              const Icon = item.icon;

              return (
                <button
                  key={item.title}
                  data-selected={isSelected}
                  onClick={() => selectItem(currentIndex)}
                  onMouseEnter={() => setSelectedIndex(currentIndex)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-blue-100 dark:bg-blue-800/30 text-blue-600 dark:text-blue-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-medium truncate ${
                        isSelected
                          ? 'text-blue-700 dark:text-blue-300'
                          : 'text-gray-900 dark:text-gray-100'
                      }`}
                    >
                      {item.title}
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">
                      {item.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    );
  },
);

SlashCommandsList.displayName = 'SlashCommandsList';
