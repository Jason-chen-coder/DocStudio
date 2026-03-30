'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { activityService, ActivityLogItem } from '@/services/activity-service';
import CountUp from '@/components/ui/count-up';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
      <p className="font-semibold text-gray-900 dark:text-white tabular-nums">{payload[0].value} 次操作</p>
    </div>
  );
}

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

    const trend: { name: string; v: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      trend.push({
        name: i === 0 ? '今天' : `${d.getMonth() + 1}/${d.getDate()}`,
        v: 0,
      });
    }

    let todayCount = 0;

    activities.forEach((item) => {
      const d = new Date(item.createdAt);
      const daysAgo = Math.floor(
        (today.getTime() - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / 86400000,
      );
      if (daysAgo >= 0 && daysAgo < 7) trend[6 - daysAgo].v++;
      if (d >= today) todayCount++;
    });

    return { trend, total: activities.length, todayCount };
  }, [activities]);

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 animate-pulse">
        <div className="h-3 w-24 bg-gray-100 dark:bg-gray-700 rounded mb-6" />
        <div className="h-[200px] bg-gray-50 dark:bg-gray-700/30 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      {/* Header row */}
      <div className="flex items-baseline justify-between px-5 pt-5 pb-1">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">近 7 天活动</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-gray-900 dark:text-white tabular-nums">
              <CountUp from={0} to={stats.total} duration={2} separator="," direction="up" />
            </span>
            <span className="text-sm text-gray-400 dark:text-gray-500">次操作</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-md tabular-nums">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          今日 {stats.todayCount}
        </div>
      </div>

      {/* Chart */}
      <div className="px-2 pb-3 pt-2">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={stats.trend} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(237 60% 58%)" stopOpacity={0.12} />
                <stop offset="100%" stopColor="hsl(237 60% 58%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="hsl(240 6% 92%)"
              className="dark:opacity-20"
            />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: 'hsl(240 5% 65%)' }}
              axisLine={false}
              tickLine={false}
              dy={8}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'hsl(240 5% 65%)' }}
              axisLine={false}
              tickLine={false}
              width={40}
              allowDecimals={false}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'hsl(237 60% 58%)', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Area
              type="monotone"
              dataKey="v"
              stroke="hsl(237 60% 58%)"
              strokeWidth={2}
              fill="url(#trendGrad)"
              dot={false}
              activeDot={{ r: 4, fill: 'hsl(237 60% 58%)', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
