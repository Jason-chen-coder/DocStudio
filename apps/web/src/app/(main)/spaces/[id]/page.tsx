'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter, useParams } from 'next/navigation';
import { spaceService } from '@/services/space-service';
import { Space } from '@/types/space';
import Link from 'next/link';
import Image from 'next/image';
import { useDocuments } from '@/hooks/use-documents';
import { getCdnUrl } from '@/lib/cdn';
import {
  FileText,
  Plus,
  Users,
  Settings,
  Activity,
  LayoutTemplate,
  Globe,
  Lock,
  ArrowUp,
  ArrowDown,
  FolderOpen,
  ExternalLink,
  Trash2,
  Star,
  ChevronLeft,
  ChevronRight,
  Upload,
  BarChart3,
} from 'lucide-react';
import { documentService } from '@/services/document-service';
import { toast } from 'sonner';
import { TemplatePickerModal } from '@/components/template/template-picker-modal';
import { ImportDocumentDialog } from '@/components/document/import-document-dialog';
import { FadeIn } from '@/components/ui/fade-in';
import type { Document } from '@/types/document';

// ────────────────────── helpers ──────────────────────

type SortKey = 'title' | 'updatedAt' | 'createdAt';
type SortDir = 'asc' | 'desc';

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

function timeAgo(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const min = Math.floor(diff / 60000);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  if (min < 1) return '刚刚';
  if (min < 60) return `${min} 分钟前`;
  if (hr < 24) return `${hr} 小时前`;
  if (day < 30) return `${day} 天前`;
  return d.toLocaleDateString('zh-CN');
}

// ────────────────────── Document Table ──────────────────────

