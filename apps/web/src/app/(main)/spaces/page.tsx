'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { spaceService } from '@/services/space-service';
import { Space } from '@/types/space';
import { CreateSpaceModal } from '@/components/space/create-space-modal';
import {
  Plus,
  FolderOpen,
  Crown,
  Users,
  FileText,
  Globe,
  Lock,
  ArrowRight,
  Clock,
  Sparkles,
  Search,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import CountUp from '@/components/ui/count-up';
import { FadeIn } from '@/components/ui/fade-in';

export default function SpacesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'my' | 'joined'>('my');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (user) loadSpaces();
  }, [user]);

  async function loadSpaces() {
    try {
      setLoading(true);
      const data = await spaceService.getMySpaces();
      setSpaces(data);
    } catch (error) {
      console.error('Failed to load spaces', error);
    } finally {
      setLoading(false);
    }
  }

  if (!user) return null;

  const mySpaces = spaces.filter((s) => s.myRole === 'OWNER');
  const joinedSpaces = spaces.filter((s) => s.myRole !== 'OWNER');
  const totalDocs = spaces.reduce((sum, s) => sum + (s._count?.documents ?? 0), 0);
  const totalMembers = spaces.reduce((sum, s) => sum + (s._count?.permissions ?? 0), 0);

  const activeList = activeTab === 'my' ? mySpaces : joinedSpaces;
  const filtered = search
    ? activeList.filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.description?.toLowerCase().includes(search.toLowerCase()),
      )
    : activeList;

  // Loading skeleton
  if (loading && !spaces.length) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800 px-12 py-14">
          <div className="h-9 w-64 bg-white/60 dark:bg-gray-700 rounded-lg mb-3" />
          <div className="h-5 w-96 bg-white/40 dark:bg-gray-700 rounded" />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-[160px] bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ═══════ Hero ═══════ */}
      <FadeIn delay={0} y={30}>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 border border-blue-100/80 dark:border-gray-700 px-12 py-12">
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-blue-200/30 dark:bg-blue-500/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-16 left-1/4 w-80 h-36 bg-violet-200/20 dark:bg-violet-500/5 rounded-full blur-3xl" />

          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[13px] font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3.5 py-1.5 rounded-full">
                  <Sparkles className="w-3.5 h-3.5" />
                  工作空间
                </span>
                <h1 className="text-3xl font-bold mt-4 tracking-tight text-gray-900 dark:text-white">
                  管理你的工作空间
                </h1>
                <p className="mt-2 text-base text-gray-500 dark:text-gray-400 max-w-md">
                  创建和管理文档空间，与团队高效协作
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                新建空间
              </button>
            </div>

            {/* Stats */}
            <div className="hidden md:flex items-center gap-10 mt-10">
              {[
                { value: spaces.length, label: '全部空间', icon: FolderOpen, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
                { value: totalDocs, label: '文档总数', icon: FileText, color: 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400' },
                { value: totalMembers, label: '协作者', icon: Users, color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl ${s.color.split(' ').slice(0, 2).join(' ')} flex items-center justify-center`}>
                    <s.icon className={`w-5 h-5 ${s.color.split(' ').slice(2).join(' ')}`} />
                  </div>
                  <div>
                    <p className="text-3xl font-bold leading-none text-gray-900 dark:text-white">
                      <CountUp from={0} to={s.value} duration={2} direction="up" />
                    </p>
                    <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </FadeIn>

      {/* ═══════ Tabs + Search ═══════ */}
      <FadeIn delay={0.15} y={30}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Tab buttons */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-1 gap-1">
            <button
              onClick={() => setActiveTab('my')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                activeTab === 'my'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Crown className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
              我的空间
              <span className="ml-1.5 text-xs text-gray-400 dark:text-gray-500 tabular-nums">{mySpaces.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('joined')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                activeTab === 'joined'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Users className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
              已加入
              <span className="ml-1.5 text-xs text-gray-400 dark:text-gray-500 tabular-nums">{joinedSpaces.length}</span>
            </button>
          </div>

          {/* Search + Mobile create */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索空间..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-blue-400 dark:focus:border-blue-500 text-gray-900 dark:text-gray-100 placeholder-gray-400 w-48"
              />
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="md:hidden inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              新建
            </button>
          </div>
        </div>
      </FadeIn>

      {/* ═══════ Space Grid ═══════ */}
      <FadeIn delay={0.3} y={30}>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
            <div className="w-20 h-20 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-6">
              <FolderOpen className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              {search ? '未找到匹配的空间' : activeTab === 'my' ? '还没有工作空间' : '还没有加入的空间'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs text-center">
              {search
                ? '尝试其他关键词'
                : activeTab === 'my'
                ? '创建一个工作空间，开始组织你的文档'
                : '当其他用户邀请你加入空间时，将在这里显示'}
            </p>
            {activeTab === 'my' && !search && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                创建空间
              </button>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((space) => (
              <SpaceCard key={space.id} space={space} onClick={() => router.push(`/spaces/${space.id}`)} />
            ))}
          </div>
        )}
      </FadeIn>

      {/* Modal */}
      {isModalOpen && (
        <CreateSpaceModal
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            loadSpaces();
          }}
        />
      )}
    </div>
  );
}

// ────────────────────── SpaceCard ──────────────────────

function SpaceCard({ space, onClick }: { space: Space; onClick: () => void }) {
  const isOwner = space.myRole === 'OWNER';
  const docCount = space._count?.documents ?? 0;
  const memberCount = space._count?.permissions ?? 0;

  return (
    <button
      onClick={onClick}
      className="group text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 rounded-2xl p-6 transition-all hover:shadow-md cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/40 transition-colors">
            <span className="text-base font-bold text-blue-600 dark:text-blue-400">
              {space.name.charAt(0)}
            </span>
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
              {space.name}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              {space.isPublic ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                  <Globe className="w-3 h-3" /> 公开
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500">
                  <Lock className="w-3 h-3" /> 私有
                </span>
              )}
            </div>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 mt-3 transition-opacity flex-shrink-0" />
      </div>

      {/* Description */}
      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 min-h-[32px]">
        {space.description || '暂无描述'}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3 text-[11px] text-gray-400 dark:text-gray-500">
          <span className="inline-flex items-center gap-1">
            {isOwner ? <Crown className="w-3 h-3 text-amber-500" /> : <Users className="w-3 h-3" />}
            {isOwner ? '所有者' : space.myRole === 'ADMIN' ? '管理员' : space.myRole === 'EDITOR' ? '编辑者' : '查看者'}
          </span>
          <span className="inline-flex items-center gap-1">
            <FileText className="w-3 h-3" />
            {docCount}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="w-3 h-3" />
            {memberCount}
          </span>
        </div>
        <span className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500">
          <Clock className="w-3 h-3" />
          {formatDistanceToNow(new Date(space.updatedAt), { addSuffix: true, locale: zhCN })}
        </span>
      </div>
    </button>
  );
}
