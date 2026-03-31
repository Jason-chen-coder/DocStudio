'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { spaceService } from '@/services/space-service';
import { Space } from '@/types/space';
import { ChevronLeft, Plus, LayoutDashboard, FolderOpen, Users, Trash2, Star, Bot, Crown, Sparkles } from 'lucide-react';
import { DocumentTree } from '@/components/document/document-tree';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { useDocuments } from '@/hooks/use-documents';
import { motion, AnimatePresence } from 'framer-motion';
import { TemplatePickerModal } from '@/components/template/template-picker-modal';

export function Sidebar() {
  const pathname = usePathname();
  const params = useParams();
  const spaceId = params?.id as string;
  const { user } = useAuth();

  const [spaces, setSpaces] = useState<Space[]>([]);

  async function loadSpaces() {
    try {
      const data = await spaceService.getMySpaces();
      setSpaces(data);
    } catch (error) {
      console.error('Failed to load spaces in sidebar', error);
    }
  }

  useEffect(() => {
    const init = async () => {
      await loadSpaces();
    };
    init();

    window.addEventListener('workspace-updated', loadSpaces);
    return () => {
      window.removeEventListener('workspace-updated', loadSpaces);
    };
  }, []);

  const currentSpace = useMemo(() =>
    spaces.find(s => s.id === spaceId),
    [spaces, spaceId]
  );

  const router = useRouter();
  const { createDocument } = useDocuments(spaceId);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);

  const handleCreate = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setShowTemplatePicker(true);
  };

  const handleTemplateSelect = async (data: { title: string; content: string }) => {
    setShowTemplatePicker(false);
    try {
      const newDoc = await createDocument({ title: data.title, content: data.content, spaceId });
      window.dispatchEvent(new Event('document-updated'));
      router.push(`/spaces/${spaceId}/documents/${newDoc.id}`);
    } catch {
      // toast handled in hook
    }
  };

  const handleSkipTemplate = async () => {
    setShowTemplatePicker(false);
    try {
      const newDoc = await createDocument({ title: '无标题文档', spaceId });
      window.dispatchEvent(new Event('document-updated'));
      router.push(`/spaces/${spaceId}/documents/${newDoc.id}`);
    } catch {
      // toast handled in hook
    }
  };


  const mainLinks = [
    { href: '/dashboard', label: '仪表盘', Icon: LayoutDashboard },
    { href: '/spaces', label: '工作空间', Icon: FolderOpen },
    { href: '/favorites', label: '我的收藏', Icon: Star },
    { href: '/subscription', label: 'AI 订阅', Icon: Sparkles },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-shrink-0 flex flex-col h-full">
      <div className="h-16 flex items-center gap-3 px-6 border-b border-gray-200 dark:border-gray-700">
        <Image
          src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/docStudio_icon.png`}
          alt="DocStudio"
          width={32}
          height={32}
        />
        <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">DocStudio</h1>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence initial={false} mode="popLayout">
          {spaceId ? (
            <motion.nav
              key="space-menu"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3, ease: 'easeInOut' }}
              className="absolute inset-0 flex flex-col bg-white dark:bg-gray-800"
            >
              {/* 顶部固定区域：返回 + 空间信息 + 文档标签 */}
              <div className="flex-shrink-0 p-4 pb-0 space-y-4">
                {/* Space header */}
                <div className="flex items-center justify-between">
                  <Link
                    href="/spaces"
                    className="flex items-center gap-1 text-[13px] font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    返回
                  </Link>
                  <button
                    onClick={() => handleCreate()}
                    className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors"
                    title="新建文档"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Space name badge */}
                <Link
                  href={`/spaces/${spaceId}`}
                  className="flex items-center gap-2.5 px-3 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/15 dark:to-indigo-900/15 rounded-xl border border-blue-100/60 dark:border-blue-800/30 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/25 dark:hover:to-indigo-900/25 transition-all"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {currentSpace?.name?.charAt(0) || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {currentSpace?.name || '加载中...'}
                    </p>
                    {currentSpace?.description && (
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                        {currentSpace.description}
                      </p>
                    )}
                  </div>
                </Link>

                {/* Section label */}
                <div className="flex items-center gap-2 px-1">
                  <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">文档</span>
                  <div className="flex-1 h-px bg-gray-100 dark:bg-gray-700" />
                </div>
              </div>

              {/* 文档树 — 占满剩余空间，独立滚动 */}
              <div className="flex-1 min-h-0 overflow-y-auto px-4 py-2">
                <DocumentTree spaceId={spaceId} />
              </div>

              {/* 回收站 — 固定在底部 */}
              <div className="flex-shrink-0 px-4 py-3 border-t border-gray-100 dark:border-gray-700/50">
                <Link
                  href={`/spaces/${spaceId}/trash`}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors',
                    pathname === `/spaces/${spaceId}/trash`
                      ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700/50 dark:hover:text-gray-300'
                  )}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  回收站
                </Link>
              </div>
            </motion.nav>
          ) : (
            <motion.nav
              key="main-menu"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3, ease: 'easeInOut' }}
              className="absolute inset-0 p-4 space-y-6 overflow-y-auto bg-white dark:bg-gray-800"
            >
              {/* Main Navigation */}
              <div className="space-y-1">
                {mainLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                    >
                      <link.Icon className="w-4 h-4" />
                      {link.label}
                    </Link>
                  );
                })}
              </div>

              {/* 管理控制台（仅超管可见） */}
              {user?.isSuperAdmin && (
                <div>
                  <div className="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    管理控制台
                  </div>
                  <div className="space-y-1 ml-3">
                    <Link
                      href="/admin/users"
                      className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${pathname.startsWith('/admin/users')
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                    >
                      <Users className="w-4 h-4" />
                      用户管理
                    </Link>
                    <Link
                      href="/admin/ai-settings"
                      className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${pathname.startsWith('/admin/ai-settings')
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                    >
                      <Bot className="w-4 h-4" />
                      AI 设置
                    </Link>
                    <Link
                      href="/admin/ai-subscriptions"
                      className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${pathname.startsWith('/admin/ai-subscriptions')
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                    >
                      <Crown className="w-4 h-4" />
                      AI 订阅管理
                    </Link>
                  </div>
                </div>
              )}
            </motion.nav>
          )}
        </AnimatePresence>
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-center text-gray-400">
          v0.1.0 Beta
        </div>
      </div>

      {spaceId && (
        <TemplatePickerModal
          open={showTemplatePicker}
          onOpenChange={setShowTemplatePicker}
          spaceId={spaceId}
          onSelect={handleTemplateSelect}
          onSkip={handleSkipTemplate}
        />
      )}
    </aside>
  );

}
