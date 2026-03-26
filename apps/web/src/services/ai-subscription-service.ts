import { apiRequest } from '@/lib/api';
import type { AiPlan, AiBillingPeriod, AiSubStatus, AiRequestStatus } from '@/config/ai-subscription';

// ── Types ──

export interface AiSubscriptionInfo {
  id: string;
  userId: string;
  plan: AiPlan;
  billingPeriod: AiBillingPeriod;
  status: AiSubStatus;
  startDate: string;
  endDate: string;
  features: { chat: boolean; copilot: boolean };
  allowedCommands: string[];
  dailyLimit: number;
  planLabel: string;
}

export interface AiSubscriptionRequest {
  id: string;
  userId: string;
  plan: AiPlan;
  billingPeriod: AiBillingPeriod;
  status: AiRequestStatus;
  reason?: string;
  rejectReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  user?: { id: string; name: string; email: string; avatarUrl?: string };
}

export interface AiSubscriptionRecord {
  id: string;
  userId: string;
  plan: AiPlan;
  billingPeriod: AiBillingPeriod;
  status: AiSubStatus;
  startDate: string;
  endDate: string;
  user?: { id: string; name: string; email: string; avatarUrl?: string };
}

export interface PlanInfo {
  plan: AiPlan;
  label: string;
  commands: string[];
  features: { chat: boolean; copilot: boolean };
  dailyLimit: { monthly: number; yearly: number };
}

interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// ── Service ──

export const aiSubscriptionService = {
  // User
  getMySubscription(): Promise<AiSubscriptionInfo | null> {
    return apiRequest<AiSubscriptionInfo | null>('/ai/subscription');
  },

  getMyRequests(): Promise<AiSubscriptionRequest[]> {
    return apiRequest<AiSubscriptionRequest[]>('/ai/subscription/requests');
  },

  apply(data: { plan: AiPlan; billingPeriod: AiBillingPeriod; reason?: string }): Promise<AiSubscriptionRequest> {
    return apiRequest<AiSubscriptionRequest>('/ai/subscription/apply', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  cancel(): Promise<void> {
    return apiRequest('/ai/subscription/cancel', { method: 'POST' });
  },

  getPlans(): Promise<PlanInfo[]> {
    return apiRequest<PlanInfo[]>('/ai/subscription/plans');
  },

  // Admin
  getPendingRequests(page = 1, limit = 20): Promise<Paginated<AiSubscriptionRequest>> {
    return apiRequest<Paginated<AiSubscriptionRequest>>(
      `/ai/subscription/admin/requests?page=${page}&limit=${limit}`,
    );
  },

  approveRequest(id: string): Promise<void> {
    return apiRequest(`/ai/subscription/admin/requests/${id}/approve`, { method: 'POST' });
  },

  rejectRequest(id: string, reason?: string): Promise<void> {
    return apiRequest(`/ai/subscription/admin/requests/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  getAllSubscriptions(query?: {
    status?: string;
    plan?: string;
    page?: number;
    limit?: number;
  }): Promise<Paginated<AiSubscriptionRecord>> {
    const params = new URLSearchParams();
    if (query?.status) params.set('status', query.status);
    if (query?.plan) params.set('plan', query.plan);
    if (query?.page) params.set('page', String(query.page));
    if (query?.limit) params.set('limit', String(query.limit));
    return apiRequest<Paginated<AiSubscriptionRecord>>(
      `/ai/subscription/admin/subscriptions?${params}`,
    );
  },

  revokeSubscription(id: string): Promise<void> {
    return apiRequest(`/ai/subscription/admin/subscriptions/${id}`, { method: 'DELETE' });
  },
};
