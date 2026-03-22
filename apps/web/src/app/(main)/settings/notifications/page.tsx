'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { notificationService } from '@/services/notification-service';
import { Bell, ChevronLeft } from 'lucide-react';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/fade-in';

const NOTIFICATION_GROUPS: {
  title: string;
  description: string;
  types: { key: string; label: string; description: string }[];
}[] = [
  {
    title: '协作通知',
    description: '与团队成员协作相关的通知',
    types: [
      { key: 'SPACE_INVITATION', label: '空间邀请', description: '有人邀请你加入工作空间时通知' },
      { key: 'INVITATION_ACCEPTED', label: '邀请被接受', description: '你发出的邀请被接受时通知' },
      { key: 'MEMBER_JOINED', label: '成员加入', description: '有新成员加入你所在的空间时通知' },
      { key: 'MEMBER_REMOVED', label: '成员移除', description: '你被移出空间时通知' },
      { key: 'ROLE_CHANGED', label: '角色变更', description: '你的空间角色被变更时通知' },
    ],
  },
  {
    title: '文档通知',
    description: '与文档内容相关的通知',
    types: [
      { key: 'DOCUMENT_COMMENTED', label: '文档评论', description: '你的文档收到新评论时通知' },
      { key: 'DOCUMENT_MENTIONED', label: '@提及', description: '有人在文档中@提及你时通知' },
      { key: 'DOCUMENT_SHARED', label: '文档分享', description: '有人将文档分享给你时通知' },
      { key: 'DOCUMENT_UPDATED', label: '文档更新', description: '你关注的文档被更新时通知' },
    ],
  },
  {
    title: '系统通知',
    description: '平台级别的重要通知',
    types: [
      { key: 'SPACE_DELETED', label: '空间删除', description: '你所在的空间被删除时通知' },
      { key: 'SYSTEM', label: '系统公告', description: '系统公告和重要消息' },
    ],
  },
];

export default function NotificationSettingsPage() {
  const [preferences, setPreferences] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  async function loadPreferences() {
    try {
      const prefs = await notificationService.getPreferences();
      setPreferences(prefs);
    } catch {
      toast.error('加载通知偏好失败');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(type: string) {
    const newPrefs = {
      ...preferences,
      [type]: !preferences[type],
    };
    setPreferences(newPrefs);

    setSaving(true);
    try {
      await notificationService.updatePreferences(newPrefs);
      toast.success('偏好已更新');
    } catch {
      setPreferences(preferences);
      toast.error('更新失败');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse border-b border-gray-200 dark:border-gray-700 pb-6">
          <div className="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 w-64 bg-gray-100 dark:bg-gray-800 rounded mt-2" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="h-12 bg-gray-100 dark:bg-gray-700 rounded" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 — 与个人中心对齐 */}
      <FadeIn y={16} duration={0.4}>
        <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
          <Link
            href="/settings"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            返回设置
          </Link>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            通知设置
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            管理你希望接收的通知类型
          </p>
        </div>
      </FadeIn>

      {/* 通知分组 */}
      <StaggerContainer baseDelay={0.1} stagger={0.1} className="space-y-6">
        {NOTIFICATION_GROUPS.map((group) => (
          <StaggerItem key={group.title} y={16}>
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                  {group.title}
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                  {group.description}
                </p>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700/60">
                {group.types.map(({ key, label, description }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between px-4 py-4 sm:px-6"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Bell className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {label}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                          {description}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggle(key)}
                      disabled={saving}
                      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ml-4 ${
                        preferences[key] !== false
                          ? 'bg-blue-600'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                          preferences[key] !== false ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </div>
  );
}
