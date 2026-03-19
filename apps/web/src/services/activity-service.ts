import { apiRequest } from '@/lib/api';

// ==================== Types ====================

export interface RecentDocument {
  documentId: string;
  title: string;
  spaceId: string;
  spaceName: string;
  updatedAt: string;
  lastVisitAt: string;
  visitCount: number;
  creator: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

export interface ActivityLogItem {
  id: string;
  userId: string;
  action: ActivityAction;
  entityType: EntityType;
  entityId: string;
  entityName?: string;
  spaceId?: string;
  spaceName?: string;
  metadata?: Record<string, any> | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

export interface ActivityListResponse {
  data: ActivityLogItem[];
  total: number;
  page: number;
  limit: number;
}

export type ActivityAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'VIEW'
  | 'MOVE'
  | 'RESTORE'
  | 'SHARE'
  | 'JOIN'
  | 'LEAVE'
  | 'INVITE'
  | 'ROLE_CHANGE';

export type EntityType =
  | 'DOCUMENT'
  | 'SPACE'
  | 'SNAPSHOT'
  | 'SHARE_LINK'
  | 'MEMBER';

// ==================== Service ====================

export const activityService = {
  /**
   * 获取最近访问的文档（分页）
   */
  async getRecentDocuments(
    page = 1,
    limit = 20,
  ): Promise<{ data: RecentDocument[]; total: number }> {
    return apiRequest<{ data: RecentDocument[]; total: number }>(
      `/activity/recent-documents?limit=${limit}&page=${page}`,
    );
  },

  /**
   * 获取当前用户的活动流
   */
  async getMyActivity(
    page = 1,
    limit = 30,
  ): Promise<ActivityListResponse> {
    return apiRequest<ActivityListResponse>(
      `/activity/my?page=${page}&limit=${limit}`,
    );
  },

  /**
   * 获取空间内的活动流
   */
  async getSpaceActivity(
    spaceId: string,
    page = 1,
    limit = 30,
  ): Promise<ActivityListResponse> {
    return apiRequest<ActivityListResponse>(
      `/activity/space/${spaceId}?page=${page}&limit=${limit}`,
    );
  },
};
