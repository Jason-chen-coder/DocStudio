'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCheck, Trash2, Settings } from 'lucide-react';
import { Notification } from '@/services/notification-service';
import { NotificationItem } from './notification-item';
import { NotificationEmpty } from './notification-empty';
import { cn } from '@/lib/utils';

type FilterTab = 'all' | 'unread';

interface NotificationDropdownProps {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  hasMore: boolean;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
  onClearRead: () => void;
  onLoadMore: () => void;
  onClose: () => void;
}

export function NotificationDropdown({
  notifications,
  unreadCount,
  loading,
  hasMore,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onClearRead,
  onLoadMore,
  onClose,
}: NotificationDropdownProps) {
  const [filter, setFilter] = useState<FilterTab>('all');

  const filtered =
    filter === 'unread'
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  return (
    <div className="w-[380px] max-h-[480px] flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* 头部 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          通知
          {unreadCount > 0 && (
            <span className="ml-2 text-xs font-normal text-gray-400">
              {unreadCount} 条未读
            </span>
          )}
        </h3>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="全部标记已读"
            >
              <CheckCheck className="w-4 h-4" />
            </button>
          )}
          {notifications.some((n) => n.isRead) && (
            <button
              onClick={onClearRead}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="清除已读通知"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <Link
            href="/settings/notifications"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="通知设置"
          >
            <Settings className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 筛选标签 */}
      <div className="flex px-4 pt-2 pb-1 gap-1">
        {(['all', 'unread'] as FilterTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded-full transition-colors',
              filter === tab
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700',
            )}
          >
            {tab === 'all' ? '全部' : '未读'}
          </button>
        ))}
      </div>

      {/* 通知列表 */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <NotificationEmpty />
        ) : (
          <>
            {filtered.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={onMarkAsRead}
                onDelete={onDelete}
                onClose={onClose}
              />
            ))}
            {hasMore && filter === 'all' && (
              <div className="px-4 py-3 text-center">
                <button
                  onClick={onLoadMore}
                  disabled={loading}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
                >
                  {loading ? '加载中...' : '加载更多'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
