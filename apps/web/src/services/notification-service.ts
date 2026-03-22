import { apiRequest, getToken } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ─── Types ──────────────────────────────────────────────────────────────────

export type NotificationType =
  | 'SPACE_INVITATION'
  | 'INVITATION_ACCEPTED'
  | 'MEMBER_JOINED'
  | 'MEMBER_REMOVED'
  | 'ROLE_CHANGED'
  | 'DOCUMENT_COMMENTED'
  | 'DOCUMENT_MENTIONED'
  | 'DOCUMENT_SHARED'
  | 'DOCUMENT_UPDATED'
  | 'SPACE_DELETED'
  | 'SYSTEM';

export interface Notification {
  id: string;
  recipientId: string;
  type: NotificationType;
  title: string;
  content: string | null;
  isRead: boolean;
  entityType: string | null;
  entityId: string | null;
  spaceId: string | null;
  actorId: string | null;
  actorName: string | null;
  metadata: Record<string, any> | null;
  createdAt: string;
}

export interface NotificationListResponse {
  data: Notification[];
  total: number;
  page: number;
  limit: number;
}

// ─── API Service ────────────────────────────────────────────────────────────

export const notificationService = {
  getNotifications(params: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
    type?: NotificationType;
  } = {}): Promise<NotificationListResponse> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.unreadOnly) query.set('unreadOnly', 'true');
    if (params.type) query.set('type', params.type);
    return apiRequest<NotificationListResponse>(`/notifications?${query.toString()}`);
  },

  getUnreadCount(): Promise<{ count: number }> {
    return apiRequest<{ count: number }>('/notifications/unread-count');
  },

  markAsRead(id: string): Promise<void> {
    return apiRequest(`/notifications/${id}/read`, { method: 'PATCH' });
  },

  markAllAsRead(): Promise<void> {
    return apiRequest('/notifications/read-all', { method: 'PATCH' });
  },

  deleteNotification(id: string): Promise<void> {
    return apiRequest(`/notifications/${id}`, { method: 'DELETE' });
  },

  clearRead(): Promise<void> {
    return apiRequest('/notifications/clear-read', { method: 'DELETE' });
  },

  getPreferences(): Promise<Record<string, boolean>> {
    return apiRequest<Record<string, boolean>>('/notifications/preferences');
  },

  updatePreferences(preferences: Record<string, boolean>): Promise<void> {
    return apiRequest('/notifications/preferences', {
      method: 'PUT',
      body: JSON.stringify({ preferences }),
    });
  },

  /**
   * 创建 SSE 连接
   */
  createSSEConnection(): EventSource | null {
    const token = getToken();
    if (!token) return null;
    return new EventSource(`${API_URL}/notifications/sse?token=${token}`);
  },
};
