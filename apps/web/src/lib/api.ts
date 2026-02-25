// API 基础配置
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// 获取 token
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

// 设置 token
export function setToken(token: string): void {
  localStorage.setItem('access_token', token);
}

// 清除 token
export function clearToken(): void {
  localStorage.removeItem('access_token');
}

// API 请求封装
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  
  const headers: HeadersInit = {
    ...options.headers,
  };

  // 只有当 body 存在且不是 FormData 时才设置 Content-Type 为 application/json
  if (options.body && !(options.body instanceof FormData)) {
    // 检查 options.headers 里是否已经手动设置了 Content-Type
    const hasContentType = Object.keys(options.headers || {}).some(
      key => key.toLowerCase() === 'content-type'
    );
    
    if (!hasContentType) {
      (headers as any)['Content-Type'] = 'application/json';
    }
  }

  if (token && !(headers as any)['Authorization']) {
    (headers as any)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    // 尝试解析错误信息，如果解析失败（非 JSON），则使用默认错误
    const error = await response.json().catch(() => ({ message: '请求失败' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  // 对于 204 No Content，直接返回 null
  if (response.status === 204) {
    return null as any;
  }

  return response.json();
}

// Convenience wrapper matching axios-like usage or previous assumptions
export const api = {
  get: <T = any>(endpoint: string, options?: RequestInit) => apiRequest<T>(endpoint, { ...options, method: 'GET' }),
  post: <T = any>(endpoint: string, data?: any, options?: RequestInit) => apiRequest<T>(endpoint, { ...options, method: 'POST', body: JSON.stringify(data) }),
  put: <T = any>(endpoint: string, data?: any, options?: RequestInit) => apiRequest<T>(endpoint, { ...options, method: 'PUT', body: JSON.stringify(data) }),
  patch: <T = any>(endpoint: string, data?: any, options?: RequestInit) => apiRequest<T>(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(data) }),
  delete: <T = any>(endpoint: string, options?: RequestInit) => apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};

// Auth API
export interface RegisterData {
  email: string;
  name: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  isSuperAdmin: boolean;
  isDisabled: boolean;
  createdAt: string;
}

export const authAPI = {
  register: (data: RegisterData) =>
    apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: LoginData) =>
    apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMe: () => apiRequest<User>('/auth/me'),
  
  changePassword: (data: ChangePasswordData) =>
    apiRequest<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiRequest<User>('/users/avatar', {
      method: 'POST',
      body: formData,
    });
  }
};

// ─── Admin API ─────────────────────────────────────────────────────────────────
export interface AdminUserItem {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  isSuperAdmin: boolean;
  isDisabled: boolean;
  createdAt: string;
  updatedAt: string;
  spaceCount: number;
  documentCount: number;
}

export interface AdminUserDetail extends AdminUserItem {
  spaces: { id: string; name: string; role: string }[];
}

export interface AdminUsersResponse {
  data: AdminUserItem[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminSpaceItem {
  id: string;
  name: string;
  memberCount: number;
}

export interface AdminUserQuery {
  page?: number;
  limit?: number;
  search?: string;
  spaceId?: string;
}

export const adminAPI = {
  getUsers: (query: AdminUserQuery = {}) => {
    const params = new URLSearchParams();
    if (query.page) params.set('page', String(query.page));
    if (query.limit) params.set('limit', String(query.limit));
    if (query.search) params.set('search', query.search);
    if (query.spaceId) params.set('spaceId', query.spaceId);
    return apiRequest<AdminUsersResponse>(`/admin/users?${params.toString()}`);
  },

  getUserById: (userId: string) =>
    apiRequest<AdminUserDetail>(`/admin/users/${userId}`),

  updatePassword: (userId: string, newPassword: string) =>
    apiRequest<{ message: string }>(`/admin/users/${userId}/password`, {
      method: 'PATCH',
      body: JSON.stringify({ newPassword }),
    }),

  updateStatus: (userId: string, isDisabled: boolean) =>
    apiRequest<{ message: string; isDisabled: boolean }>(
      `/admin/users/${userId}/status`,
      { method: 'PATCH', body: JSON.stringify({ isDisabled }) },
    ),

  deleteUser: (userId: string) =>
    apiRequest<{ message: string }>(`/admin/users/${userId}`, {
      method: 'DELETE',
    }),

  getSpaces: (search?: string) => {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    return apiRequest<AdminSpaceItem[]>(`/admin/spaces${params}`);
  },
};
