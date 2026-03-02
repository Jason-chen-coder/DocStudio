import { apiRequest } from '@/lib/api';
import { CreateDocumentDto, Document, MoveDocumentDto, UpdateDocumentDto } from '@/types/document';

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

  async moveDocument(id: string, data: MoveDocumentDto): Promise<Document> {
    return apiRequest<Document>(`/documents/${id}/move`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteDocument(id: string): Promise<void> {
    return apiRequest<void>(`/documents/${id}`, {
      method: 'DELETE',
    });
  },

  // --- Snapshots ---
  async getSnapshots(docId: string): Promise<import('@/types/document').DocumentSnapshot[]> {
    return apiRequest<import('@/types/document').DocumentSnapshot[]>(`/documents/${docId}/snapshots`, { cache: 'no-store' });
  },

  async createSnapshot(docId: string, message?: string): Promise<import('@/types/document').DocumentSnapshot> {
    return apiRequest<import('@/types/document').DocumentSnapshot>(`/documents/${docId}/snapshots`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },

  async getSnapshot(docId: string, snapshotId: string): Promise<import('@/types/document').DocumentSnapshot> {
    return apiRequest<import('@/types/document').DocumentSnapshot>(`/documents/${docId}/snapshots/${snapshotId}`);
  },

  async restoreSnapshot(docId: string, snapshotId: string): Promise<import('@/types/document').DocumentSnapshot> {
    return apiRequest<import('@/types/document').DocumentSnapshot>(`/documents/${docId}/snapshots/${snapshotId}/restore`, {
      method: 'POST',
    });
  },
};
