'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Crown, Zap, Check, X, Lock } from 'lucide-react';

interface AiUpgradeModalProps {
  open: boolean;
  onClose: () => void;
  /** true = user has a subscription but the command exceeds their plan */
  isPlanLimit?: boolean;
}

const PLANS = [
  {
    key: 'BASIC',
    label: '普通订阅',
    icon: Sparkles,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    features: ['续写 / 润色 / 扩写 / 缩写', '每日 30 次 AI 操作'],
    missing: ['翻译 / 摘要 / 自定义指令', 'AI 对话侧栏'],
  },
  {
    key: 'VIP',
    label: 'VIP 订阅',
    icon: Crown,
    color: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-50 dark:bg-violet-900/20',
    badge: '热门',
    badgeColor: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300',
    features: ['全部基础指令', '翻译 / 摘要 / 自定义指令', 'AI 对话侧栏', '每日 100 次 AI 操作'],
    missing: [],
  },
  {
    key: 'MAX',
    label: 'Max 订阅',
    icon: Zap,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    badge: '旗舰',
    badgeColor: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
    features: ['全部 VIP 功能', 'AI 对话侧栏', '每日 500 次 AI 操作'],
    missing: [],
  },
];

export function AiUpgradeModal({ open, onClose, isPlanLimit }: AiUpgradeModalProps) {
  const router = useRouter();
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onMouseDown={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        style={{ animation: 'aiModalIn 0.18s ease-out' }}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="关闭"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="px-8 pt-8 pb-6 text-center border-b border-gray-100 dark:border-gray-800">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-violet-50 dark:bg-violet-900/20 mb-4">
            <Lock className="w-6 h-6 text-violet-600 dark:text-violet-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {isPlanLimit ? '升级套餐，解锁更多 AI 功能' : '订阅 AI 写作助手'}
          </h2>
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
            {isPlanLimit
              ? '当前套餐不支持此功能，升级后即可使用'
              : '订阅后即可在编辑器中使用 AI 续写、润色、翻译、对话等功能'}
          </p>
        </div>

        {/* Plan comparison */}
        <div className="px-8 py-6 grid grid-cols-3 gap-4">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.key}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${plan.bg}`}>
                    <Icon className={`w-4 h-4 ${plan.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                        {plan.label}
                      </span>
                      {plan.badge && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${plan.badgeColor}`}>
                          {plan.badge}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <ul className="space-y-1.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-1.5 text-xs text-gray-700 dark:text-gray-300">
                      <Check className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${plan.color}`} />
                      <span>{f}</span>
                    </li>
                  ))}
                  {plan.missing.map((f) => (
                    <li key={f} className="flex items-start gap-1.5 text-xs text-gray-400 dark:text-gray-600 line-through">
                      <X className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="px-8 pb-7 flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={() => { onClose(); router.push('/subscription'); }}
            className="w-full sm:flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold transition-colors shadow-sm"
          >
            查看订阅套餐
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            稍后再说
          </button>
        </div>
      </div>

      <style>{`
        @keyframes aiModalIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
