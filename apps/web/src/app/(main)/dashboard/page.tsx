'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { spaceService } from '@/services/space-service';
import { Space } from '@/types/space';
import {
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Users,
  FolderOpen,
  Plus,
  TrendingUp,
  Star,
  Eye,
  X,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { RecentDocuments } from '@/components/activity/recent-documents';
import { DashboardStats } from '@/components/activity/dashboard-stats';
import CountUp from '@/components/ui/count-up';
import { activityService, type UserProductivityStats } from '@/services/activity-service';
import { AnimatedModal } from '@/components/ui/animated-modal';
import { documentService } from '@/services/document-service';
import { DocumentFavorite } from '@/types/document';
import Link from 'next/link';

/* ── color accents for space cards ── */
const SPACE_COLORS = [
  { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
  { bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-600 dark:text-violet-400' },
  { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' },
  { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' },
  { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-600 dark:text-rose-400' },
  { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-600 dark:text-cyan-400' },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRecentModal, setShowRecentModal] = useState(false);
  const [favorites, setFavorites] = useState<DocumentFavorite[]>([]);
  const [prodStats, setProdStats] = useState<UserProductivityStats | null>(null);

  useEffect(() => {
    if (user) {
      spaceService
        .getMySpaces()
        .then(setSpaces)
        .catch(console.error)
        .finally(() => setLoading(false));

      documentService.getFavorites().then(setFavorites).catch(console.error);
      activityService.getMyStats().then(setProdStats).catch(console.error);
    }
  }, [user]);

  if (!user) return null;

  const recentSpaces = [...spaces]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6);

  const totalDocs = spaces.reduce((sum, s) => sum + (s._count?.documents ?? 0), 0);
  const totalMembers = spaces.reduce((sum, s) => sum + (s._count?.permissions ?? 0), 0);

  const hour = new Date().getHours();
  const greeting = hour < 6 ? '夜深了' : hour < 12 ? '上午好' : hour < 18 ? '下午好' : '晚上好';

  const createdDiff = prodStats ? prodStats.thisWeekCreated - prodStats.lastWeekCreated : null;
  const editedDiff = prodStats ? prodStats.thisWeekEdited - prodStats.lastWeekEdited : null;

  const statItems = [
    { value: spaces.length, label: '工作空间', icon: FolderOpen, diff: null, loading: loading },
    { value: totalDocs, label: '文档总数', icon: FileText, diff: null, loading: loading },
    { value: totalMembers, label: '协作者', icon: Users, diff: null, loading: loading },
    { value: prodStats?.thisWeekCreated ?? 0, label: '本周创建', icon: Plus, diff: createdDiff, loading: false },
    { value: prodStats?.thisWeekEdited ?? 0, label: '本周编辑', icon: TrendingUp, diff: editedDiff, loading: false },
    { value: prodStats?.totalReads ?? 0, label: '总阅读', icon: Eye, diff: null, loading: false },
  ];

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{greeting}</p>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mt-1 tracking-tight">
            {user.name}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/spaces')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          >
            管理空间
          </button>
          <button
            onClick={() => router.push('/spaces')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            新建空间
          </button>
        </div>
      </div>

      {/* ── KPI Stats Strip (VisActor style: border-separated, trend badges) ── */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-gray-200 dark:divide-gray-700">
          {statItems.map((s) => (
            <div key={s.label} className="px-5 py-5 first:rounded-l-xl last:rounded-r-xl">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">{s.label}</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-semibold text-gray-900 dark:text-white tabular-nums">
                  {s.loading ? (
                    <span className="text-gray-300 dark:text-gray-600">-</span>
                  ) : (
                    <CountUp from={0} to={s.value} duration={2} separator="," direction="up" />
                  )}
                </span>
                {s.diff !== null && s.diff !== 0 && (
                  <span className={`inline-flex items-center gap-0.5 text-[11px] font-medium px-1.5 py-0.5 rounded-md ${
                    s.diff > 0
                      ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30'
                      : 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30'
                  }`}>
                    {s.diff > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {Math.abs(s.diff)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Activity Chart (full-width, prominent) ── */}
      <DashboardStats />

      {/* ── Favorites (conditional) ── */}
      {favorites.length > 0 && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">收藏文档</h3>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-3 gap-y-0.5">
            {favorites.slice(0, 6).map((fav) => (
              <Link
                key={fav.id}
                href={`/spaces/${fav.document.spaceId}/documents/${fav.document.id}`}
                className="group flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300 truncate group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                  {fav.document.title || '无标题文档'}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Recent Spaces + Recent Documents (side by side) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">

        {/* Recent Spaces */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col">
          <div className="flex items-center justify-between px-5 pt-5 pb-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">最近活跃的空间</h3>
            <button
              onClick={() => router.push('/spaces')}
              className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"
            >
              查看全部
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="flex-1 px-2 pb-3">
            {loading ? (
              <div className="space-y-1 px-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-14 bg-gray-50 dark:bg-gray-700/30 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : recentSpaces.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-10">
                <FolderOpen className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">还没有工作空间</p>
                <button
                  onClick={() => router.push('/spaces')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  创建空间
                </button>
              </div>
            ) : (
              <div className="space-y-0.5">
                {recentSpaces.slice(0, 4).map((space, i) => {
                  const color = SPACE_COLORS[i % SPACE_COLORS.length];
                  return (
                    <button
                      key={space.id}
                      onClick={() => router.push(`/spaces/${space.id}`)}
                      className="group w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors cursor-pointer"
                    >
                      <div className={`w-8 h-8 rounded-lg ${color.bg} flex items-center justify-center flex-shrink-0`}>
                        <FolderOpen className={`w-4 h-4 ${color.text}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {space.name}
                        </h4>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 tabular-nums">
                          {space._count?.documents ?? 0} 文档 · {space._count?.permissions ?? 0} 成员 · {formatDistanceToNow(new Date(space.updatedAt), { addSuffix: true, locale: zhCN })}
                        </p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent Documents */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col">
          <div className="flex items-center justify-between px-5 pt-5 pb-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">最近访问</h3>
            <button
              onClick={() => setShowRecentModal(true)}
              className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"
            >
              查看全部
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="flex-1 px-2 pb-3">
            <RecentDocuments limit={4} />
          </div>
        </div>
      </div>

      {/* ── Modal: Recent Documents ── */}
      {showRecentModal && (
        <AnimatedModal open onClose={() => setShowRecentModal(false)} className="w-full max-w-2xl mx-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100">最近访问</h2>
              <button
                onClick={() => setShowRecentModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <RecentDocuments />
            </div>
          </div>
        </AnimatedModal>
      )}
    </div>
  );
}
