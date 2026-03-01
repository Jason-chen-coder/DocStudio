import { Space } from '@/types/space';
import { Document } from '@/types/document';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function fetchPublic(endpoint: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
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
      console.error(`Public API Error (${response.status}):`, errorData);
    } catch (_e) {
      console.error(`Public API Error (${response.status}): Failed to parse error response`);
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export const publicService = {
  async getPublicSpaces(page: number = 1, limit: number = 20, search?: string): Promise<{ data: Space[]; total: number; page: number; limit: number; totalPages: number }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (search) params.append('search', search);

    return fetchPublic(`/public/spaces?${params.toString()}`);
  },

  async getPublicSpace(id: string): Promise<Space> {
    return fetchPublic(`/public/spaces/${id}`);
  },

  async getPublicSpaceDocumentTree(id: string): Promise<Document[]> {
    return fetchPublic(`/public/spaces/${id}/docs/tree`);
  },

  async getPublicDocument(id: string): Promise<Document> {
    return fetchPublic(`/public/docs/${id}`);
  }
};
