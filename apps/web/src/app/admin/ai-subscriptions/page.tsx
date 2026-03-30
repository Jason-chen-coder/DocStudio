'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  aiSubscriptionService,
  type AiSubscriptionRequest,
  type AiSubscriptionRecord,
} from '@/services/ai-subscription-service';
import { aiService, type AiAdminUsage } from '@/services/ai-service';
import {
  PLAN_LABELS,
  BILLING_LABELS,
  STATUS_LABELS,
  REQUEST_STATUS_LABELS,
} from '@/config/ai-subscription';
import { getCdnUrl } from '@/lib/cdn';
import {
  Check,
  X,
  Loader2,
  Trash2,
  Clock,
  Sparkles,
  Zap,
  Hash,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminAiSubscriptionsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<'requests' | 'subscriptions'>('requests');
  const [requests, setRequests] = useState<AiSubscriptionRequest[]>([]);
  const [subscriptions, setSubscriptions] = useState<AiSubscriptionRecord[]>([]);
  const [requestsTotal, setRequestsTotal] = useState(0);
  const [subsTotal, setSubsTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [usage, setUsage] = useState<AiAdminUsage | null>(null);

  const loadRequests = useCallback(async () => {
    try {
      const res = await aiSubscriptionService.getPendingRequests(1, 50);
      setRequests(res.data);
      setRequestsTotal(res.total);
    } catch { /* ignore */ }
  }, []);

  const loadSubscriptions = useCallback(async () => {
    try {
      const res = await aiSubscriptionService.getAllSubscriptions({ limit: 50 });
      setSubscriptions(res.data);
      setSubsTotal(res.total);
    } catch { /* ignore */ }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      loadRequests(),
      loadSubscriptions(),
      aiService.getAdminUsage().then(setUsage).catch(() => {}),
    ]);
    setLoading(false);
  }, [loadRequests, loadSubscriptions]);

  useEffect(() => {
    if (user?.isSuperAdmin) loadAll();
  }, [user, loadAll]);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await aiSubscriptionService.approveRequest(id);
      toast.success('已通过');
      loadAll();
    } catch (err: any) {
      toast.error(err.message || '操作失败');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      await aiSubscriptionService.rejectRequest(id);
      toast.success('已拒绝');
      loadAll();
    } catch (err: any) {
      toast.error(err.message || '操作失败');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('确定撤销此订阅？')) return;
    setActionLoading(id);
    try {
      await aiSubscriptionService.revokeSubscription(id);
      toast.success('已撤销');
      loadAll();
    } catch (err: any) {
      toast.error(err.message || '操作失败');
    } finally {
      setActionLoading(null);
    }
  };

  if (!user?.isSuperAdmin) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-blue-500" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">AI 订阅管理</h1>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {requestsTotal} 待审批 · {subsTotal} 总订阅
        </div>
      </div>

      {/* Usage Stats */}
      {usage && (
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{usage.todayRequests}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">今日请求次数</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="w-9 h-9 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
              <Hash className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{usage.todayTokens.toLocaleString()}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">今日 Token 消耗</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {[
          { key: 'requests' as const, label: `待审批 (${requestsTotal})` },
          { key: 'subscriptions' as const, label: `全部订阅 (${subsTotal})` },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t.key
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Pending Requests */}
      {tab === 'requests' && (
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12 text-gray-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500 text-sm">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
              暂无待审批的申请
            </div>
          ) : (
            requests.map((req) => (
              <div key={req.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm font-semibold text-gray-600 dark:text-gray-400 flex-shrink-0 overflow-hidden">
                    {getCdnUrl(req.user?.avatarUrl) ? (
                      <img src={getCdnUrl(req.user?.avatarUrl) || ''} className="w-full h-full object-cover" />
                    ) : (
                      req.user?.name?.charAt(0) || '?'
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {req.user?.name} <span className="text-gray-400 font-normal">({req.user?.email})</span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      申请 <span className="font-medium">{PLAN_LABELS[req.plan]}</span> · {BILLING_LABELS[req.billingPeriod]}
                      {req.reason && <span> · {req.reason}</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleApprove(req.id)}
                    disabled={actionLoading === req.id}
                  >
                    {actionLoading === req.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    通过
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReject(req.id)}
                    disabled={actionLoading === req.id}
                  >
                    <X className="w-3.5 h-3.5" />
                    拒绝
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* All Subscriptions */}
      {tab === 'subscriptions' && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {loading ? (
            <div className="text-center py-12 text-gray-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
          ) : subscriptions.length === 0 ? (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500 text-sm">暂无订阅记录</div>
          ) : (
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">用户</th>
                  <th className="text-left px-4 py-3 font-medium">套餐</th>
                  <th className="text-left px-4 py-3 font-medium">状态</th>
                  <th className="text-left px-4 py-3 font-medium">到期时间</th>
                  <th className="text-right px-4 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="bg-white dark:bg-gray-800">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-semibold text-gray-600 dark:text-gray-400 overflow-hidden flex-shrink-0">
                          {getCdnUrl(sub.user?.avatarUrl) ? (
                            <img src={getCdnUrl(sub.user?.avatarUrl) || ''} className="w-full h-full object-cover" />
                          ) : (
                            sub.user?.name?.charAt(0) || '?'
                          )}
                        </div>
                        <span className="text-gray-900 dark:text-gray-100">{sub.user?.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {PLAN_LABELS[sub.plan]} · {BILLING_LABELS[sub.billingPeriod]}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        sub.status === 'ACTIVE' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                        sub.status === 'EXPIRED' ? 'bg-gray-100 dark:bg-gray-700 text-gray-500' :
                        'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      }`}>
                        {STATUS_LABELS[sub.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {new Date(sub.endDate).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {sub.status === 'ACTIVE' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRevoke(sub.id)}
                          disabled={actionLoading === sub.id}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
        </div>
      )}
    </div>
  );
}
