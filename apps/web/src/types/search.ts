export interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  spaceId: string;
  spaceName: string;
  updatedAt: string;
}

export interface SearchResponse {
  data: SearchResult[];
  total: number;
  page: number;
  limit: number;
}
