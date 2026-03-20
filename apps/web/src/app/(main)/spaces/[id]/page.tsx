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
} from 'lucide-react';
import { TemplatePickerModal } from '@/components/template/template-picker-modal';
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
}: {
  documents: Document[];
  spaceId: string;
  currentUserId?: string;
}) {
  const [sortKey, setSortKey] = useState<SortKey>('updatedAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

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

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return null;
    return sortDir === 'asc'
      ? <ArrowUp className="w-3 h-3 ml-1 inline" />
      : <ArrowDown className="w-3 h-3 ml-1 inline" />;
  };

  const thClass = "px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap select-none cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 transition-colors";

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      {/* Table container — scrolls internally */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur-sm">
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <th className={thClass} onClick={() => toggleSort('title')}>
                名称 <SortIcon col="title" />
              </th>
              <th className={`${thClass} hidden md:table-cell`}>
                所有者
              </th>
              <th
                className={`${thClass} hidden sm:table-cell`}
                onClick={() => toggleSort('updatedAt')}
              >
                最近更新 <SortIcon col="updatedAt" />
              </th>
              <th
                className={`${thClass} hidden lg:table-cell`}
                onClick={() => toggleSort('createdAt')}
              >
                创建时间 <SortIcon col="createdAt" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap w-16">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((doc) => {
              const avatarUrl = getCdnUrl(doc.creator?.avatarUrl);
              const isOwner = doc.creator?.id === currentUserId;
              return (
                <tr
                  key={doc.id}
                  className="group border-b border-gray-50 dark:border-gray-800/50 last:border-b-0
                    hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors"
                >
                  {/* Name */}
                  <td className="px-4 py-3">
                    <Link
                      href={`/spaces/${spaceId}/documents/${doc.id}`}
                      className="flex items-center gap-3 min-w-0"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0
                        group-hover:bg-blue-200 dark:group-hover:bg-blue-800/40 transition-colors">
                        <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="font-medium text-gray-900 dark:text-gray-100 truncate
                        group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                        {doc.title || '无标题文档'}
                      </span>
                    </Link>
                  </td>

                  {/* Owner */}
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      {avatarUrl ? (
                        <Image
                          src={avatarUrl}
                          alt={doc.creator?.name || ''}
                          width={20}
                          height={20}
                          unoptimized
                          className="rounded-full flex-shrink-0"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                          <Users className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                        </div>
                      )}
                      <span className="text-gray-600 dark:text-gray-400 text-xs truncate max-w-[120px]">
                        {isOwner ? '我' : (doc.creator?.name || '未知')}
                      </span>
                    </div>
                  </td>

                  {/* Updated At */}
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
                      {formatShortDate(doc.updatedAt)}
                    </span>
                  </td>

                  {/* Created At */}
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
                      {formatShortDate(doc.createdAt || doc.updatedAt)}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <Link
                      href={`/spaces/${spaceId}/documents/${doc.id}`}
                      className="inline-flex items-center justify-center w-7 h-7 rounded-lg
                        text-gray-400 hover:text-blue-600 dark:hover:text-blue-400
                        hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      title="打开文档"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
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

  const { documents, loading: docsLoading, createDocument } = useDocuments(id);

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
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm cursor-pointer flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              新建文档
            </button>
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
    </div>
  );
}

