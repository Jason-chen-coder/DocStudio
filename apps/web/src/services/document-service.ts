import { apiRequest } from '@/lib/api';
import { CreateDocumentDto, Document, DocumentFavorite, MoveDocumentDto, UpdateDocumentDto } from '@/types/document';
import pako from 'pako';

export const documentService = {
  async getDocuments(spaceId: string): Promise<Document[]> {
    return apiRequest<Document[]>(`/documents?spaceId=${spaceId}`, { cache: 'no-store' });
  },

  async getDocument(id: string): Promise<Document> {
    return apiRequest<Document>(`/documents/${id}`);
  },

  /** Lightweight existence check — returns true if exists, false if 404 */
  async checkExists(id: string): Promise<boolean> {
    try {
      await apiRequest(`/documents/${id}/exists`);
      return true;
    } catch {
      return false;
    }
  },

  async createDocument(data: CreateDocumentDto): Promise<Document> {
    return apiRequest<Document>('/documents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateDocument(id: string, data: UpdateDocumentDto): Promise<Document> {
    const rawJson = JSON.stringify(data);
    
    // 如果 Payload 大于 5KB，则启用 Gzip 压缩
    if (rawJson.length > 5120) {
      const compressedData = pako.gzip(rawJson);
      return apiRequest<Document>(`/documents/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Encoding': 'gzip',
          'Content-Type': 'application/json',
        },
        body: compressedData,
      });
    }

    return apiRequest<Document>(`/documents/${id}`, {
      method: 'PATCH',
      body: rawJson,
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

  // ─── 回收站 ───

  async getTrash(spaceId: string): Promise<Document[]> {
    return apiRequest<Document[]>(`/documents/trash?spaceId=${spaceId}`, { cache: 'no-store' });
  },

  async restoreDocument(id: string): Promise<void> {
    return apiRequest<void>(`/documents/${id}/restore`, {
      method: 'POST',
    });
  },

  async permanentlyDeleteDocument(id: string): Promise<void> {
    return apiRequest<void>(`/documents/${id}/permanent`, {
      method: 'DELETE',
    });
  },

  // ─── 收藏 ───

  async getFavorites(): Promise<DocumentFavorite[]> {
    return apiRequest<DocumentFavorite[]>('/documents/favorites', { cache: 'no-store' });
  },

  async favoriteDocument(id: string): Promise<void> {
    return apiRequest<void>(`/documents/${id}/favorite`, {
      method: 'POST',
    });
  },

  async unfavoriteDocument(id: string): Promise<void> {
    return apiRequest<void>(`/documents/${id}/favorite`, {
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

  // ─── 文档权限 ───

  async setRestricted(id: string, isRestricted: boolean) {
    return apiRequest<{ id: string; isRestricted: boolean }>(`/documents/${id}/restrict`, {
      method: 'PATCH',
      body: JSON.stringify({ isRestricted }),
    });
  },

  async getDocumentPermissions(id: string) {
    return apiRequest<Array<{
      id: string;
      documentId: string;
      userId: string;
      permission: 'EDITOR' | 'VIEWER';
      user: { id: string; name: string; email: string; avatarUrl: string | null };
    }>>(`/documents/${id}/permissions`);
  },

  async setDocumentPermission(documentId: string, userId: string, permission: 'EDITOR' | 'VIEWER') {
    return apiRequest(`/documents/${documentId}/permissions/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ permission }),
    });
  },

  async removeDocumentPermission(documentId: string, userId: string) {
    return apiRequest(`/documents/${documentId}/permissions/${userId}`, {
      method: 'DELETE',
    });
  },

  // ─── 评论通知 ───

  /** 通知文档相关者有新评论（fire-and-forget） */
  async notifyComment(
    documentId: string,
    commentText: string,
    threadParticipantIds?: string[],
  ): Promise<void> {
    return apiRequest<void>(`/documents/${documentId}/comment-notify`, {
      method: 'POST',
      body: JSON.stringify({ commentText, threadParticipantIds }),
    });
  },
};
