import { useState, useCallback, useEffect } from 'react';
import { Document, CreateDocumentDto, MoveDocumentDto, UpdateDocumentDto } from '@/types/document';
import { documentService } from '@/services/document-service';
import { toast } from 'sonner';
import { useRouter, useParams } from 'next/navigation';

export function useDocuments(spaceId: string) {
  const router = useRouter();
  const params = useParams();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDocuments = useCallback(async (background = false) => {
    if (!spaceId) return;
    try {
      if (!background) {
        setLoading(true);
      }
      const data = await documentService.getDocuments(spaceId);
      setDocuments(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err as Error);
      toast.error('获取文档列表失败');
    } finally {
      if (!background) {
        setLoading(false);
      }
    }
  }, [spaceId]);

  useEffect(() => {
    fetchDocuments();

    const handleDocumentUpdate = () => {
      fetchDocuments(true);
    };

    window.addEventListener('document-updated', handleDocumentUpdate);
    return () => {
      window.removeEventListener('document-updated', handleDocumentUpdate);
    };
  }, [fetchDocuments]);

  const createDocument = async (data: CreateDocumentDto) => {
    try {
      const newDoc = await documentService.createDocument(data);
      setDocuments((prev) => [...prev, newDoc]);
      toast.success('文档创建成功');
      return newDoc;
    } catch (err) {
      console.error(err);
      toast.error('创建文档失败');
      throw err;
    }
  };

  const updateDocument = async (id: string, data: UpdateDocumentDto) => {
    try {
      const updatedDoc = await documentService.updateDocument(id, data);
      setDocuments((prev) =>
        prev.map((doc) => (doc.id === id ? updatedDoc : doc))
      );
      toast.success('文档更新成功');
      return updatedDoc;
    } catch (err) {
      console.error(err);
      toast.error('更新文档失败');
      throw err;
    }
  };

  /**
   * 移动文档（拖拽排序）
   * 使用乐观更新：先立即更新本地状态，API 失败则回滚
   */
  const moveDocument = async (id: string, data: MoveDocumentDto) => {
    // 记录回滚点
    const prevDocuments = documents;

    // 乐观更新本地状态
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === id
          ? { ...doc, parentId: data.parentId, order: data.order }
          : doc
      )
    );

    try {
      await documentService.moveDocument(id, data);
    } catch (err) {
      // 失败则回滚
      console.error(err);
      setDocuments(prevDocuments);
      toast.error('移动文档失败');
      throw err;
    }
  };

  const deleteDocument = async (id: string) => {
    try {
      await documentService.deleteDocument(id);
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
      toast.success('文档删除成功');

      // If the deleted document is the current one, redirect to space home
      if (params?.documentId === id) {
        router.push(`/spaces/${spaceId}`);
      }
    } catch (err) {
      console.error(err);
      toast.error('删除文档失败');
      throw err;
    }
  };

  return {
    documents,
    loading,
    error,
    refresh: fetchDocuments,
    createDocument,
    updateDocument,
    moveDocument,
    deleteDocument,
  };
}
