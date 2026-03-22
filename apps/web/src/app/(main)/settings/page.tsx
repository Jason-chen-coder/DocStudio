'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import {
  Bell,
  ChevronRight,
  UserCircle,
  Shield,
  Palette,
} from 'lucide-react';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/fade-in';

interface SettingsGroup {
  title: string;
  items: SettingsItem[];
}

interface SettingsItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  iconBg: string;
  label: string;
  description: string;
  comingSoon?: boolean;
}

const settingsGroups: SettingsGroup[] = [
  {
    title: '账户',
    items: [
      {
        href: '/profile',
        icon: UserCircle,
        iconColor: 'text-violet-500',
        iconBg: 'bg-violet-50 dark:bg-violet-500/10',
        label: '个人资料',
        description: '编辑头像、姓名和个人信息',
      },
      {
        href: '/settings/security',
        icon: Shield,
        iconColor: 'text-emerald-500',
        iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
        label: '安全设置',
        description: '修改密码和账户安全选项',
      },
    ],
  },
  {
    title: '偏好',
    items: [
      {
        href: '/settings/notifications',
        icon: Bell,
        iconColor: 'text-blue-500',
        iconBg: 'bg-blue-50 dark:bg-blue-500/10',
        label: '通知设置',
        description: '管理你希望接收的通知类型',
      },
      {
        href: '/settings/appearance',
        icon: Palette,
        iconColor: 'text-amber-500',
        iconBg: 'bg-amber-50 dark:bg-amber-500/10',
        label: '外观',
        description: '主题、语言与显示偏好',
      },
    ],
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* 页面标题 — 与个人中心对齐 */}
      <FadeIn y={16} duration={0.4}>
        <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            设置
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            管理你的账户偏好和系统设置
          </p>
        </div>
      </FadeIn>

      {/* 设置分组 */}
      <StaggerContainer baseDelay={0.15} stagger={0.1} className="space-y-6">
        {settingsGroups.map((group) => (
          <StaggerItem key={group.title} y={16}>
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
              <div className="px-4 py-4 sm:px-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {group.title}
                </h3>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700/60">
                {group.items.map((item) => {
                  const content = (
                    <>
                      <div className={`w-9 h-9 rounded-lg ${item.iconBg} flex items-center justify-center flex-shrink-0`}>
                        <item.icon className={`w-[18px] h-[18px] ${item.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {item.label}
                          </p>
                          {item.comingSoon && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                              即将推出
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                          {item.description}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors flex-shrink-0" />
                    </>
                  );

                  if (item.comingSoon) {
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => toast('敬请期待', { description: `「${item.label}」功能正在开发中` })}
                        className="flex items-center gap-4 px-4 py-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group w-full text-left"
                      >
                        {content}
                      </button>
                    );
                  }

                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="flex items-center gap-4 px-4 py-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                    >
                      {content}
                    </Link>
                  );
                })}
              </div>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* 版本信息 */}
      <FadeIn delay={0.5} y={8} duration={0.4}>
        <div className="text-center py-4">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            DocStudio v0.1.0 Beta
          </p>
        </div>
      </FadeIn>
    </div>
  );
}
