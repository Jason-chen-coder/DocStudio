import { apiRequest } from '@/lib/api';
import type { SearchResponse } from '@/types/search';

export const searchService = {
  search(
    query: string,
    page = 1,
    limit = 20,
    signal?: AbortSignal,
  ): Promise<SearchResponse> {
    const params = new URLSearchParams({
      q: query,
      page: String(page),
      limit: String(limit),
    });
    return apiRequest<SearchResponse>(`/search?${params.toString()}`, {
      signal,
    });
  },
};
