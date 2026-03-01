'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Space } from '@/types/space';
import { publicService } from '@/services/public-service';
import { Search, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import Image from 'next/image';
import { getCdnUrl } from '@/lib/cdn';
import { PublicHeader } from '@/components/layout/public-header';

export default function ExplorePage() {
    const [spaces, setSpaces] = useState<Space[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        const fetchSpaces = async () => {
            setLoading(true);
            try {
                const result = await publicService.getPublicSpaces(page, 12, search);
                setSpaces(result.data);
                setTotalPages(result.totalPages);
            } catch (error) {
                console.error('Failed to fetch public spaces:', error);
            } finally {
                setLoading(false);
            }
        };

        // debounce search
        const timer = setTimeout(() => {
            fetchSpaces();
        }, 300);

        return () => clearTimeout(timer);
    }, [page, search]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
            <PublicHeader />

            {/* Rich Header Section */}
            <div className="relative overflow-hidden bg-white dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800">
                {/* Decorative Background Elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[150%] bg-gradient-to-tr from-blue-100/40 to-indigo-50/10 dark:from-blue-900/20 dark:to-indigo-900/10 -rotate-12 blur-3xl rounded-full" />
                    <div className="absolute top-[10%] -right-[5%] w-[40%] h-[120%] bg-gradient-to-bl from-purple-100/40 to-pink-50/10 dark:from-purple-900/20 dark:to-pink-900/10 rotate-12 blur-3xl rounded-full" />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium mb-6 border border-blue-100 dark:border-blue-800/50 shadow-sm"
                    >
                        <Sparkles className="h-4 w-4" />
                        <span>探索无界知识宇宙</span>
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight"
                    >
                        探索<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">公开知识库</span>
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed"
                    >
                        发现其他人分享的优秀文档、团队沉淀和个人思考。<br className="hidden md:block" />在知识的海洋中获取灵感，找到你需要的每一份价值。
                    </motion.p>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
                {/* Floating Search Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="relative max-w-3xl mx-auto mb-16 -mt-8 z-20 px-4 sm:px-0"
                >
                    <div className="relative shadow-xl shadow-blue-900/5 dark:shadow-black/20 rounded-2xl bg-white dark:bg-gray-800 p-2 border border-white/20 dark:border-gray-700 backdrop-blur-xl">
                        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                            <Search className="h-6 w-6 text-blue-500/70 dark:text-blue-400/70" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-14 pr-4 py-4 border-none rounded-xl bg-gray-50/50 dark:bg-gray-900/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 sm:text-lg transition"
                            placeholder="搜索公开工作空间..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1); // Reset page on new search
                            }}
                        />
                    </div>
                </motion.div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3,].map((i) => (
                            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
                                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mb-6"></div>
                                <div className="flex justify-between items-center mt-4">
                                    <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : spaces.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {spaces.map((space) => {
                                const avatarUrl = getCdnUrl(space.owner?.avatarUrl);
                                return (
                                    <Link key={space.id} href={`/public/spaces/${space.id}`} className="group block">
                                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 h-full flex flex-col hover:shadow-md hover:border-blue-400 transition cursor-pointer">
                                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                                {space.name}
                                            </h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 flex-grow line-clamp-3">
                                                {space.description || '暂无描述'}
                                            </p>
                                            <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100 dark:border-gray-700">
                                                <div className="flex items-center gap-2">
                                                    {avatarUrl ? (
                                                        <Image src={avatarUrl} alt={space.owner?.name || 'User'} width={24} height={24} className="rounded-full" unoptimized />
                                                    ) : (
                                                        <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">
                                                            {space.owner?.name?.[0]?.toUpperCase() || 'U'}
                                                        </div>
                                                    )}
                                                    <span className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[100px]">{space.owner?.name}</span>
                                                </div>
                                                <div className="text-xs text-gray-400 dark:text-gray-500">
                                                    {formatDistanceToNow(new Date(space.updatedAt), { addSuffix: true, locale: zhCN })}
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>

                        {/* Pagination controls could go here if totalPages > 1 */}
                        {totalPages > 1 && (
                            <div className="mt-12 flex justify-center gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-4 py-2 border rounded-md disabled:opacity-50"
                                >上一页</button>
                                <span className="px-4 py-2 flex items-center">
                                    {page} / {totalPages}
                                </span>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="px-4 py-2 border rounded-md disabled:opacity-50"
                                >下一页</button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">没有找到公开工作空间</h3>
                        <p className="text-gray-500 dark:text-gray-400">尝试更换搜索词，或者成为第一个创建公开知识库的人吧！</p>
                    </div>
                )}
            </main>
        </div>
    );
}
