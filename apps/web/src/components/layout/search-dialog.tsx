'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Search, FileText, Loader2 } from 'lucide-react';
import { searchService } from '@/services/search-service';
import type { SearchResult } from '@/types/search';
import { cn } from '@/lib/utils';

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightText(text: string, query: string): React.ReactNode {
  if (!query || !text) return text;
  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark
        key={i}
        className="bg-yellow-200 dark:bg-yellow-800 text-inherit rounded px-0.5"
      >
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '昨天';
  if (diffDays < 7) return `${diffDays}天前`;
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const abortRef = useRef<AbortController>(undefined);
  const listRef = useRef<HTMLDivElement>(null);

  const doSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    // 取消上次请求
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const res = await searchService.search(searchQuery, 1, 20, controller.signal);
      setResults(res.data);
      setTotal(res.total);
      setSelectedIndex(0);
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        console.error('Search failed:', e);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  const handleInputChange = (value: string) => {
    setQuery(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doSearch(value);
    }, 300);
  };

  const navigateToResult = (result: SearchResult) => {
    onOpenChange(false);
    router.push(`/spaces/${result.spaceId}/documents/${result.id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      navigateToResult(results[selectedIndex]);
    }
  };

  // 保持选中项在视图内
  useEffect(() => {
    if (listRef.current) {
      const selected = listRef.current.children[selectedIndex] as HTMLElement;
      selected?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // 关闭时重置状态
  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
      setTotal(0);
      setSelectedIndex(0);
      setLoading(false);
    }
  }, [open]);

  // 全局快捷键
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [open, onOpenChange]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed left-[50%] top-[20%] z-50 w-full max-w-xl translate-x-[-50%] rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=open]:slide-in-from-left-1/2"
          onKeyDown={handleKeyDown}
        >
          {/* 隐藏标题和描述（无障碍） */}
          <DialogPrimitive.Title className="sr-only">搜索文档</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">在所有空间中搜索文档</DialogPrimitive.Description>

          {/* 搜索输入框 */}
          <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
            <Search className="h-5 w-5 text-gray-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="搜索文档..."
              autoFocus
              className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none"
            />
            {loading && (
              <Loader2 className="h-4 w-4 text-gray-400 animate-spin flex-shrink-0" />
            )}
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium text-gray-400 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
              ESC
            </kbd>
          </div>

          {/* 搜索结果 */}
          <div
            ref={listRef}
            className="max-h-[400px] overflow-y-auto overscroll-contain"
          >
            {query && !loading && results.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                未找到相关文档
              </div>
            )}

            {!query && !loading && (
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                输入关键词搜索文档
              </div>
            )}

            {results.map((result, index) => (
              <button
                key={result.id}
                onClick={() => navigateToResult(result)}
                className={cn(
                  'w-full text-left px-4 py-3 flex items-start gap-3 transition-colors cursor-pointer',
                  index === selectedIndex
                    ? 'bg-blue-50 dark:bg-blue-900/20'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50',
                  index !== results.length - 1 &&
                    'border-b border-gray-100 dark:border-gray-700/50',
                )}
              >
                <FileText className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {highlightText(result.title || '无标题', query)}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-blue-600 dark:text-blue-400 truncate max-w-[120px]">
                      {result.spaceName}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatTime(result.updatedAt)}
                    </span>
                  </div>
                  {result.snippet && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                      {highlightText(result.snippet, query)}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* 底部提示 */}
          {results.length > 0 && (
            <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 px-4 py-2 text-xs text-gray-400">
              <span>
                共 {total} 个结果
              </span>
              <div className="flex items-center gap-3">
                <span>
                  <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[10px]">↑↓</kbd>
                  {' '}导航
                </span>
                <span>
                  <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[10px]">↵</kbd>
                  {' '}打开
                </span>
              </div>
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
