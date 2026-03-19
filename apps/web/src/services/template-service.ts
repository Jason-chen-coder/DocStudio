import { apiRequest } from '@/lib/api';
import type {
  DocumentTemplate,
  TemplateListItem,
  CreateTemplateDto,
  SaveAsTemplateDto,
  TemplateCategory,
  TemplateScope,
} from '@/types/template';

interface QueryParams {
  spaceId?: string;
  category?: TemplateCategory;
  scope?: TemplateScope;
}

export const templateService = {
  /** List templates (no content field). Merges SYSTEM + SPACE + USER. */
  async getTemplates(query: QueryParams = {}): Promise<TemplateListItem[]> {
    const params = new URLSearchParams();
    if (query.spaceId) params.set('spaceId', query.spaceId);
    if (query.category) params.set('category', query.category);
    if (query.scope) params.set('scope', query.scope);
    const qs = params.toString();
    return apiRequest<TemplateListItem[]>(`/templates${qs ? `?${qs}` : ''}`);
  },

  /** Get full template detail (with content). */
  async getTemplate(id: string): Promise<DocumentTemplate> {
    return apiRequest<DocumentTemplate>(`/templates/${id}`);
  },

  /** Create a new template. */
  async createTemplate(data: CreateTemplateDto): Promise<DocumentTemplate> {
    return apiRequest<DocumentTemplate>('/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /** Update an existing template. */
  async updateTemplate(id: string, data: Partial<CreateTemplateDto>): Promise<DocumentTemplate> {
    return apiRequest<DocumentTemplate>(`/templates/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /** Soft-delete a template. */
  async deleteTemplate(id: string): Promise<void> {
    return apiRequest<void>(`/templates/${id}`, { method: 'DELETE' });
  },

  /** Create a template from an existing document. */
  async saveAsTemplate(documentId: string, data: SaveAsTemplateDto): Promise<DocumentTemplate> {
    return apiRequest<DocumentTemplate>(`/templates/from-document/${documentId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
