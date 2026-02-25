import { apiRequest } from '@/lib/api';
import { CreateDocumentDto, Document, UpdateDocumentDto } from '@/types/document';

export const documentService = {
  async getDocuments(spaceId: string): Promise<Document[]> {
    return apiRequest<Document[]>(`/documents?spaceId=${spaceId}`, { cache: 'no-store' });
  },

  async getDocument(id: string): Promise<Document> {
    return apiRequest<Document>(`/documents/${id}`);
  },

  async createDocument(data: CreateDocumentDto): Promise<Document> {
    return apiRequest<Document>('/documents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateDocument(id: string, data: UpdateDocumentDto): Promise<Document> {
    return apiRequest<Document>(`/documents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteDocument(id: string): Promise<void> {
    return apiRequest<void>(`/documents/${id}`, {
      method: 'DELETE',
    });
  },
};