function DocumentTable({
  documents,
  spaceId,
  currentUserId,
  onDelete,
}: {
  documents: Document[];
  spaceId: string;
  currentUserId?: string;
  onDelete?: (id: string) => void;
}) {
  const [sortKey, setSortKey] = useState<SortKey>('updatedAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Load favorites on mount
  useEffect(() => {
    documentService.getFavorites().then((favs) => {
      setFavoriteIds(new Set(favs.map((f) => f.documentId)));
    }).catch(console.error);
  }, []);

  const toggleFavorite = async (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const isFav = favoriteIds.has(docId);
    // Optimistic update
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (isFav) next.delete(docId);
      else next.add(docId);
      return next;
    });
    try {
      if (isFav) {
        await documentService.unfavoriteDocument(docId);
      } else {
        await documentService.favoriteDocument(docId);
        toast.success('已收藏');
      }
    } catch {
      // Revert on error
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (isFav) next.add(docId);
        else next.delete(docId);
        return next;
      });
      toast.error(isFav ? '取消收藏失败' : '收藏失败');
    }
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir(key === 'title' ? 'asc' : 'desc');
    }
  };

  const sorted = useMemo(() => {
    return [...documents].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'title') {
        cmp = (a.title || '').localeCompare(b.title || '', 'zh-CN');
      } else if (sortKey === 'updatedAt') {
        cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      } else if (sortKey === 'createdAt') {
        cmp = new Date(a.createdAt || a.updatedAt).getTime() - new Date(b.createdAt || b.updatedAt).getTime();
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [documents, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  // 当数据变化后如果当前页越界，自动回到第一页
  const safePage = Math.min(page, totalPages);
  const paginatedDocs = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return null;
    return sortDir === 'asc'
      ? <ArrowUp className="w-3 h-3 ml-1 inline" />
      : <ArrowDown className="w-3 h-3 ml-1 inline" />;
  };

  const thBase = "px-5 py-3.5 text-left text-sm font-medium whitespace-nowrap select-none transition-colors";
  const thSortable = `${thBase} cursor-pointer text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300`;
  const thStatic = `${thBase} text-gray-400 dark:text-gray-500`;

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      {/* ─── Fixed Header ─── */}
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
              <th className={`${thStatic} hidden md:table-cell`}>
                所有者
              </th>
              <th
                className={`${thSortable} hidden sm:table-cell`}
                onClick={() => toggleSort('updatedAt')}
              >
                <span className="inline-flex items-center gap-1">
                  更新时间 <SortIcon col="updatedAt" />
                </span>
              </th>
              <th
                className={`${thSortable} hidden lg:table-cell`}
                onClick={() => toggleSort('createdAt')}
              >
                <span className="inline-flex items-center gap-1">
                  创建时间 <SortIcon col="createdAt" />
                </span>
              </th>
              <th className={`${thStatic} text-right pr-5`}>
                操作
              </th>
            </tr>
          </thead>
        </table>
      </div>

      {/* ─── Scrollable Body ─── */}
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
            {paginatedDocs.map((doc) => {
              const avatarUrl = getCdnUrl(doc.creator?.avatarUrl);
              const isOwner = doc.creator?.id === currentUserId;
              const isFav = favoriteIds.has(doc.id);
              return (
                <tr
                  key={doc.id}
                  className="group hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors duration-150"
                >
                  {/* ── Name ── */}
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Favorite star */}
                      <button
                        onClick={(e) => toggleFavorite(doc.id, e)}
                        className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md transition-all duration-150 hover:scale-110 active:scale-95"
                        title={isFav ? '取消收藏' : '收藏'}
                      >
                        <Star className={`w-3.5 h-3.5 transition-all duration-200 ${
                          isFav
                            ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_3px_rgba(251,191,36,0.4)]'
                            : 'text-gray-300 dark:text-gray-600 group-hover:text-gray-400 dark:group-hover:text-gray-500 hover:!text-amber-400'
                        }`} />
                      </button>

                      {/* Doc icon + title */}
                      <Link
                        href={`/spaces/${spaceId}/documents/${doc.id}`}
                        className="flex items-center gap-3 min-w-0 flex-1"
                      >
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 flex items-center justify-center flex-shrink-0
                          ring-1 ring-blue-200/50 dark:ring-blue-700/30
                          group-hover:from-blue-100 group-hover:to-blue-150 dark:group-hover:from-blue-900/40 dark:group-hover:to-blue-800/30 group-hover:ring-blue-300/60 dark:group-hover:ring-blue-600/40
                          transition-all duration-200">
                          <FileText className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate
                            group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                            {doc.title || '无标题文档'}
                          </p>
                          {/* 移动端：所有者 + 更新时间 显示在标题下方 */}
                          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 sm:hidden truncate">
                            {isOwner ? '我' : (doc.creator?.name || '未知')} · {timeAgo(doc.updatedAt)}
                          </p>
                        </div>
                      </Link>
                    </div>
                  </td>

                  {/* ── Owner ── */}
                  <td className="px-5 py-3 hidden md:table-cell">
                    <div className="flex items-center gap-2.5">
                      {avatarUrl ? (
                        <Image
                          src={avatarUrl}
                          alt={doc.creator?.name || ''}
                          width={24}
                          height={24}
                          unoptimized
                          className="rounded-full flex-shrink-0 ring-1 ring-gray-200 dark:ring-gray-600"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center flex-shrink-0 ring-1 ring-gray-200/60 dark:ring-gray-600/40">
                          <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                            {(doc.creator?.name || '?').charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[120px]">
                        {isOwner ? '我' : (doc.creator?.name || '未知')}
                      </span>
                    </div>
                  </td>

                  {/* ── Updated At ── */}
                  <td className="px-5 py-3 hidden sm:table-cell">
                    <span className="text-sm text-gray-500 dark:text-gray-400 tabular-nums">
                      {timeAgo(doc.updatedAt)}
                    </span>
                  </td>

                  {/* ── Created At ── */}
                  <td className="px-5 py-3 hidden lg:table-cell">
                    <span className="text-sm text-gray-500 dark:text-gray-400 tabular-nums">
                      {formatShortDate(doc.createdAt || doc.updatedAt)}
                    </span>
                  </td>

                  {/* ── Actions ── */}
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/spaces/${spaceId}/documents/${doc.id}`}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg
                          text-gray-400 hover:text-blue-600 dark:hover:text-blue-400
                          hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-150"
                        title="打开文档"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                      {onDelete && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onDelete(doc.id); }}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg
                            text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400
                            hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-150
                            opacity-0 group-hover:opacity-100"
                          title="移至回收站"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ─── Pagination Footer ─── */}
      {sorted.length > 0 && (
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
          {/* Left: total count + page size */}
          <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
            <span>共 <span className="font-medium text-gray-700 dark:text-gray-300">{sorted.length}</span> 篇文档</span>
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

          {/* Right: page navigation */}
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
      )}
    </div>
  );
}

// ────────────────────── page ──────────────────────

export default function SpaceDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [space, setSpace] = useState<Space | null>(null);
  const [spaceLoading, setSpaceLoading] = useState(true);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);

  const { documents, loading: docsLoading, createDocument, deleteDocument } = useDocuments(id);

  useEffect(() => {
    async function loadSpace() {
      try {
        setSpaceLoading(true);
        const data = await spaceService.getSpace(id);
        setSpace(data);
      } catch (error) {
        console.error('Failed to load space', error);
      } finally {
        setSpaceLoading(false);
      }
    }
    if (user && id) loadSpace();
  }, [user, id]);

  const handleCreate = () => setShowTemplatePicker(true);

  const handleTemplateSelect = async (data: { title: string; content: string }) => {
    try {
      const newDoc = await createDocument({ title: data.title, content: data.content, spaceId: id });
      window.dispatchEvent(new Event('document-updated'));
      router.push(`/spaces/${id}/documents/${newDoc.id}`);
    } catch { /* toast in hook */ }
  };

  const handleSkipTemplate = async () => {
    try {
      const newDoc = await createDocument({ title: '无标题文档', spaceId: id });
      window.dispatchEvent(new Event('document-updated'));
      router.push(`/spaces/${id}/documents/${newDoc.id}`);
    } catch { /* toast in hook */ }
  };

  // ─── loading skeleton ───
  if (spaceLoading) {
    return (
      <div className="h-full flex flex-col overflow-hidden animate-pulse">
        {/* Skeleton header card */}
        <div className="flex-shrink-0 mb-5">
          <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="h-9 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg" />
              <div className="h-6 w-16 bg-blue-50 dark:bg-blue-900/20 rounded-full" />
              <div className="h-6 w-16 bg-violet-50 dark:bg-violet-900/20 rounded-full" />
            </div>
            <div className="h-4 w-72 bg-gray-100 dark:bg-gray-700/50 rounded mt-3" />
            <div className="flex items-center gap-6 mt-5 pt-4 border-t border-gray-100 dark:border-gray-700/50">
              <div className="h-7 w-24 bg-gray-100 dark:bg-gray-700/50 rounded-lg" />
              <div className="h-7 w-24 bg-gray-100 dark:bg-gray-700/50 rounded-lg" />
            </div>
          </div>
        </div>
        {/* Skeleton table */}
        <div className="flex-1 min-h-0 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="h-11 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800" />
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5, 6, 7].map(i => (
              <div key={i} className="h-12 bg-gray-50 dark:bg-gray-900/30 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!space) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400">
        <FolderOpen className="w-14 h-14 mb-4 opacity-40" />
        <p className="text-base">空间不存在或无权访问</p>
      </div>
    );
  }

  const isAdmin = space.myRole === 'OWNER' || space.myRole === 'ADMIN';
  const hasDocuments = documents.length > 0;
  const docCount = space._count?.documents ?? documents.length;
  const memberCount = space._count?.permissions ?? 0;

  return (
    <div className="h-full flex flex-col overflow-hidden">

      {/* ═══════ Space Header ═══════ */}
      <FadeIn delay={0} y={10}>
      <div className="flex-shrink-0 mb-5">
        <div className="rounded-2xl bg-gradient-to-br from-white to-gray-50/80 dark:from-gray-800 dark:to-gray-800/80 border border-gray-200 dark:border-gray-700 px-8 py-6">
          {/* Row 1: Title + Tags + Create Button */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                  {space.name}
                </h1>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-full">
                    {space.isPublic ? <><Globe className="w-3.5 h-3.5" /> 公开</> : <><Lock className="w-3.5 h-3.5" /> 私有</>}
                  </span>
                  {space.myRole && (
                    <span className="text-xs font-medium bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 px-2.5 py-1 rounded-full">
                      {space.myRole === 'OWNER' ? '所有者' : space.myRole === 'ADMIN' ? '管理员' : space.myRole === 'EDITOR' ? '编辑者' : '查看者'}
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              {space.description && (
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-2 max-w-2xl leading-relaxed">
                  {space.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setShowImportDialog(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                title="导入文档"
              >
                <Upload className="w-4 h-4" />
                导入
              </button>
              <button
                onClick={handleCreate}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                新建文档
              </button>
            </div>
          </div>

          {/* Row 2: Stats + Quick Actions */}
          <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-200/60 dark:border-gray-700/50">
            {/* Stats */}
            <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                  <FileText className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                </div>
                <span><span className="tabular-nums font-semibold text-gray-800 dark:text-gray-200">{docCount}</span> 篇文档</span>
              </span>
              <span className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
                  <Users className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400" />
                </div>
                <span><span className="tabular-nums font-semibold text-gray-800 dark:text-gray-200">{memberCount}</span> 位成员</span>
              </span>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1">
              <Link
                href={`/spaces/${space.id}/analytics`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg transition-colors cursor-pointer"
                title="数据面板"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">数据</span>
              </Link>
              <Link
                href={`/spaces/${space.id}/activity`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg transition-colors cursor-pointer"
                title="活动日志"
              >
                <Activity className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">日志</span>
              </Link>
              {isAdmin && (
                <Link
                  href={`/spaces/${space.id}/members`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg transition-colors cursor-pointer"
                  title="成员管理"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">成员</span>
                </Link>
              )}
              {isAdmin && (
                <Link
                  href={`/spaces/${space.id}/templates`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg transition-colors cursor-pointer"
                  title="模板管理"
                >
                  <LayoutTemplate className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">模板</span>
                </Link>
              )}
              {isAdmin && (
                <Link
                  href={`/spaces/${space.id}/settings`}
                  className="inline-flex items-center justify-center w-8 h-8 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg transition-colors cursor-pointer"
                  title="空间设置"
                >
                  <Settings className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
      </FadeIn>

      {/* ═══════ Documents — fills remaining space ═══════ */}
      <FadeIn delay={0.1} y={10} className="flex-1 min-h-0 flex flex-col">
      <div className="flex-1 min-h-0 flex flex-col bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {docsLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-12 bg-gray-50 dark:bg-gray-900/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : !hasDocuments ? (
          /* ─── Empty State ─── */
          <div className="flex-1 flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-5">
              <FileText className="w-7 h-7 text-blue-400" />
            </div>
            <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-1.5">
              开始创建你的第一篇文档
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 max-w-xs text-center">
              从模板快速开始，或创建空白文档自由书写
            </p>
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              新建文档
            </button>
          </div>
        ) : (
          /* ─── Document Table ─── */
          <DocumentTable
            documents={documents}
            spaceId={space.id}
            currentUserId={user?.id}
            onDelete={deleteDocument}
          />
        )}
      </div>
      </FadeIn>

      {/* ═══════ Template Picker ═══════ */}
      <TemplatePickerModal
        open={showTemplatePicker}
        onOpenChange={setShowTemplatePicker}
        spaceId={id}
        onSelect={handleTemplateSelect}
        onSkip={handleSkipTemplate}
      />

      {/* ═══════ Import Document ═══════ */}
      <ImportDocumentDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        spaceId={id}
        onImported={(doc) => {
          router.push(`/spaces/${id}/documents/${doc.id}`);
        }}
      />
    </div>
  );
}

