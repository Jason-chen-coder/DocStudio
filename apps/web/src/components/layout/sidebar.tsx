'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { spaceService } from '@/services/space-service';
import { Space } from '@/types/space';
import { ChevronLeft, Plus, Shield } from 'lucide-react';
import { DocumentTree } from '@/components/document/document-tree';
import { useAuth } from '@/lib/auth-context';
import { useDocuments } from '@/hooks/use-documents';
import { motion, AnimatePresence } from 'framer-motion';

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

  const handleCreate = async (parentId?: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const newDoc = await createDocument({ title: '无标题文档', spaceId, parentId });
      // 通知 DocumentTree 里的 useDocuments 实例刷新列表
      window.dispatchEvent(new Event('document-updated'));
      router.push(`/spaces/${spaceId}/documents/${newDoc.id}`);
    } catch {
      // toast handled in hook
    }
  };


  const mainLinks = [
    { href: '/dashboard', label: '仪表盘', icon: '📊' },
    { href: '/spaces', label: '工作空间', icon: '🗂️' },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-shrink-0 flex flex-col h-full">
      <div className="h-16 flex items-center gap-3 px-6 border-b border-gray-200 dark:border-gray-700">
        <Image
          src="/docStudio_icon.png"
          alt="DocStudio"
          width={32}
          height={32}
          className="rounded-lg"
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
              <div>
                <div className='flex flex-row justify-between'>
                  <Link
                    href="/spaces"
                    className="flex items-center text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    {/* 返回 */}
                    {currentSpace?.name || '加载中...'}
                  </Link>
                  <button
                    onClick={() => handleCreate()}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition"
                    title="新建文档"
                  >
                    <Plus className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
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
                      className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                    >
                      <span className="mr-3">{link.icon}</span>
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
                      className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${pathname.startsWith('/admin/users')
                        ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                    >
                      <span className="mr-3">👥</span>
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
    </aside>
  );

}
