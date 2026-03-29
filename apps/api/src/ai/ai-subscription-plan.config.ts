/**
 * AI 订阅套餐配置常量
 * 定义每个套餐的功能范围、配额和模型
 */

export const PLAN_COMMANDS: Record<string, string[]> = {
  BASIC: ['continue', 'polish', 'longer', 'shorter'],
  VIP: ['continue', 'polish', 'longer', 'shorter', 'translate', 'summary', 'custom', 'chat'],
  MAX: ['continue', 'polish', 'longer', 'shorter', 'translate', 'summary', 'custom', 'chat'],
};

export const PLAN_FEATURES: Record<string, { chat: boolean; copilot: boolean }> = {
  BASIC: { chat: false, copilot: false },
  VIP: { chat: true, copilot: false },
  MAX: { chat: true, copilot: false },
};

/** 月付每日额度 */
export const PLAN_DAILY_LIMITS_MONTHLY: Record<string, number> = {
  BASIC: 30,
  VIP: 100,
  MAX: 500,
};

/** 年付每日额度（年付享额度翻倍） */
export const PLAN_DAILY_LIMITS_YEARLY: Record<string, number> = {
  BASIC: 60,
  VIP: 200,
  MAX: 1000,
};

/** 根据套餐和计费周期获取每日额度 */
export function getPlanDailyLimit(plan: string, billingPeriod: string): number {
  if (billingPeriod === 'YEARLY') {
    return PLAN_DAILY_LIMITS_YEARLY[plan] || PLAN_DAILY_LIMITS_MONTHLY[plan] || 30;
  }
  return PLAN_DAILY_LIMITS_MONTHLY[plan] || 30;
}

/** Priority model override per plan (null = use default from config) */
export const PLAN_MODELS: Record<string, string | null> = {
  BASIC: null,
  VIP: null,
  MAX: 'gpt-4o',
};

export const PLAN_LABELS: Record<string, string> = {
  BASIC: '普通订阅',
  VIP: 'VIP 订阅',
  MAX: 'Max 订阅',
};
