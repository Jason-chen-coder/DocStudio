'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { FadeIn } from '@/components/ui/fade-in';
import { Button } from '@/components/ui/button';
import {
  aiSubscriptionService,
  type AiSubscriptionInfo,
  type AiSubscriptionRequest as RequestType,
  type PlanInfo,
} from '@/services/ai-subscription-service';
import {
  PLAN_LABELS,
  BILLING_LABELS,
  STATUS_LABELS,
  REQUEST_STATUS_LABELS,
  type AiPlan,
  type AiBillingPeriod,
} from '@/config/ai-subscription';
import {
  Sparkles,
  Crown,
  Zap,
  Check,
  X,
  Clock,
  Loader2,
  CalendarDays,
} from 'lucide-react';
import { toast } from 'sonner';

const PLAN_ICONS: Record<string, any> = {
  BASIC: Sparkles,
  VIP: Crown,
  MAX: Zap,
};

const PLAN_CARD_STYLES: Record<string, {
  gradient: string;
  iconBg: string;
  border: string;
  selectedBorder: string;
  bg: string;
  badge?: string;
  shadow?: string;
  ring?: string;
}> = {
  BASIC: {
    gradient: 'from-blue-500 to-blue-600',
    iconBg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-gray-200 dark:border-gray-700',
    selectedBorder: 'border-blue-500 ring-2 ring-blue-500/20',
    bg: 'bg-white dark:bg-gray-800',
  },
  VIP: {
    gradient: 'from-violet-500 via-purple-500 to-fuchsia-500',
    iconBg: 'bg-violet-50 dark:bg-violet-900/20',
    border: 'border-violet-200 dark:border-violet-800/50',
    selectedBorder: 'border-violet-500 ring-2 ring-violet-500/20',
    bg: 'bg-gradient-to-b from-violet-50/50 to-white dark:from-violet-950/20 dark:to-gray-800',
    badge: '热门',
    shadow: 'shadow-lg shadow-violet-100 dark:shadow-violet-900/20',
  },
  MAX: {
    gradient: 'from-amber-400 via-orange-500 to-red-500',
    iconBg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800/50',
    selectedBorder: 'border-amber-500 ring-2 ring-amber-500/20',
    bg: 'bg-gradient-to-b from-amber-50/50 via-white to-white dark:from-amber-950/20 dark:via-gray-800 dark:to-gray-800',
    badge: '旗舰',
    shadow: 'shadow-xl shadow-amber-100 dark:shadow-amber-900/20',
    ring: 'ring-1 ring-amber-200/60 dark:ring-amber-700/30',
  },
};

