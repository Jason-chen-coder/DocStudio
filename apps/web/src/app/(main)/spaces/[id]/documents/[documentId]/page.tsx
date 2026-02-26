'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { documentService } from '@/services/document-service';
import { Document } from '@/types/document';
import { Editor } from '@/components/editor/editor';
import { ShareDialog } from '@/components/share/share-dialog';
import { toast } from 'sonner';

// Simple debounce function
function useDebounce<T extends (...args: any[]) => any>(callback: T, delay: number) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
}

export default function DocumentPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.documentId as string;

  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [isPreview, setIsPreview] = useState(false);

  // Status for auto-save
  const [status, setStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  useEffect(() => {
    async function loadDocument() {
      try {
        setLoading(true);
        const data = await documentService.getDocument(documentId);
        setDocument(data);
        setTitle(data.title);
      } catch (error) {
        console.error('Failed to load document', error);
        toast.error('无法加载文档');
      } finally {
        setLoading(false);
      }
    }

    if (documentId) {
      loadDocument();
    }
  }, [documentId]);

  const saveDocument = async (updates: { title?: string; content?: string }) => {
    if (!documentId) return;
    setStatus('saving');
    try {
      await documentService.updateDocument(documentId, updates);
      setStatus('saved');

      // If title updated, notify sidebar to refresh
      if (updates.title) {
        window.dispatchEvent(new Event('document-updated'));
      }
    } catch (error) {
      console.error('Failed to save document', error);
      setStatus('error');
      // toast.error('自动保存失败'); // Maybe too annoying
    }
  };

  const debouncedSave = useDebounce(saveDocument, 1000);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    debouncedSave({ title: newTitle });
  };

  const handleContentUpdate = (newContent: string) => {
    debouncedSave({ content: newContent });
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-400">加载中...</div>;
  }

  if (!document) {
    return <div className="p-8 text-center text-gray-400">文档不存在</div>;
  }

  return (
    <div className="mx-auto py-8 px-4 sm:px-6 lg:px-8 h-full flex flex-col bg-white rounded-lg">
      {/* Header / Meta */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex-1 flex items-center gap-2">
          <button
            onClick={() => {
              const spaceId = params.id as string;
              router.push(`/spaces/${spaceId}`);
            }}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:text-gray-200 dark:hover:bg-gray-800 rounded-lg transition"
            title="返回空间"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="无标题"
            disabled={isPreview}
            className="w-full text-4xl font-bold text-gray-900 dark:text-gray-100 bg-transparent border-none focus:ring-0 placeholder-gray-300 dark:placeholder-gray-600 px-0 disabled:opacity-50"
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-400 min-w-[60px] text-right">
            {status === 'saving' && '保存中...'}
            {status === 'saved' && '已保存'}
            {status === 'error' && <span className="text-red-500">保存失败</span>}
          </div>
          <ShareDialog documentId={documentId} />
          <button
            onClick={() => setIsPreview(!isPreview)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${isPreview
              ? 'text-white bg-blue-600 border border-blue-600 hover:bg-blue-700'
              : 'text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 dark:text-blue-300 dark:bg-blue-950/40 dark:border-blue-800 dark:hover:bg-blue-900/50'
              }`}
          >
            {isPreview ? '编辑' : '预览'}
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="min-h-[500px] flex-1">
        <Editor
          initialContent={document.content || ''}
          onUpdate={handleContentUpdate}
          editable={!isPreview}
        />
      </div>
    </div>
  );
}
