'use client';

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
  useCallback,
  useRef,
} from 'react';

export interface MentionUser {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string | null;
}

export interface MentionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

interface MentionListProps {
  items: MentionUser[];
  command: (item: { id: string; label: string }) => void;
}

export const MentionList = forwardRef<MentionListRef, MentionListProps>(
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
        if (item) command({ id: item.id, label: item.name });
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
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-3 text-sm text-gray-400 dark:text-gray-500 text-center w-60">
          未找到成员
        </div>
      );
    }

    return (
      <div
        ref={listRef}
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden w-60 max-h-64 overflow-y-auto py-1"
      >
        {items.map((user, index) => {
          const isSelected = index === selectedIndex;
          return (
            <button
              key={user.id}
              data-selected={isSelected}
              onClick={() => selectItem(index)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-blue-50 dark:bg-blue-900/20'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                  isSelected
                    ? 'bg-blue-100 dark:bg-blue-800/30 text-blue-600 dark:text-blue-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <p
                  className={`text-sm font-medium truncate ${
                    isSelected
                      ? 'text-blue-700 dark:text-blue-300'
                      : 'text-gray-900 dark:text-gray-100'
                  }`}
                >
                  {user.name}
                </p>
                {user.email && (
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">
                    {user.email}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    );
  },
);

MentionList.displayName = 'MentionList';
