'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { activityService, type SpaceStats } from '@/services/activity-service';
import { spaceService } from '@/services/space-service';
import { Space } from '@/types/space';
import { useAuth } from '@/lib/auth-context';
import CountUp from '@/components/ui/count-up';
import { FadeIn } from '@/components/ui/fade-in';
import Link from 'next/link';
import { getCdnUrl } from '@/lib/cdn';
import {
  FileText,
  Users,
  Eye,
  Zap,
  ChevronLeft,
  TrendingUp,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';

const PALETTE = [
  'hsl(237 60% 58%)',
  'hsl(237 40% 72%)',
  'hsl(200 50% 54%)',
  'hsl(160 40% 50%)',
  'hsl(30  50% 58%)',
  'hsl(350 45% 58%)',
];

const ACTION_LABELS: Record<string, string> = {
  CREATE: '创建', UPDATE: '编辑', DELETE: '删除', VIEW: '查看',
  MOVE: '移动', RESTORE: '恢复', SHARE: '分享', JOIN: '加入',
  LEAVE: '离开', INVITE: '邀请', ROLE_CHANGE: '权限',
};

function ChartTooltip({ active, payload, label, suffix = '' }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm px-3 py-1.5 text-xs">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-gray-900 dark:text-gray-100 ml-2">
        {payload[0].value}{suffix}
      </span>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-4.5 h-4.5" />
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">{label}</span>
      </div>
      <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
        <CountUp from={0} to={value} duration={2} separator="," direction="up" />
      </p>
    </div>
  );
}

export default function SpaceAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = params.id as string;

  const [space, setSpace] = useState<Space | null>(null);
  const [stats, setStats] = useState<SpaceStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    Promise.all([
      spaceService.getSpace(id),
      activityService.getSpaceStats(id),
    ])
      .then(([spaceData, statsData]) => {
        setSpace(spaceData);
        setStats(statsData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, id]);

  if (!user) return null;

  if (loading || !stats) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <div className="flex-shrink-0 mb-5">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
              <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
              <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const trendData = stats.docGrowthTrend.map((d) => ({
    name: d.date.slice(5), // MM-DD
    count: d.count,
  }));

  const pieData = stats.actionDistribution.map((a, i) => ({
    name: ACTION_LABELS[a.action] || a.action,
    value: a.count,
    fill: PALETTE[i % PALETTE.length],
  }));

  return (
    <div className="h-full flex flex-col overflow-y-auto space-y-5">
      {/* Header */}
      <FadeIn delay={0} y={10}>
        <div className="flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/spaces/${id}`)}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-500" />
            </button>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{space?.name}</p>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">数据面板</h1>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Overview Cards */}
      <FadeIn delay={0.1} y={20}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={FileText} label="文档总数" value={stats.overview.docCount} color="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" />
          <StatCard icon={Users} label="成员数" value={stats.overview.memberCount} color="bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400" />
          <StatCard icon={Eye} label="总阅读量" value={stats.overview.totalViews} color="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400" />
          <StatCard icon={Zap} label="本周操作" value={stats.overview.weeklyActions} color="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400" />
        </div>
      </FadeIn>

      {/* Charts Row 1: Growth Trend + Action Distribution */}
      <FadeIn delay={0.2} y={20}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Doc Growth Trend */}
          <div className="lg:col-span-2 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-4 sm:px-7 sm:py-6">
            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium tracking-wide uppercase mb-4">
              文档增长趋势（近 30 天）
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(237 60% 58%)" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="hsl(237 60% 58%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(240 5% 60%)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(240 5% 60%)' }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
                <Tooltip content={<ChartTooltip suffix=" 篇" />} />
                <Area type="monotone" dataKey="count" stroke="hsl(237 60% 58%)" strokeWidth={2} fill="url(#growthFill)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Action Distribution */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-4 sm:px-7 sm:py-6">
            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium tracking-wide uppercase mb-4">
              操作分布
            </p>
            <div className="flex flex-col items-center">
              <div className="w-[140px] h-[140px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2} stroke="none">
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-3">
                {pieData.map((item, i) => (
                  <span key={i} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.fill }} />
                    {item.name} ({item.value})
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Charts Row 2: Top Docs + Top Members */}
      <FadeIn delay={0.3} y={20}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Documents */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-4 sm:px-7 sm:py-6">
            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium tracking-wide uppercase mb-4">
              热门文档 Top 10
            </p>
            {stats.topDocuments.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">暂无数据</p>
            ) : (
              <div className="space-y-2.5">
                {stats.topDocuments.map((doc, i) => {
                  const max = stats.topDocuments[0]?.views || 1;
                  return (
                    <div key={doc.documentId} className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 dark:text-gray-500 w-5 text-right tabular-nums font-medium">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/spaces/${id}/documents/${doc.documentId}`}
                          className="text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 truncate block transition-colors"
                        >
                          {doc.title}
                        </Link>
                        <div className="mt-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-blue-500/70"
                            style={{ width: `${(doc.views / max) * 100}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums font-medium">{doc.views}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Top Members */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-4 sm:px-7 sm:py-6">
            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium tracking-wide uppercase mb-4">
              活跃成员 Top 10（近 30 天）
            </p>
            {stats.topMembers.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">暂无数据</p>
            ) : (
              <div className="space-y-2.5">
                {stats.topMembers.map((member, i) => {
                  const max = stats.topMembers[0]?.actions || 1;
                  return (
                    <div key={member.userId} className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 dark:text-gray-500 w-5 text-right tabular-nums font-medium">{i + 1}</span>
                      <div className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-xs font-semibold text-violet-600 dark:text-violet-400 flex-shrink-0">
                        {getCdnUrl(member.avatarUrl) ? (
                          <img src={getCdnUrl(member.avatarUrl)} alt={member.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          member.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{member.name}</p>
                        <div className="mt-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-violet-500/70"
                            style={{ width: `${(member.actions / max) * 100}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums font-medium">{member.actions}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
