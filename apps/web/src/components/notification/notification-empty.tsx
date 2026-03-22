'use client';

import { Bell } from 'lucide-react';

export function NotificationEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3">
        <Bell className="w-6 h-6 text-gray-400 dark:text-gray-500" />
      </div>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
        暂无通知
      </p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
        有新动态时会在这里提醒你
      </p>
    </div>
  );
}
