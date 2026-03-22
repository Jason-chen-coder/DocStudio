'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import { ChevronLeft, Sun, Moon, Monitor, Check, Globe, Type } from 'lucide-react';
import { useTheme, ThemeMode } from '@/hooks/use-theme';
import { FadeIn } from '@/components/ui/fade-in';
import { cn } from '@/lib/utils';

const themeOptions: {
  value: ThemeMode;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: 'light', label: '浅色', icon: Sun },
  { value: 'dark', label: '深色', icon: Moon },
  { value: 'system', label: '跟随系统', icon: Monitor },
];

export default function AppearanceSettingsPage() {
  const { mode, setThemeMode, mounted } = useTheme();

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4" />
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
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
            外观
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            自定义主题、语言与显示偏好
          </p>
        </div>
      </FadeIn>

      {/* ── 主题模式 ── */}
      <FadeIn delay={0.1} y={16} duration={0.4}>
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <div className="px-4 py-4 sm:px-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              主题模式
            </h3>
          </div>

          <div className="p-4 sm:p-6">
            <div className="flex gap-3 max-w-lg">
              {themeOptions.map((option) => {
                const isActive = mode === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => setThemeMode(option.value)}
                    className={cn(
                      'relative flex flex-col items-center gap-2 px-3 py-3 rounded-lg border-2 transition-all duration-200 cursor-pointer flex-1',
                      isActive
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-500/5'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/30',
                    )}
                  >
                    {/* 紧凑预览 */}
                    <div
                      className={cn(
                        'w-full aspect-[16/10] rounded overflow-hidden border',
                        isActive
                          ? 'border-blue-200 dark:border-blue-800'
                          : 'border-gray-200 dark:border-gray-600',
                      )}
                    >
                      {option.value === 'light' && (
                        <div className="w-full h-full bg-white flex flex-col">
                          <div className="h-1.5 bg-gray-100 border-b border-gray-200" />
                          <div className="flex flex-1">
                            <div className="w-1/4 bg-gray-50 border-r border-gray-100" />
                            <div className="flex-1 p-1 space-y-0.5">
                              <div className="h-1 w-3/4 bg-gray-200 rounded-sm" />
                              <div className="h-0.5 w-full bg-gray-100 rounded-sm" />
                            </div>
                          </div>
                        </div>
                      )}
                      {option.value === 'dark' && (
                        <div className="w-full h-full bg-gray-900 flex flex-col">
                          <div className="h-1.5 bg-gray-800 border-b border-gray-700" />
                          <div className="flex flex-1">
                            <div className="w-1/4 bg-gray-800 border-r border-gray-700" />
                            <div className="flex-1 p-1 space-y-0.5">
                              <div className="h-1 w-3/4 bg-gray-700 rounded-sm" />
                              <div className="h-0.5 w-full bg-gray-800 rounded-sm" />
                            </div>
                          </div>
                        </div>
                      )}
                      {option.value === 'system' && (
                        <div className="w-full h-full flex">
                          <div className="w-1/2 bg-white flex flex-col">
                            <div className="h-1.5 bg-gray-100 border-b border-gray-200" />
                            <div className="flex-1 p-0.5 space-y-0.5">
                              <div className="h-0.5 w-3/4 bg-gray-200 rounded-sm" />
                            </div>
                          </div>
                          <div className="w-1/2 bg-gray-900 flex flex-col">
                            <div className="h-1.5 bg-gray-800 border-b border-gray-700" />
                            <div className="flex-1 p-0.5 space-y-0.5">
                              <div className="h-0.5 w-3/4 bg-gray-700 rounded-sm" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 标签 */}
                    <span
                      className={cn(
                        'text-xs font-medium',
                        isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400',
                      )}
                    >
                      {option.label}
                    </span>

                    {isActive && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center ring-2 ring-white dark:ring-gray-800">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
              选择「跟随系统」后，主题将自动跟随操作系统设置切换。
            </p>
          </div>
        </div>
      </FadeIn>

      {/* ── 语言 ── */}
      <FadeIn delay={0.2} y={16} duration={0.4}>
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <div className="px-4 py-4 sm:px-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              语言
            </h3>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700/60">
            <button
              onClick={() => toast('敬请期待', { description: '多语言支持正在开发中' })}
              className="flex items-center gap-4 px-4 py-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group w-full text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-sky-50 dark:bg-sky-500/10 flex items-center justify-center flex-shrink-0">
                <Globe className="w-[18px] h-[18px] text-sky-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    界面语言
                  </p>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                    即将推出
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  当前：简体中文
                </p>
              </div>
            </button>
          </div>
        </div>
      </FadeIn>

      {/* ── 字体与排版 ── */}
      <FadeIn delay={0.3} y={16} duration={0.4}>
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <div className="px-4 py-4 sm:px-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              编辑器
            </h3>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700/60">
            <button
              onClick={() => toast('敬请期待', { description: '编辑器字体设置正在开发中' })}
              className="flex items-center gap-4 px-4 py-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group w-full text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                <Type className="w-[18px] h-[18px] text-orange-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    字体与排版
                  </p>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                    即将推出
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  编辑器字体、字号和行间距偏好
                </p>
              </div>
            </button>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
