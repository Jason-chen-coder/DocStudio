/**
 * AI 订阅套餐配置（前端版本，与后端 ai-subscription-plan.config.ts 保持一致）
 */

export type AiPlan = 'BASIC' | 'VIP' | 'MAX';
export type AiBillingPeriod = 'MONTHLY' | 'YEARLY';
export type AiSubStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
export type AiRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export const PLAN_COMMANDS: Record<AiPlan, string[]> = {
  BASIC: ['continue', 'polish', 'longer', 'shorter'],
  VIP: ['continue', 'polish', 'longer', 'shorter', 'translate', 'summary', 'custom', 'chat'],
  MAX: ['continue', 'polish', 'longer', 'shorter', 'translate', 'summary', 'custom', 'autocomplete', 'chat'],
};

export const PLAN_FEATURES: Record<AiPlan, { chat: boolean; copilot: boolean }> = {
  BASIC: { chat: false, copilot: false },
  VIP: { chat: true, copilot: false },
  MAX: { chat: true, copilot: true },
};

export const PLAN_DAILY_LIMITS: Record<AiPlan, { monthly: number; yearly: number }> = {
  BASIC: { monthly: 30, yearly: 60 },
  VIP: { monthly: 100, yearly: 200 },
  MAX: { monthly: 500, yearly: 1000 },
};

export const PLAN_LABELS: Record<AiPlan, string> = {
  BASIC: '普通订阅',
  VIP: 'VIP 订阅',
  MAX: 'Max 订阅',
};

export const BILLING_LABELS: Record<AiBillingPeriod, string> = {
  MONTHLY: '月付',
  YEARLY: '年付',
};

export const STATUS_LABELS: Record<AiSubStatus, string> = {
  ACTIVE: '生效中',
  EXPIRED: '已到期',
  CANCELLED: '已取消',
};

export const REQUEST_STATUS_LABELS: Record<AiRequestStatus, string> = {
  PENDING: '待审批',
  APPROVED: '已通过',
  REJECTED: '已拒绝',
};
