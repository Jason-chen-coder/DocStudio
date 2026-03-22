'use client';

import { useEffect, useState, useMemo } from 'react';
import { documentService } from '@/services/document-service';
import { DocumentFavorite } from '@/types/document';
import { toast } from 'sonner';
import {
  Star,
  FileText,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { FadeIn } from '@/components/ui/fade-in';
import { getCdnUrl } from '@/lib/cdn';

// ────────────────────── helpers ──────────────────────

function timeAgo(dateStr: string) {
  const now = Date.now();
  const d = new Date(dateStr).getTime();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins} 分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;
  return new Date(dateStr).toLocaleDateString('zh-CN');
}

function formatShortDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const sameYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleDateString('zh-CN', {
    year: sameYear ? undefined : 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

type SortKey = 'title' | 'updatedAt' | 'createdAt';
type SortDir = 'asc' | 'desc';

// ────────────────────── page ──────────────────────

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<DocumentFavorite[]>([]);
  const [loading, setLoading] = useState(true);

  // Table state
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    documentService.getFavorites()
      .then(setFavorites)
      .catch(() => toast.error('加载收藏列表失败'))
      .finally(() => setLoading(false));
  }, []);

  const handleUnfavorite = async (docId: string) => {
    try {
      await documentService.unfavoriteDocument(docId);
      setFavorites((prev) => prev.filter((f) => f.documentId !== docId));
      toast.success('已取消收藏');
    } catch {
      toast.error('取消收藏失败');
    }
  };

  // Sort
  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'title' ? 'asc' : 'desc');
    }
  };

  const sorted = useMemo(() => {
    return [...favorites].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'title') {
        cmp = (a.document.title || '').localeCompare(b.document.title || '', 'zh-CN');
      } else if (sortKey === 'updatedAt') {
        cmp = new Date(a.document.updatedAt).getTime() - new Date(b.document.updatedAt).getTime();
      } else if (sortKey === 'createdAt') {
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [favorites, sortKey, sortDir]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return null;
    return sortDir === 'asc'
      ? <ArrowUp className="w-3 h-3 ml-1 inline" />
      : <ArrowDown className="w-3 h-3 ml-1 inline" />;
  };

  const thBase = 'px-5 py-3.5 text-left text-sm font-medium whitespace-nowrap select-none transition-colors';
  const thSortable = `${thBase} cursor-pointer text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300`;
  const thStatic = `${thBase} text-gray-400 dark:text-gray-500`;

  return (
    <div className="h-full flex flex-col overflow-hidden px-6 py-6">
      {/* Header */}
      <FadeIn delay={0} y={10}>
        <div className="flex items-center gap-4 mb-6 flex-shrink-0">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">我的收藏</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {loading ? '加载中...' : `共 ${favorites.length} 篇收藏文档`}
            </p>
          </div>
        </div>
      </FadeIn>

      {/* Table Card */}
      <FadeIn delay={0.1} y={10} className="flex-1 min-h-0 flex flex-col">
        <div className="flex-1 min-h-0 flex flex-col bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-gray-50 dark:bg-gray-900/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : favorites.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <Star className="w-7 h-7 text-gray-300 dark:text-gray-600" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">还没有收藏文档</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                在文档列表中点击星标即可收藏
              </p>
            </div>
          ) : (
            <>
              {/* Fixed Header */}
              <div className="flex-shrink-0 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <table className="w-full" style={{ tableLayout: 'fixed' }}>
                  <colgroup>
                    <col style={{ width: '40%' }} />
                    <col className="hidden md:table-column" style={{ width: '15%' }} />
                    <col className="hidden sm:table-column" style={{ width: '18%' }} />
                    <col className="hidden lg:table-column" style={{ width: '18%' }} />
                    <col style={{ width: '9%' }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th className={thSortable} onClick={() => toggleSort('title')}>
                        <span className="inline-flex items-center gap-1">
                          名称 <SortIcon col="title" />
                        </span>
                      </th>
                      <th className={`${thStatic} hidden md:table-cell`}>所有者</th>
                      <th className={`${thSortable} hidden sm:table-cell`} onClick={() => toggleSort('updatedAt')}>
                        <span className="inline-flex items-center gap-1">
                          更新时间 <SortIcon col="updatedAt" />
                        </span>
                      </th>
                      <th className={`${thSortable} hidden lg:table-cell`} onClick={() => toggleSort('createdAt')}>
                        <span className="inline-flex items-center gap-1">
                          收藏时间 <SortIcon col="createdAt" />
                        </span>
                      </th>
                      <th className={`${thStatic} text-right pr-5`}>操作</th>
                    </tr>
                  </thead>
                </table>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 min-h-0 overflow-y-auto">
                <table className="w-full" style={{ tableLayout: 'fixed' }}>
                  <colgroup>
                    <col style={{ width: '40%' }} />
                    <col className="hidden md:table-column" style={{ width: '15%' }} />
                    <col className="hidden sm:table-column" style={{ width: '18%' }} />
                    <col className="hidden lg:table-column" style={{ width: '18%' }} />
                    <col style={{ width: '9%' }} />
                  </colgroup>
                  <tbody className="divide-y divide-gray-100/80 dark:divide-gray-800/60">
                    {paginated.map((fav) => {
                      const avatarUrl = getCdnUrl(fav.document.creator?.avatarUrl);
                      return (
                        <tr
                          key={fav.id}
                          className="group hover:bg-amber-50/30 dark:hover:bg-amber-950/10 transition-colors duration-150"
                        >
                          {/* Name */}
                          <td className="px-5 py-3">
                            <Link
                              href={`/spaces/${fav.document.spaceId}/documents/${fav.document.id}`}
                              className="flex items-center gap-3 min-w-0"
                            >
                              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/20 flex items-center justify-center flex-shrink-0 ring-1 ring-amber-200/50 dark:ring-amber-700/30">
                                <FileText className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
                                  {fav.document.title || '无标题文档'}
                                </p>
                                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 sm:hidden truncate">
                                  {fav.document.creator?.name || '未知'} · {timeAgo(fav.document.updatedAt)}
                                </p>
                              </div>
                            </Link>
                          </td>

                          {/* Owner */}
                          <td className="px-5 py-3 hidden md:table-cell">
                            <div className="flex items-center gap-2.5">
                              {avatarUrl ? (
                                <Image
                                  src={avatarUrl}
                                  alt={fav.document.creator?.name || ''}
                                  width={24}
                                  height={24}
                                  unoptimized
                                  className="rounded-full flex-shrink-0 ring-1 ring-gray-200 dark:ring-gray-600"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center flex-shrink-0 ring-1 ring-gray-200/60 dark:ring-gray-600/40">
                                  <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                                    {(fav.document.creator?.name || '?').charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[120px]">
                                {fav.document.creator?.name || '未知'}
                              </span>
                            </div>
                          </td>

                          {/* Updated At */}
                          <td className="px-5 py-3 hidden sm:table-cell">
                            <span className="text-sm text-gray-500 dark:text-gray-400 tabular-nums">
                              {timeAgo(fav.document.updatedAt)}
                            </span>
                          </td>

                          {/* Favorited At */}
                          <td className="px-5 py-3 hidden lg:table-cell">
                            <span className="text-sm text-gray-500 dark:text-gray-400 tabular-nums">
                              {formatShortDate(fav.createdAt)}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <Link
                                href={`/spaces/${fav.document.spaceId}/documents/${fav.document.id}`}
                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-150"
                                title="打开文档"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => handleUnfavorite(fav.documentId)}
                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-amber-400 hover:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-150"
                                title="取消收藏"
                              >
                                <Star className="w-4 h-4 fill-current" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Footer */}
              <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                  <span>共 <span className="font-medium text-gray-700 dark:text-gray-300">{sorted.length}</span> 篇</span>
                  <select
                    value={pageSize}
                    onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                    className="text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors cursor-pointer"
                  >
                    {[10, 20, 50].map((n) => (
                      <option key={n} value={n}>{n} 条/页</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    第 <span className="font-medium text-gray-700 dark:text-gray-300">{safePage}</span> / {totalPages} 页
                  </span>
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={() => setPage(Math.max(1, safePage - 1))}
                      disabled={safePage <= 1}
                      className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setPage(Math.min(totalPages, safePage + 1))}
                      disabled={safePage >= totalPages}
                      className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </FadeIn>
    </div>
  );
}
