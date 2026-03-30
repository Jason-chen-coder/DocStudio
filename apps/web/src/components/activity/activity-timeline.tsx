'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  activityService,
  ActivityLogItem,
  ActivityAction,
  EntityType,
} from '@/services/activity-service';
import { documentService } from '@/services/document-service';
import {
  FileText,
  FolderOpen,
  Trash2,
  Edit3,
  Eye,
  Share2,
  UserPlus,
  UserMinus,
  Shield,
  RotateCcw,
  Move,
  Plus,
  ChevronDown,
} from 'lucide-react';

// ==================== 工具函数 ====================

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin} 分钟前`;
  if (diffHour < 24) return `${diffHour} 小时前`;
  if (diffDay < 7) return `${diffDay} 天前`;
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getActionIcon(action: ActivityAction) {
  const iconMap: Record<ActivityAction, React.ReactNode> = {
    CREATE: <Plus className="w-4 h-4" />,
    UPDATE: <Edit3 className="w-4 h-4" />,
    DELETE: <Trash2 className="w-4 h-4" />,
    VIEW: <Eye className="w-4 h-4" />,
    MOVE: <Move className="w-4 h-4" />,
    RESTORE: <RotateCcw className="w-4 h-4" />,
    SHARE: <Share2 className="w-4 h-4" />,
    JOIN: <UserPlus className="w-4 h-4" />,
    LEAVE: <UserMinus className="w-4 h-4" />,
    INVITE: <UserPlus className="w-4 h-4" />,
    ROLE_CHANGE: <Shield className="w-4 h-4" />,
  };
  return iconMap[action] || <FileText className="w-4 h-4" />;
}

function getActionColor(action: ActivityAction): string {
  const colorMap: Record<ActivityAction, string> = {
    CREATE: 'text-green-500 bg-green-50 dark:bg-green-900/20',
    UPDATE: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
    DELETE: 'text-red-500 bg-red-50 dark:bg-red-900/20',
    VIEW: 'text-gray-500 bg-gray-50 dark:bg-gray-700',
    MOVE: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20',
    RESTORE: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20',
    SHARE: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-900/20',
    JOIN: 'text-green-500 bg-green-50 dark:bg-green-900/20',
    LEAVE: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
    INVITE: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20',
    ROLE_CHANGE: 'text-violet-500 bg-violet-50 dark:bg-violet-900/20',
  };
  return colorMap[action] || 'text-gray-500 bg-gray-50 dark:bg-gray-700';
}

function getActionLabel(action: ActivityAction, entityType: EntityType): string {
  const labels: Record<string, string> = {
    'CREATE_DOCUMENT': '创建了文档',
    'UPDATE_DOCUMENT': '编辑了文档',
    'DELETE_DOCUMENT': '删除了文档',
    'VIEW_DOCUMENT': '查看了文档',
    'MOVE_DOCUMENT': '移动了文档',
    'RESTORE_SNAPSHOT': '恢复了版本',
    'SHARE_SHARE_LINK': '分享了文档',
    'CREATE_SPACE': '创建了空间',
    'UPDATE_SPACE': '更新了空间',
    'DELETE_SPACE': '删除了空间',
    'JOIN_SPACE': '加入了空间',
    'LEAVE_MEMBER': '移除了成员',
    'INVITE_MEMBER': '邀请了成员',
    'ROLE_CHANGE_MEMBER': '变更了角色',
  };

  return labels[`${action}_${entityType}`] || `${action} ${entityType}`;
}

function getEntityIcon(entityType: EntityType) {
  if (entityType === 'DOCUMENT') return <FileText className="w-3 h-3" />;
  if (entityType === 'SPACE') return <FolderOpen className="w-3 h-3" />;
  return null;
}

// ==================== 组件 ====================

interface ActivityTimelineProps {
  spaceId?: string; // 如果提供则显示空间活动，否则显示个人活动
  compact?: boolean; // 紧凑模式（用于 sidebar 或卡片内嵌）
  /** Max items to display inline. Defaults to all fetched items. */
  maxItems?: number;
}

export function ActivityTimeline({ spaceId, compact = false, maxItems }: ActivityTimelineProps) {
  const [activities, setActivities] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const router = useRouter();
  const limit = compact ? 10 : 30;

  const fetchActivities = useCallback(
    async (pageNum: number, append = false) => {
      try {
        if (append) setLoadingMore(true);
        else setLoading(true);

        const res = spaceId
          ? await activityService.getSpaceActivity(spaceId, pageNum, limit)
          : await activityService.getMyActivity(pageNum, limit);

        if (append) {
          setActivities((prev) => [...prev, ...res.data]);
        } else {
          setActivities(res.data);
        }
        setTotal(res.total);
        setPage(pageNum);
      } catch (err) {
        console.error('Failed to fetch activity', err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [spaceId, limit],
  );

  const fetchedRef = useRef(false);
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchActivities(1);
  }, [fetchActivities]);

  const hasMore = activities.length < total;

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchActivities(page + 1, true);
    }
  };

  const handleEntityClick = async (item: ActivityLogItem) => {
    if (item.entityType === 'DOCUMENT' && item.spaceId) {
      // 已删除的文档直接提示，不跳转
      if (item.action === 'DELETE') {
        toast.error('该文档已被删除', { description: item.entityName });
        return;
      }
      // 其他操作先验证文档是否还存在（轻量检查，不加载全量数据）
      const exists = await documentService.checkExists(item.entityId);
      if (exists) {
        router.push(`/spaces/${item.spaceId}/documents/${item.entityId}?readonly=true`);
      } else {
        toast.error('该文档已被删除或无权访问', { description: item.entityName });
      }
    } else if (item.entityType === 'SPACE') {
      router.push(`/spaces/${item.entityId}`);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(compact ? 3 : 6)].map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-3/4" />
              <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <FolderOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="text-sm">暂无活动记录</p>
      </div>
    );
  }

  // 按日期分组
  const visibleActivities = maxItems ? activities.slice(0, maxItems) : activities;
  const groupedByDate = visibleActivities.reduce<Record<string, ActivityLogItem[]>>(
    (acc, item) => {
      const dateKey = new Date(item.createdAt).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(item);
      return acc;
    },
    {},
  );

  return (
    <div className="space-y-6">
      {Object.entries(groupedByDate).map(([date, items]) => (
        <div key={date}>
          {!compact && (
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              {date}
            </h4>
          )}
          <div className="space-y-1">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition group"
              >
                {/* Icon */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getActionColor(item.action)}`}
                >
                  {getActionIcon(item.action)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {item.user.name}
                    </span>{' '}
                    {getActionLabel(item.action, item.entityType)}{' '}
                    {item.entityName && item.action === 'DELETE' ? (
                      <span className="inline-flex items-center gap-1 text-gray-400 dark:text-gray-500 line-through">
                        {getEntityIcon(item.entityType)}
                        {item.entityName}
                      </span>
                    ) : item.entityName ? (
                      <button
                        onClick={() => handleEntityClick(item)}
                        className="font-medium text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                      >
                        {getEntityIcon(item.entityType)}
                        {item.entityName}
                      </button>
                    ) : null}
                  </p>

                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {formatRelativeTime(item.createdAt)}
                    </span>
                    {item.spaceName && !spaceId && (
                      <span
                        role="button"
                        onClick={() => router.push(`/spaces/${item.spaceId}`)}
                        className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 transition-colors cursor-pointer"
                      >
                        {item.spaceName}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Load more */}
      {hasMore && !maxItems && (
        <div className="text-center pt-2">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="inline-flex items-center gap-1 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            {loadingMore ? (
              <span className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            {loadingMore ? '加载中...' : '加载更多'}
          </button>
        </div>
      )}
    </div>
  );
}
