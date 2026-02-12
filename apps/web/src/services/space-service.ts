import { CreateSpaceDto, InvitationResponse, InviteMemberDto, Role, Space, SpaceMember, UpdateSpaceDto } from '@/types/space';
import { getToken } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = getToken();
  const headers = new Headers(options.headers);
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  // Only set Content-Type: application/json if there is a body and it's not already set
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = 'Something went wrong';
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
      console.error(`API Error (${response.status}):`, errorData);
    } catch (_e) {
      console.error(`API Error (${response.status}): Failed to parse error response`);
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export const spaceService = {
  async getMySpaces(): Promise<Space[]> {
    return fetchWithAuth('/spaces', { cache: 'no-store' });
  },

  async getSpace(id: string): Promise<Space> {
    return fetchWithAuth(`/spaces/${id}`);
  },

  async createSpace(data: CreateSpaceDto): Promise<Space> {
    return fetchWithAuth('/spaces', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateSpace(id: string, data: UpdateSpaceDto): Promise<Space> {
    return fetchWithAuth(`/spaces/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteSpace(id: string): Promise<void> {
    return fetchWithAuth(`/spaces/${id}`, {
      method: 'DELETE',
    });
  },

  // Member Management
  async getMembers(id: string): Promise<SpaceMember[]> {
    return fetchWithAuth(`/spaces/${id}/members`);
  },

  async updateMemberRole(spaceId: string, userId: string, role: Role): Promise<void> {
    return fetchWithAuth(`/spaces/${spaceId}/members/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
    });
  },

  async removeMember(spaceId: string, userId: string): Promise<void> {
      return fetchWithAuth(`/spaces/${spaceId}/members/${userId}`, {
          method: 'DELETE',
      });
  },

  async inviteMember(spaceId: string, data: InviteMemberDto): Promise<InvitationResponse> {
      return fetchWithAuth(`/spaces/${spaceId}/invitations`, {
          method: 'POST',
          body: JSON.stringify(data),
      });
  },

  async joinSpace(token: string): Promise<{ message: string; spaceId: string }> {
      return fetchWithAuth(`/spaces/join`, {
          method: 'POST',
          body: JSON.stringify({ token }),
      });
  },
};
