'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { documentService } from '@/services/document-service';
import { spaceService } from '@/services/space-service';
import { Document } from '@/types/document';
import { Space } from '@/types/space';
import { Editor } from '@/components/editor/editor';
import { ShareDialog } from '@/components/share/share-dialog';
import { OnlineUsers } from '@/components/editor/online-users';
import { VersionHistoryPanel } from '@/components/editor/version-history-panel';
import { History } from 'lucide-react';
import type { Editor as TiptapEditor } from '@tiptap/react';
import { useAuth } from '@/lib/auth-context';
import {
  useCollaboration,
  generateUserColor,
  CollabUser,
} from '@/hooks/use-collaboration';
import { toast } from 'sonner';

// Simple debounce function
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function useDebounce<T extends (...args: any[]) => void>(callback: T, delay: number) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const run = useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return { run, cancel };
}

export default function DocumentPage() {
  const params = useParams();
  const router = useRouter();
  const { user: authUser } = useAuth();
  const documentId = params.documentId as string;
  const spaceId = params.id as string;

  const [document, setDocument] = useState<Document | null>(null);
  const [space, setSpace] = useState<Space | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Status for auto-save (title only in collab mode)
  const [status, setStatus] = useState<'saved' | 'saving' | 'error' | 'pending'>('saved');

  // Permissions
  const isReadOnly = space?.myRole === 'VIEWER';

  // Build the current user object for collaboration
  const collabUser: CollabUser | null = authUser
    ? {
      id: authUser.id,
      name: authUser.name,
      color: generateUserColor(authUser.id),
      avatarUrl: authUser.avatarUrl,
    }
    : null;

  // Initialize collaboration (requires ydocKey from document)
  const ydocKey = document?.ydocKey ?? null;

  const { ydoc, provider, connectedUsers, status: collabStatus } = useCollaboration(
    ydocKey && collabUser
      ? {
        documentId,
        ydocKey,
        currentUser: collabUser,
      }
      : null,
  );

  const isCollabReady = !!(ydocKey && ydoc && provider);

  const [isEditorReady, setIsEditorReady] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [docData, spaceData] = await Promise.all([
          documentService.getDocument(documentId),
          spaceService.getSpace(spaceId),
        ]);
        setDocument(docData);
        setTitle(docData.title);
        setSpace(spaceData);
      } catch (error) {
        console.error('Failed to load document', error);
        toast.error('无法加载文档');
      } finally {
        setLoading(false);
      }
    }

    if (documentId && spaceId) {
      loadData();
    }
  }, [documentId, spaceId]);

  const saveDocument = useCallback(async (updates: { title?: string; content?: string }) => {
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
    }
  }, [documentId]);

  const { run: debouncedSave } = useDebounce(saveDocument, 1000);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    debouncedSave({ title: newTitle });
  };

  // Content rendering and saving is now fully managed by Yjs CRDT and Hocuspocus backend.
  // We no longer need to send huge PATCH requests for every edit.

  const handleContentUpdate = () => {
    // Just sync the local editor state if needed, or trigger any non-persistence UI updates.
    // The actual state synchronization to the DB is handled implicitly by Hocuspocus WebSocket.
  };

  const editorRef = useRef<TiptapEditor | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        const updates: { title?: string } = { title };
        // Content is synced perfectly via WebSocket, so manual save only needs to sync the title
        saveDocument(updates);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [title, saveDocument]);


  if (loading) {
    return (
      <div className="mx-auto py-8 px-4 sm:px-6 lg:px-8 h-full flex flex-col bg-white rounded-lg dark:bg-gray-800">
        {/* Header Skeleton */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex-1 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg animate-pulse bg-gray-200 dark:bg-gray-800" />
            <div className="h-10 w-1/3 rounded animate-pulse bg-gray-200 dark:bg-gray-800" />
          </div>
          <div className="flex items-center gap-4">
            <div className="h-8 w-24 rounded-full animate-pulse bg-gray-200 dark:bg-gray-800" />
            <div className="h-8 w-16 rounded animate-pulse bg-gray-200 dark:bg-gray-800" />
            <div className="h-8 w-16 rounded animate-pulse bg-gray-200 dark:bg-gray-800" />
          </div>
        </div>

        {/* Editor Placeholder Skeleton */}
        <div className="flex-1 rounded-lg border border-gray-100 dark:border-gray-800 p-8 space-y-4 animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-5/6"></div>
          <div className="space-y-3 mt-8">
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-4/5"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!document) {
    return <div className="p-8 text-center text-gray-400">文档不存在</div>;
  }

  // Connection status indicator
  const statusLabel = {
    connecting: '连接中...',
    connected: '已保存',
    disconnected: '已断开',
  } as const;

  const statusColor = {
    connecting: 'text-yellow-400',
    connected: 'text-gray-400',
    disconnected: 'text-red-400',
  } as const;

  return (
    <div className="mx-auto py-8 px-4 sm:px-6 lg:px-8 h-full flex flex-col bg-white rounded-lg dark:bg-gray-800">
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
            disabled={isPreview || isReadOnly}
            className="w-full text-4xl font-bold text-gray-900 dark:text-gray-100 bg-transparent border-none focus:ring-0 placeholder-gray-300 dark:placeholder-gray-600 px-0 disabled:opacity-50"
          />
        </div>
        <div className="flex items-center gap-4">
          {/* Online users */}
          {collabUser && (
            <OnlineUsers
              users={connectedUsers}
              currentUser={collabUser}
              maxVisible={5}
            />
          )}

          {/* Save status */}
          <div className={`text-sm min-w-[60px] text-right ${isReadOnly ? 'text-gray-500 font-medium bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded' : isCollabReady ? statusColor[collabStatus] : 'text-gray-400'}`}>
            {isReadOnly ? (
              <span className="flex items-center gap-1.5"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>只读模式</span>
            ) : isCollabReady ? statusLabel[collabStatus] : (
              <>
                {status === 'pending' && '等待保存...'}
                {status === 'saving' && '保存中...'}
                {status === 'saved' && '已保存'}
                {status === 'error' && <span className="text-red-500">保存失败</span>}
              </>
            )}
          </div>

          <ShareDialog documentId={documentId} />

          <button
            onClick={() => setIsHistoryOpen(true)}
            className="p-2 text-gray-500 hover:text-gray-900 bg-white hover:bg-gray-50 border border-gray-200 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm text-sm"
            title="版本历史"
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">历史</span>
          </button>

          {!isReadOnly && (
            <button
              onClick={() => setIsPreview(!isPreview)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${isPreview
                ? 'text-white bg-blue-600 border border-blue-600 hover:bg-blue-700'
                : 'text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 dark:text-blue-300 dark:bg-blue-950/40 dark:border-blue-800 dark:hover:bg-blue-900/50'
                }`}
            >
              {isPreview ? '编辑' : '预览'}
            </button>
          )}
        </div>
      </div>

      {/* Editor Placeholder Skeleton */}
      {!isEditorReady && (
        <div className="flex-1 rounded-lg border border-gray-100 p-8 space-y-4 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="space-y-3 mt-8">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-4/5"></div>
          </div>
        </div>
      )}

      {/* Editor
           key switches once when collab becomes ready, forcing a full remount with
           the Collaboration extension. Without this, useEditor only runs on first
           mount (when provider=null) and never picks up the Collaboration extension. */}
      <div className={`min-h-[500px] flex-1 ${!isEditorReady ? 'hidden' : ''}`}>
        <Editor
          key={isCollabReady ? `collab-${documentId}` : `normal-${documentId}`}
          initialContent={document.content || ''}
          editable={!isPreview && !isReadOnly}
          provider={isCollabReady ? provider : undefined}
          ydoc={isCollabReady ? ydoc : undefined}
          collabUser={collabUser ?? undefined}
          onUpdate={handleContentUpdate}
          onReady={(editor) => {
            editorRef.current = editor;
            setIsEditorReady(true);
          }}
        />
      </div>

      <VersionHistoryPanel
        documentId={documentId}
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onRestore={() => {
          // Reload page to reflect restored version or fetch document contents
          window.location.reload();
        }}
      />
    </div>
  );
}
