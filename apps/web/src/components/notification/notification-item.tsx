'use client';

import { useRouter } from 'next/navigation';
import { Notification, NotificationType } from '@/services/notification-service';
import { cn } from '@/lib/utils';
import {
  UserPlus,
  UserCheck,
  UserMinus,
  UserCog,
  MessageSquare,
  AtSign,
  Share2,
  FileEdit,
  Trash2,
  Bell,
  Users,
} from 'lucide-react';

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'SPACE_INVITATION':
      return <UserPlus className="w-4 h-4 text-blue-500" />;
    case 'INVITATION_ACCEPTED':
      return <UserCheck className="w-4 h-4 text-green-500" />;
    case 'MEMBER_JOINED':
      return <Users className="w-4 h-4 text-green-500" />;
    case 'MEMBER_REMOVED':
      return <UserMinus className="w-4 h-4 text-red-500" />;
    case 'ROLE_CHANGED':
      return <UserCog className="w-4 h-4 text-orange-500" />;
    case 'DOCUMENT_COMMENTED':
      return <MessageSquare className="w-4 h-4 text-purple-500" />;
    case 'DOCUMENT_MENTIONED':
      return <AtSign className="w-4 h-4 text-indigo-500" />;
    case 'DOCUMENT_SHARED':
      return <Share2 className="w-4 h-4 text-blue-500" />;
    case 'DOCUMENT_UPDATED':
      return <FileEdit className="w-4 h-4 text-gray-500" />;
    case 'SPACE_DELETED':
      return <Trash2 className="w-4 h-4 text-red-500" />;
    case 'SYSTEM':
    default:
      return <Bell className="w-4 h-4 text-gray-500" />;
  }
}

function getNotificationRoute(notification: Notification): string | null {
  const { type, entityId, spaceId } = notification;

  switch (type) {
    case 'SPACE_INVITATION':
      return '/spaces';
    case 'INVITATION_ACCEPTED':
    case 'MEMBER_JOINED':
    case 'MEMBER_REMOVED':
    case 'ROLE_CHANGED':
      return spaceId ? `/spaces/${spaceId}/members` : null;
    case 'DOCUMENT_COMMENTED':
    case 'DOCUMENT_MENTIONED':
    case 'DOCUMENT_SHARED':
    case 'DOCUMENT_UPDATED':
      return spaceId && entityId
        ? `/spaces/${spaceId}/documents/${entityId}`
        : null;
    case 'SPACE_DELETED':
      return '/spaces';
    default:
      return null;
  }
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;

  return date.toLocaleDateString('zh-CN');
}

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClose?: () => void;
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  onClose,
}: NotificationItemProps) {
  const router = useRouter();

  const handleClick = () => {
    // 标记已读
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }

    // 跳转到相关页面
    const route = getNotificationRoute(notification);
    if (route) {
      onClose?.();
      router.push(route);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-gray-50 dark:border-gray-700/50 last:border-b-0',
        notification.isRead
          ? 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50'
          : 'bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-50 dark:hover:bg-blue-900/20',
      )}
    >
      {/* 图标 */}
      <div className="flex-shrink-0 mt-0.5 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
        {getNotificationIcon(notification.type)}
      </div>

      {/* 内容 */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm leading-snug',
            notification.isRead
              ? 'text-gray-600 dark:text-gray-400'
              : 'text-gray-900 dark:text-gray-100 font-medium',
          )}
        >
          {notification.title}
        </p>
        {notification.content && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
            {notification.content}
          </p>
        )}
        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
          {formatTimeAgo(notification.createdAt)}
        </p>
      </div>

      {/* 未读指示器 */}
      {!notification.isRead && (
        <div className="flex-shrink-0 mt-2">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
        </div>
      )}
    </div>
  );
}
