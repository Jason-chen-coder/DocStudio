'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import {
  activityService,
  ActivityLogItem,
  ActivityAction,
} from '@/services/activity-service';
import CountUp from '@/components/ui/count-up';
import {
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';

/* ———— label helpers ———— */

function getShortLabel(action: ActivityAction): string {
  const m: Record<ActivityAction, string> = {
    CREATE: '创建', UPDATE: '编辑', DELETE: '删除', VIEW: '查看',
    MOVE: '移动', RESTORE: '恢复', SHARE: '分享', JOIN: '加入',
    LEAVE: '离开', INVITE: '邀请', ROLE_CHANGE: '权限',
  };
  return m[action] || action;
}

/* A restrained palette — no rainbow */
const PALETTE = [
  'hsl(237 60% 58%)',   // brand blue-violet
  'hsl(237 40% 72%)',   // lighter tint
  'hsl(200 50% 54%)',   // slate-teal
  'hsl(160 40% 50%)',   // sage
  'hsl(30  50% 58%)',   // warm sand
  'hsl(350 45% 58%)',   // muted rose
];

const ACTION_PALETTE: Record<string, string> = {
  CREATE: PALETTE[3], UPDATE: PALETTE[0], DELETE: PALETTE[5],
  VIEW: PALETTE[1], MOVE: PALETTE[4], RESTORE: PALETTE[2],
  SHARE: PALETTE[2], JOIN: PALETTE[3], LEAVE: PALETTE[4],
  INVITE: PALETTE[0], ROLE_CHANGE: PALETTE[1],
};

/* ———— custom tooltip — minimal ———— */

function ChartTooltip({ active, payload, label, suffix = '' }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg shadow-sm px-3 py-1.5">
      <span className="text-[12px] text-muted-foreground">{label}</span>
      <span className="text-[12px] font-semibold text-foreground ml-2">
        {payload[0].value}{suffix}
      </span>
    </div>
  );
}

/* ———— main ———— */

const CHART_H = 180;

export function DashboardStats() {
  const [activities, setActivities] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    activityService
      .getMyActivity(1, 100)
      .then((r) => setActivities(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayNames = ['日', '一', '二', '三', '四', '五', '六'];

    // 7-day trend
    const trend: { name: string; v: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      trend.push({
        name: i === 0 ? '今天' : `${d.getMonth() + 1}/${d.getDate()}`,
        v: 0,
      });
    }

    // weekly by weekday
    const weekly = dayNames.slice(1).concat(dayNames[0]).map((n) => ({ name: n, v: 0 }));

    const actionCounts: Record<string, number> = {};
    let todayCount = 0;

    activities.forEach((item) => {
      const d = new Date(item.createdAt);
      const dow = d.getDay();
      weekly[dow === 0 ? 6 : dow - 1].v++;

      const daysAgo = Math.floor(
        (today.getTime() - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / 86400000,
      );
      if (daysAgo >= 0 && daysAgo < 7) trend[6 - daysAgo].v++;
      if (d >= today) todayCount++;

      actionCounts[item.action] = (actionCounts[item.action] || 0) + 1;
    });

    const pie = Object.entries(actionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([action, count], i) => ({
        name: getShortLabel(action as ActivityAction),
        value: count,
        fill: ACTION_PALETTE[action] || PALETTE[i % PALETTE.length],
      }));

    return { trend, weekly, pie, total: activities.length, todayCount };
  }, [activities]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-7 animate-pulse">
            <div className="h-3 w-20 bg-muted rounded mb-6" />
            <div className="h-[140px] bg-muted/50 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* ——— 1. 7-day trend (area) ——— */}
      <div className="rounded-2xl border border-border bg-card px-7 py-6 flex flex-col">
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">近 7 天</p>
            <p className="text-3xl font-bold text-foreground leading-tight mt-1">
              <CountUp from={0} to={stats.total} duration={2.5} separator="," direction="up" />
              <span className="text-sm font-normal text-muted-foreground ml-1.5">次操作</span>
            </p>
          </div>
          <span className="text-xs tabular-nums font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-lg">
            今日 {stats.todayCount}
          </span>
        </div>

        <div className="flex-1 min-h-[120px] -mx-2">
          <ResponsiveContainer width="100%" height={CHART_H}>
            <AreaChart data={stats.trend}>
              <defs>
                <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(237 60% 58%)" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="hsl(237 60% 58%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: 'hsl(240 5% 60%)' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ChartTooltip suffix=" 次" />} />
              <Area
                type="monotone"
                dataKey="v"
                stroke="hsl(237 60% 58%)"
                strokeWidth={2}
                fill="url(#trendFill)"
                dot={false}
                activeDot={{ r: 4, fill: 'hsl(237 60% 58%)', strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ——— 2. Action distribution (donut) ——— */}
      <div className="rounded-2xl border border-border bg-card px-7 py-6 flex flex-col">
        <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase mb-4">操作分布</p>

        <div className="flex items-center gap-5 flex-1">
          <div className="w-[120px] h-[120px] flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.pie}
                  cx="50%"
                  cy="50%"
                  innerRadius={34}
                  outerRadius={55}
                  paddingAngle={2}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {stats.pie.map((e, i) => (
                    <Cell key={i} fill={e.fill} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: any, n: any) => [`${v}`, n]}
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: '1px solid hsl(240 6% 90%)',
                    boxShadow: 'none',
                    padding: '4px 10px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex-1 space-y-2 min-w-0">
            {stats.pie.map((s, i) => (
              <div key={i} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-2.5 h-2.5 rounded flex-shrink-0" style={{ background: s.fill }} />
                  <span className="text-[13px] text-muted-foreground truncate">{s.name}</span>
                </div>
                <span className="text-[13px] font-semibold text-foreground tabular-nums">
                  <CountUp from={0} to={s.value} duration={2} direction="up" />
                </span>
              </div>
            ))}
            {stats.pie.length === 0 && (
              <p className="text-[13px] text-muted-foreground py-8 text-center">暂无数据</p>
            )}
          </div>
        </div>
      </div>

      {/* ——— 3. Weekly activity (bar) ——— */}
      <div className="rounded-2xl border border-border bg-card px-7 py-6 flex flex-col">
        <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase mb-4">周分布</p>

        <div className="flex-1 min-h-[120px] -mx-2">
          <ResponsiveContainer width="100%" height={CHART_H}>
            <BarChart data={stats.weekly} barCategoryGap="20%">
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: 'hsl(240 5% 60%)' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ChartTooltip suffix=" 次" />} />
              <Bar dataKey="v" radius={[4, 4, 0, 0]}>
                {stats.weekly.map((d, i) => (
                  <Cell
                    key={i}
                    fill={`hsla(237, 60%, 58%, ${0.2 + (d.v / Math.max(...stats.weekly.map((w) => w.v), 1)) * 0.8})`}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
