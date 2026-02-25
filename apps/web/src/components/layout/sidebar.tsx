'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { spaceService } from '@/services/space-service';
import { Space } from '@/types/space';
import { ChevronLeft, Shield } from 'lucide-react';
import { DocumentTree } from '@/components/document/document-tree';
import { useAuth } from '@/lib/auth-context';

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

  const mainLinks = [
    { href: '/dashboard', label: '仪表盘', icon: '📊' },
    { href: '/spaces', label: '所有空间', icon: '🗂️' },
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

      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        {/* If inside a space, show Space context */}
        {spaceId ? (
            <div className="space-y-4">
                <Link 
                    href="/spaces" 
                    className="flex items-center text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    返回空间列表
                </Link>
                
                <div className="px-2">
                    <h2 className="font-bold text-gray-900 dark:text-white truncate" title={currentSpace?.name}>
                        {currentSpace?.name || '加载中...'}
                    </h2>
                </div>

                <DocumentTree spaceId={spaceId} />
            </div>
        ) : (
            <>
                {/* Main Navigation */}
                <div className="space-y-1">
                {mainLinks.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
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

                {/* Workspaces List */}
                <div>
                <div className="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    我的工作空间
                </div>
                <div className="space-y-1">
                    {spaces.length === 0 ? (
                        <div className="px-4 text-sm text-gray-400">暂无空间</div>
                    ) : (
                        spaces.map((space) => {
                        return (
                            <Link
                            key={space.id}
                            href={`/spaces/${space.id}`}
                            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700`}
                            >
                            <span className="mr-3">📦</span>
                            <span className="truncate">{space.name}</span>
                            </Link>
                        );
                        })
                    )}
                </div>
                </div>

                {/* 管理控制台（仅超管可见） */}
                {user?.isSuperAdmin && (
                  <div>
                    <div className="px-4 mb-2 text-sm font-semibold text-purple-500 uppercase tracking-wider flex items-center gap-1">
                      <Shield className="w-4 h-4" /> 管理控制台
                    </div>
                    <div className="space-y-1 ml-3">
                      <Link
                        href="/admin/users"
                        className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          pathname.startsWith('/admin/users')
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
            </>
        )}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-center text-gray-400">
          v0.1.0 Beta
        </div>
      </div>
    </aside>
  );
}
