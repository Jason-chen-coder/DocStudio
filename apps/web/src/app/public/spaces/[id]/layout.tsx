'use client';

import { ReactNode, useEffect, useState, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Space } from '@/types/space';
import { Document } from '@/types/document';
import { publicService } from '@/services/public-service';
import { ChevronRight, FileText, ChevronLeft, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { getCdnUrl } from '@/lib/cdn';

export default function PublicSpaceLayout({
    children,
    params,
}: {
    children: ReactNode;
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const [space, setSpace] = useState<Space | null>(null);
    const [docs, setDocs] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const pathname = usePathname();

    const avatarUrl = getCdnUrl(space?.owner?.avatarUrl);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [spaceData, docsData] = await Promise.all([
                    publicService.getPublicSpace(id),
                    publicService.getPublicSpaceDocumentTree(id),
                ]);
                setSpace(spaceData);
                setDocs(docsData);
            } catch (error) {
                console.error('Failed to load public space', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-lg mb-4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-32"></div>
                </div>
            </div>
        );
    }

    if (!space) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">工作空间不存在或未公开</h2>
                    <Link href="/explore" className="text-blue-600 hover:underline">返回探索页</Link>
                </div>
            </div>
        );
    }

    // 渲染只读文档树
    const renderTree = (parentId: string | null = null, depth = 0) => {
        const childrenDocs = docs.filter(d => d.parentId === parentId).sort((a, b) => a.order - b.order);

        if (childrenDocs.length === 0) return null;

        return (
            <ul className={cn("space-y-0.5", depth > 0 && "ml-4 border-l border-gray-100 dark:border-gray-800 pl-2")}>
                {childrenDocs.map(doc => {
                    const isCurrent = pathname === `/public/spaces/${space.id}/documents/${doc.id}`;
                    return (
                        <li key={doc.id}>
                            <Link
                                href={`/public/spaces/${space.id}/documents/${doc.id}`}
                                className={cn(
                                    "flex items-center py-1.5 px-2 text-sm rounded-md transition-colors",
                                    isCurrent
                                        ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium"
                                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                                )}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <FileText className="w-4 h-4 mr-2 opacity-70 flex-shrink-0" />
                                <span className="truncate">{doc.title}</span>
                            </Link>
                            {renderTree(doc.id, depth + 1)}
                        </li>
                    );
                })}
            </ul>
        );
    };

    return (
        <div className="h-screen flex flex-col bg-white dark:bg-gray-900">
            {/* 顶部导航 */}
            <header className="h-14 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 sm:px-6 bg-white dark:bg-gray-900 z-20 flex-shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        className="md:hidden p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    <Link href="/explore" className="flex items-center text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-200">
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        探索
                    </Link>
                    {/* <div className="hidden sm:flex items-center text-sm text-gray-400">
                        <ChevronRight className="w-4 h-4 mx-1" />
                        <span className="font-medium text-gray-900 dark:text-gray-100">{space.name}</span>
                    </div> */}
                </div>

                <div className="flex items-center gap-3">
                    <Link href="/" className="flex items-center gap-2">
                        <Image src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/docStudio_icon.png`} alt="DocStudio" width={24} height={24} />
                        <span className="font-semibold text-gray-900 dark:text-white hidden sm:inline-block">DocStudio</span>
                    </Link>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden relative">
                {/* 遮罩（移动端侧边栏打开时） */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-20 md:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* 侧边栏文档树 */}
                <aside className={cn(
                    "absolute inset-y-0 left-0 z-30 w-72 bg-gray-50 dark:bg-gray-900/50 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-200 ease-in-out md:relative md:transform-none flex flex-col flex-shrink-0",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
                )}>
                    <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                        <h2 className="font-semibold text-gray-900 dark:text-white truncate">{space.name}</h2>
                        {space.description && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{space.description}</p>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                            文档
                        </div>
                        {docs.length > 0 ? (
                            renderTree(null)
                        ) : (
                            <div className="text-sm text-gray-400">暂无文档</div>
                        )}
                    </div>

                    {/* 底部用户信息 */}
                    <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex-shrink-0">
                        <div className="flex items-center gap-2">
                            {avatarUrl ? (
                                <Image src={avatarUrl} alt={space.owner?.name || 'User'} width={24} height={24} className="rounded-full" unoptimized />
                            ) : (
                                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[11px] text-blue-600 font-bold">
                                    {space.owner?.name?.[0]?.toUpperCase()}
                                </div>
                            )}
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{space.owner?.name}</span>
                        </div>
                    </div>
                </aside>

                {/* 主内容区 */}
                <main className="flex-1 overflow-y-auto bg-white dark:bg-gray-900 relative">
                    {children}
                </main>
            </div>
        </div>
    );
}