export default function SubscriptionPage() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<AiSubscriptionInfo | null>(null);
  const [requests, setRequests] = useState<RequestType[]>([]);
  const [plans, setPlans] = useState<PlanInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<AiPlan | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<AiBillingPeriod>('MONTHLY');

  const load = useCallback(async () => {
    try {
      const [sub, reqs, planList] = await Promise.all([
        aiSubscriptionService.getMySubscription(),
        aiSubscriptionService.getMyRequests(),
        aiSubscriptionService.getPlans(),
      ]);
      setSubscription(sub);
      setRequests(reqs);
      setPlans(planList);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  const handleApply = async () => {
    if (!selectedPlan) return;
    setApplying(true);
    try {
      await aiSubscriptionService.apply({ plan: selectedPlan, billingPeriod });
      toast.success('申请已提交，请等待管理员审批');
      setSelectedPlan(null);
      load();
    } catch (err: any) {
      toast.error(err.message || '申请失败');
    } finally {
      setApplying(false);
    }
  };

  const handleCancel = async () => {
    try {
      await aiSubscriptionService.cancel();
      toast.success('订阅已取消');
      load();
    } catch (err: any) {
      toast.error(err.message || '取消失败');
    }
  };

  if (!user) return null;

  const hasPending = requests.some((r) => r.status === 'PENDING');

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <FadeIn delay={0} y={20}>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">AI 订阅</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            选择适合你的 AI 写作助手套餐
          </p>
        </div>
      </FadeIn>

      {/* Current subscription */}
      {subscription && (
        <FadeIn delay={0.1} y={20}>
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${PLAN_CARD_STYLES[subscription.plan]?.gradient || 'from-blue-500 to-blue-600'} flex items-center justify-center`}>
                  {(() => { const Icon = PLAN_ICONS[subscription.plan]; return <Icon className="w-6 h-6 text-white" />; })()}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {subscription.planLabel}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {BILLING_LABELS[subscription.billingPeriod]} · 到期时间 {new Date(subscription.endDate).toLocaleDateString('zh-CN')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                  {STATUS_LABELS[subscription.status]}
                </span>
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  取消订阅
                </Button>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
              <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                <p className="text-gray-500 dark:text-gray-400">每日额度</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">{subscription.dailyLimit}</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                <p className="text-gray-500 dark:text-gray-400">AI 对话</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">{subscription.features.chat ? '✓' : '✗'}</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                <p className="text-gray-500 dark:text-gray-400">Copilot</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">{subscription.features.copilot ? '✓' : '✗'}</p>
              </div>
            </div>
          </div>
        </FadeIn>
      )}

      {/* Plan cards */}
      {!subscription && (
        <FadeIn delay={0.1} y={20}>
          {/* Billing period toggle */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              {(['MONTHLY', 'YEARLY'] as AiBillingPeriod[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setBillingPeriod(p)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    billingPeriod === p
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {BILLING_LABELS[p]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
            {plans.map((plan) => {
              const Icon = PLAN_ICONS[plan.plan] || Sparkles;
              const style = PLAN_CARD_STYLES[plan.plan] || PLAN_CARD_STYLES.BASIC;
              const isSelected = selectedPlan === plan.plan;
              const isMax = plan.plan === 'MAX';
              const isVip = plan.plan === 'VIP';
              const dailyLimit = billingPeriod === 'YEARLY' ? plan.dailyLimit.yearly : plan.dailyLimit.monthly;

              return (
                <div
                  key={plan.plan}
                  onClick={() => !hasPending && setSelectedPlan(plan.plan)}
                  className={`relative rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? style.selectedBorder
                      : `${style.border} hover:border-gray-300 dark:hover:border-gray-600`
                  } ${style.bg} ${style.shadow || ''} ${style.ring || ''} ${isMax ? 'md:-mt-2 md:mb-2' : ''}`}
                >
                  <div className={`p-6 ${isMax ? 'pb-7' : ''}`}>
                    {/* Icon + Title + Badge */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${style.gradient} flex items-center justify-center shadow-sm ${isMax ? 'w-12 h-12' : ''}`}>
                        <Icon className={`text-white ${isMax ? 'w-6 h-6' : 'w-5 h-5'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className={`font-bold text-gray-900 dark:text-gray-100 ${isMax ? 'text-xl' : 'text-lg'}`}>
                            {plan.label}
                          </h3>
                          {style.badge && (
                            <span className={`px-2 py-0.5 text-[10px] font-bold text-white rounded-full bg-gradient-to-r ${style.gradient}`}>
                              {style.badge}
                            </span>
                          )}
                        </div>
                        {isMax && <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">优先模型 · 极速响应</p>}
                        {isVip && <p className="text-xs text-violet-600 dark:text-violet-400 font-medium">全功能解锁</p>}
                      </div>
                    </div>

                    {/* Quota */}
                    <div className={`rounded-xl p-4 mb-4 ${isMax ? 'bg-amber-50/80 dark:bg-amber-900/10' : isVip ? 'bg-violet-50/80 dark:bg-violet-900/10' : 'bg-gray-50 dark:bg-gray-700/30'}`}>
                      <p className={`font-bold ${isMax ? 'text-4xl text-amber-700 dark:text-amber-400' : isVip ? 'text-3xl text-violet-700 dark:text-violet-400' : 'text-3xl text-gray-900 dark:text-gray-100'}`}>
                        {dailyLimit}
                        <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">次/天</span>
                      </p>
                      {billingPeriod === 'YEARLY' && (
                        <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">年付专享额度翻倍</p>
                      )}
                    </div>

                    {/* Features */}
                    <ul className="space-y-2.5 text-sm">
                      {plan.commands.filter((c) => c !== 'chat').map((cmd) => (
                        <li key={cmd} className="flex items-center gap-2.5 text-gray-700 dark:text-gray-300">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${isMax ? 'bg-amber-100 dark:bg-amber-900/30' : isVip ? 'bg-violet-100 dark:bg-violet-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                            <Check className={`w-3 h-3 ${isMax ? 'text-amber-600 dark:text-amber-400' : isVip ? 'text-violet-600 dark:text-violet-400' : 'text-blue-600 dark:text-blue-400'}`} />
                          </div>
                          {cmd === 'continue' && '续写'}
                          {cmd === 'polish' && '润色/修正'}
                          {cmd === 'translate' && '翻译'}
                          {cmd === 'summary' && '摘要'}
                          {cmd === 'custom' && '自定义指令'}
                          {cmd === 'autocomplete' && 'Copilot 行内补全'}
                        </li>
                      ))}
                      <li className="flex items-center gap-2.5">
                        {plan.features.chat ? (
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${isMax ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-violet-100 dark:bg-violet-900/30'}`}>
                            <Check className={`w-3 h-3 ${isMax ? 'text-amber-600 dark:text-amber-400' : 'text-violet-600 dark:text-violet-400'}`} />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                            <X className="w-3 h-3 text-gray-300 dark:text-gray-600" />
                          </div>
                        )}
                        <span className={plan.features.chat ? 'text-gray-700 dark:text-gray-300' : 'text-gray-300 dark:text-gray-600'}>
                          AI 对话侧栏
                        </span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        {plan.features.copilot ? (
                          <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                            <X className="w-3 h-3 text-gray-300 dark:text-gray-600" />
                          </div>
                        )}
                        <span className={plan.features.copilot ? 'text-gray-700 dark:text-gray-300' : 'text-gray-300 dark:text-gray-600'}>
                          Copilot 行内补全
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Apply button */}
          <div className="flex justify-center mt-6">
            {hasPending ? (
              <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                <Clock className="w-4 h-4" />
                你有一个待审批的申请，请等待管理员处理
              </div>
            ) : (
              <Button onClick={handleApply} disabled={!selectedPlan || applying} size="lg">
                {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {applying ? '提交中...' : selectedPlan ? `申请 ${PLAN_LABELS[selectedPlan]}` : '请选择套餐'}
              </Button>
            )}
          </div>
        </FadeIn>
      )}

      {/* Request history */}
      {requests.length > 0 && (
        <FadeIn delay={0.2} y={20}>
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">申请历史</h3>
            <div className="space-y-3">
              {requests.map((req) => (
                <div key={req.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div className="flex items-center gap-3">
                    <CalendarDays className="w-4 h-4 text-gray-400" />
                    <div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {PLAN_LABELS[req.plan]} · {BILLING_LABELS[req.billingPeriod]}
                      </span>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(req.createdAt).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    req.status === 'PENDING' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                    req.status === 'APPROVED' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                    'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  }`}>
                    {REQUEST_STATUS_LABELS[req.status]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      )}
    </div>
  );
}
