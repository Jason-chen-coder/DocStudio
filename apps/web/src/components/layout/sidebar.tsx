'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { spaceService } from '@/services/space-service';
import { Space } from '@/types/space';
import { ChevronLeft, Plus, LayoutDashboard, FolderOpen, Users } from 'lucide-react';
import { DocumentTree } from '@/components/document/document-tree';
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
  ];

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-shrink-0 flex flex-col h-full">
      <div className="h-16 flex items-center gap-3 px-6 border-b border-gray-200 dark:border-gray-700">
        <Image
          src="/docStudio_icon.png"
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
              className="absolute inset-0 p-4 space-y-6 overflow-y-auto bg-white dark:bg-gray-800"
            >
              <div className="space-y-4">
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
                <div className="flex items-center gap-2.5 px-3 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/15 dark:to-indigo-900/15 rounded-xl border border-blue-100/60 dark:border-blue-800/30">
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
                </div>

                {/* Section label */}
                <div className="flex items-center gap-2 px-1">
                  <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">文档</span>
                  <div className="flex-1 h-px bg-gray-100 dark:bg-gray-700" />
                </div>

                {/* Document tree */}
                <DocumentTree spaceId={spaceId} />
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
                        ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                    >
                      <Users className="w-4 h-4" />
                      用户管理
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
