'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { spaceService } from '@/services/space-service';
import { Space } from '@/types/space';
import {
  ArrowRight,
  FileText,
  Users,
  FolderOpen,
  Plus,
  Clock,
  LayoutDashboard,
  Sparkles,
  X,
  TrendingUp,
  Star,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { RecentDocuments } from '@/components/activity/recent-documents';
import { ActivityTimeline } from '@/components/activity/activity-timeline';
import { DashboardStats } from '@/components/activity/dashboard-stats';
import CountUp from '@/components/ui/count-up';
import { FadeIn } from '@/components/ui/fade-in';
import { AnimatedModal } from '@/components/ui/animated-modal';
import { documentService } from '@/services/document-service';
import { DocumentFavorite } from '@/types/document';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);

  const [showRecentModal, setShowRecentModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [favorites, setFavorites] = useState<DocumentFavorite[]>([]);

  useEffect(() => {
    if (user) {
      spaceService
        .getMySpaces()
        .then(setSpaces)
        .catch(console.error)
        .finally(() => setLoading(false));

      documentService.getFavorites().then(setFavorites).catch(console.error);
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

  return (
    <div className="space-y-10">

      {/* ═══════ Hero Banner ═══════ */}
      <FadeIn delay={0} y={30}>
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 border border-blue-100/80 dark:border-gray-700 px-12 py-14">
        {/* decorative blobs */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-blue-200/30 dark:bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 left-1/4 w-96 h-40 bg-violet-200/20 dark:bg-violet-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-indigo-200/20 dark:bg-indigo-500/5 rounded-full blur-3xl" />

        <div className="relative z-10">
          {/* Top row: greeting + avatar */}
          <div className="flex items-start justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[13px] font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3.5 py-1.5 rounded-full">
                <Sparkles className="w-3.5 h-3.5" />
                {greeting}
              </span>
              <h1 className="text-4xl font-bold mt-5 tracking-tight leading-tight text-gray-900 dark:text-white">
                {user.name}
              </h1>
              <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">
                这是你的工作概览，一切尽在掌握
              </p>
            </div>
            <div className="hidden md:block">
              <div className="w-16 h-16 rounded-2xl bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/40">
                {user.name?.charAt(0) || '?'}
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="hidden md:flex items-end justify-between mt-10">
            <div className="flex items-center gap-10">
              {[
                { value: spaces.length, label: '工作空间', icon: FolderOpen, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
                { value: totalDocs, label: '文档总数', icon: FileText, color: 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400' },
                { value: totalMembers, label: '协作者', icon: Users, color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl ${s.color.split(' ').slice(0, 2).join(' ')} flex items-center justify-center`}>
                    <s.icon className={`w-5 h-5 ${s.color.split(' ').slice(2).join(' ')}`} />
                  </div>
                  <div>
                    <p className="text-3xl font-bold leading-none text-gray-900 dark:text-white">
                      {loading ? (
                        <span className="tabular-nums text-gray-300 dark:text-gray-600">–</span>
                      ) : (
                        <CountUp from={0} to={s.value} duration={2} separator="," direction="up" />
                      )}
                    </p>
                    <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/spaces')}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                新建空间
              </button>
              <button
                onClick={() => router.push('/spaces')}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-xl transition-colors cursor-pointer"
              >
                <FolderOpen className="w-4 h-4" />
                管理空间
              </button>
            </div>
          </div>
        </div>
      </div>
      </FadeIn>

      {/* ═══════ Stats Charts ═══════ */}
      <FadeIn delay={0.15} y={30}>
      <DashboardStats />
      </FadeIn>

      {/* ═══════ Favorites ═══════ */}
      {favorites.length > 0 && (
        <FadeIn delay={0.2} y={30}>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-7">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                收藏文档
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">快速访问你收藏的文档</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {favorites.slice(0, 6).map((fav) => (
              <Link
                key={fav.id}
                href={`/spaces/${fav.document.spaceId}/documents/${fav.document.id}`}
                className="group flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50/50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-700 hover:border-amber-200 dark:hover:border-amber-800 hover:bg-amber-50/30 dark:hover:bg-amber-900/10 transition-all"
              >
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
                    {fav.document.title || '无标题文档'}
                  </p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                    {fav.document.creator?.name || '未知'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
        </FadeIn>
      )}

      {/* ═══════ Recent Documents + Activity ═══════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Documents */}
        <FadeIn delay={0.25} y={30}>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-7">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  最近访问
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">最近浏览的文档</p>
              </div>
            </div>
            <button
              onClick={() => setShowRecentModal(true)}
              className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              查看全部
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <RecentDocuments limit={3} />
        </div>
        </FadeIn>

        {/* My Activity */}
        <FadeIn delay={0.35} y={30}>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-7">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  我的活动
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">最近的操作记录</p>
              </div>
            </div>
            <button
              onClick={() => setShowActivityModal(true)}
              className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              查看全部
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <ActivityTimeline compact maxItems={3} />
        </div>
        </FadeIn>
      </div>

      {/* ═══════ Recent Spaces ═══════ */}
      <FadeIn delay={0.45} y={30}>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-7">
        <div className="flex items-center justify-between mb-7">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                最近活跃的空间
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">你正在参与的工作空间</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/spaces')}
            className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
          >
            查看全部
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[120px] bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl animate-pulse p-6">
                <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
                <div className="h-3 w-full bg-gray-100 dark:bg-gray-700 rounded mb-2" />
                <div className="h-3 w-2/3 bg-gray-100 dark:bg-gray-700 rounded" />
              </div>
            ))}
          </div>
        ) : recentSpaces.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-6">
              <FolderOpen className="w-8 h-8 text-gray-400" />
            </div>
            <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              还没有工作空间
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              创建一个空间，开始和团队一起协作
            </p>
            <button
              onClick={() => router.push('/spaces')}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              创建空间
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {recentSpaces.map((space) => (
              <button
                key={space.id}
                onClick={() => router.push(`/spaces/${space.id}`)}
                className="group text-left bg-gray-50/50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-700 rounded-xl p-6 hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/40 transition-colors">
                      <FolderOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                      {space.name}
                    </h4>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 flex-shrink-0 mt-3 transition-opacity" />
                </div>
                {space.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mb-3 ml-[52px]">
                    {space.description}
                  </p>
                )}
                <div className="flex items-center gap-3 text-[11px] text-gray-400 dark:text-gray-500 ml-[52px]">
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {space._count?.documents ?? 0} 文档
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {space._count?.permissions ?? 0} 成员
                  </span>
                  <span className="ml-auto flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(space.updatedAt), {
                      addSuffix: true,
                      locale: zhCN,
                    })}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      </FadeIn>

      {/* ═══════ Modal: 最近访问 ═══════ */}
      {showRecentModal && (
        <FullListModal
          title="最近访问"
          icon={<Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
          iconBg="bg-blue-50 dark:bg-blue-900/20"
          onClose={() => setShowRecentModal(false)}
        >
          <RecentDocuments />
        </FullListModal>
      )}

      {/* ═══════ Modal: 我的活动 ═══════ */}
      {showActivityModal && (
        <FullListModal
          title="我的活动"
          icon={<TrendingUp className="w-5 h-5 text-violet-600 dark:text-violet-400" />}
          iconBg="bg-violet-50 dark:bg-violet-900/20"
          onClose={() => setShowActivityModal(false)}
        >
          <ActivityTimeline compact />
        </FullListModal>
      )}
    </div>
  );
}

// ────────────────────── FullListModal ──────────────────────

function FullListModal({
  title,
  icon,
  iconBg,
  onClose,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  iconBg: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <AnimatedModal open onClose={onClose} className="w-full max-w-2xl mx-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-7 py-5 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
              {icon}
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-7 py-6">
          {children}
        </div>
      </div>
    </AnimatedModal>
  );
}
