'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { documentService } from '@/services/document-service';
import { spaceService } from '@/services/space-service';
import { Document } from '@/types/document';
import { Space } from '@/types/space';
import { Editor } from '@/components/editor/editor';
import { ShareDialog } from '@/components/share/share-dialog';
import { DocumentPermissionDialog } from '@/components/editor/document-permission-dialog';
import { OnlineUsers } from '@/components/editor/online-users';
import { VersionHistoryPanel } from '@/components/editor/version-history-panel';
import {
  History,
  BookTemplate,
  ChevronLeft,
  Eye,
  Pencil,
  Share2,
  FileText,
  Printer,
  FileCode,
  MoreHorizontal,
  Wifi,
  WifiOff,
  Loader2,
  Lock,
  ArrowRight,
  Keyboard,
} from 'lucide-react';
import { exportAsMarkdown, exportAsHTML, exportAsPDF } from '@/lib/export-utils';
import { SaveAsTemplateDialog } from '@/components/template/save-as-template-dialog';
import { KeyboardShortcutsDialog } from '@/components/editor/keyboard-shortcuts-dialog';
import { DocumentStatsBadge } from '@/components/editor/document-stats-badge';
import { AiChatPanel } from '@/components/editor/ai-chat-panel';
import type { Editor as TiptapEditor } from '@tiptap/react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  useCollaboration,
  generateUserColor,
  CollabUser,
} from '@/hooks/use-collaboration';
import { toast } from 'sonner';
import { deserializeThreads, type CommentThread, type CommentEvent } from '@/hooks/use-comments';

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
  const searchParams = useSearchParams();
  const { user: authUser } = useAuth();
  const documentId = params.documentId as string;
  const spaceId = params.id as string;

  // 从活动日志进入时强制只读
  const isReadOnlyFromQuery = searchParams.get('readonly') === 'true';

  const [document, setDocument] = useState<Document | null>(null);
  const [space, setSpace] = useState<Space | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [showSaveAsTemplate, setShowSaveAsTemplate] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [aiChatMode, setAiChatMode] = useState<'floating' | 'sidebar'>('floating');
  const [docIsRestricted, setDocIsRestricted] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [initialCommentThreads, setInitialCommentThreads] = useState<CommentThread[]>([]);

  // Status for auto-save (title only in collab mode)
  const [status, setStatus] = useState<'saved' | 'saving' | 'error' | 'pending'>('saved');

  // Permissions: VIEWER 角色、非空间成员（公开空间匿名访问）、或从活动日志进入时强制只读
  const hasWriteRole = space?.myRole === 'OWNER' || space?.myRole === 'ADMIN' || space?.myRole === 'EDITOR';
  const isReadOnly = !hasWriteRole || isReadOnlyFromQuery;

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
  // Skip collab for brand-new documents (ydocData is null) — load content from DB instead.
  // Once the user edits, Hocuspocus will initialize ydocData on first save.
  const hasYdocData = !!document?.hasYdocData;
  const ydocKey = document?.ydocKey ?? null;

  const { ydoc, provider, connectedUsers, status: collabStatus } = useCollaboration(
    ydocKey && collabUser && hasYdocData
      ? {
        documentId,
        ydocKey,
        currentUser: collabUser,
      }
      : null,
  );

  const isCollabReady = !!(ydocKey && ydoc && provider && hasYdocData);

  const [isEditorReady, setIsEditorReady] = useState(false);

  // Prevent React Strict Mode double-fire from issuing duplicate requests
  const loadingRef = useRef(false);

  useEffect(() => {
    async function loadData() {
      if (loadingRef.current) return;
      loadingRef.current = true;
      try {
        setLoading(true);
        const [docData, spaceData] = await Promise.all([
          documentService.getDocument(documentId),
          spaceService.getSpace(spaceId),
        ]);
        setDocument(docData);
        setTitle(docData.title);
        setSpace(spaceData);
        setDocIsRestricted(docData.isRestricted ?? false);
        // Restore persisted comment threads
        setInitialCommentThreads(deserializeThreads(docData.commentsData));
      } catch (error: any) {
        console.error('Failed to load document', error);
        // Detect 403 Forbidden → show access denied page
        if (error?.status === 403 || error?.message?.includes('403') || error?.message?.includes('permission')) {
          setAccessDenied(true);
        } else {
          toast.error('无法加载文档');
        }
      } finally {
        setLoading(false);
        loadingRef.current = false;
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

  const handleCommentsChange = useCallback((threads: CommentThread[]) => {
    documentService.updateDocument(documentId, {
      commentsData: JSON.stringify(threads),
    }).catch((err) => console.error('Failed to save comments', err));
  }, [documentId]);

  const handleCommentEvent = useCallback((event: CommentEvent) => {
    // Fire-and-forget：通知文档相关者有新评论
    documentService.notifyComment(
      documentId,
      event.text,
    ).catch(() => { /* silent */ });
  }, [documentId]);

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


  if (accessDenied) {
    return (
      <div className="mx-auto h-full flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-lg px-6">
        <div className="flex flex-col items-center text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-5">
            <Lock className="w-7 h-7 text-red-500 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            无访问权限
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
            你没有权限访问此文档，请联系文档所有者或空间管理员获取访问权限。
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="gap-1.5"
          >
            <ChevronLeft className="w-4 h-4" />
            返回上一页
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto h-full flex flex-col bg-white rounded-lg dark:bg-gray-800">
        {/* Header Skeleton */}
        <div className="border-b border-gray-100 dark:border-gray-700/50">
          <div className="flex items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 h-14 animate-pulse">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-gray-200 dark:bg-gray-700" />
              <div className="h-4 w-20 rounded bg-gray-200 dark:bg-gray-700 hidden sm:block" />
              <div className="h-4 w-28 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-16 rounded-md bg-gray-200 dark:bg-gray-700" />
              <div className="h-8 w-8 rounded-md bg-gray-200 dark:bg-gray-700" />
              <div className="h-8 w-16 rounded-md bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
          <div className="px-4 sm:px-6 lg:px-8 pb-4 pt-2 animate-pulse">
            <div className="h-8 w-1/3 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>

        {/* Editor Placeholder Skeleton */}
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 space-y-4 animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          <div className="space-y-3 mt-8">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
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
    <div className="h-full flex">
    <div className="flex-1 min-w-0 h-full flex flex-col bg-white rounded-lg dark:bg-gray-800 overflow-x-hidden">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-100 dark:border-gray-700/50">
        {/* Top bar: navigation + actions */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 h-14">
          {/* Left: back + breadcrumb-style info */}
          <div className="flex items-center gap-2 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 text-muted-foreground"
              onClick={() => router.push(`/spaces/${spaceId}`)}
              title="返回空间"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            {space && (
              <button
                onClick={() => router.push(`/spaces/${spaceId}`)}
                className="hidden sm:block text-base text-muted-foreground hover:text-foreground transition-colors truncate max-w-[200px]"
              >
                {space.name}
              </button>
            )}
          </div>

          {/* Right: action buttons + status */}
          <div className="flex items-center gap-1.5">
            {/* Online users */}
            {collabUser && (
              <OnlineUsers
                users={connectedUsers}
                currentUser={collabUser}
                maxVisible={4}
              />
            )}

            {/* Status pill — 用户头像右侧 */}
            <div className="hidden md:flex items-center">
              {isReadOnly ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-xs font-medium">
                  <Lock className="h-3 w-3" />
                  只读
                </div>
              ) : isCollabReady ? (
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  collabStatus === 'connected'
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                    : collabStatus === 'connecting'
                      ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400'
                      : 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400'
                }`}>
                  {collabStatus === 'connected' && <Wifi className="h-3 w-3" />}
                  {collabStatus === 'connecting' && <Loader2 className="h-3 w-3 animate-spin" />}
                  {collabStatus === 'disconnected' && <WifiOff className="h-3 w-3" />}
                  {statusLabel[collabStatus]}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-muted-foreground">
                  {status === 'saving' && <Loader2 className="h-3 w-3 animate-spin" />}
                  {status === 'saving' && '保存中...'}
                  {status === 'saved' && '已保存'}
                  {status === 'pending' && '等待保存...'}
                  {status === 'error' && <span className="text-red-500">保存失败</span>}
                </div>
              )}
            </div>

            <DocumentStatsBadge documentId={documentId} />

            {/* View mode toggle / edit entry */}
            {isReadOnlyFromQuery && space?.myRole !== 'VIEWER' ? (
              <Button
                size="sm"
                onClick={() => router.replace(`/spaces/${spaceId}/documents/${documentId}`)}
                className="gap-1.5"
              >
                进入编辑
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            ) : !isReadOnly && (
              <Button
                variant={isPreview ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsPreview(!isPreview)}
                className="gap-1.5"
              >
                {isPreview ? <Pencil className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">{isPreview ? '编辑' : '预览'}</span>
              </Button>
            )}

            {/* More actions dropdown — 最右侧 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setShowShareDialog(true)}>
                  <Share2 className="h-4 w-4" />
                  分享
                </DropdownMenuItem>
                {(space?.myRole === 'OWNER' || space?.myRole === 'ADMIN') && (
                  <DropdownMenuItem onClick={() => setShowPermissionDialog(true)}>
                    <Lock className="h-4 w-4" />
                    权限管理
                    {docIsRestricted && (
                      <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                        限制中
                      </span>
                    )}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => setIsHistoryOpen(true)}>
                  <History className="h-4 w-4" />
                  版本历史
                </DropdownMenuItem>
                {!isReadOnly && (
                  <DropdownMenuItem onClick={() => setShowSaveAsTemplate(true)}>
                    <BookTemplate className="h-4 w-4" />
                    存为模板
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => {
                  if (editorRef.current) exportAsMarkdown(editorRef.current, title);
                }}>
                  <FileCode className="h-4 w-4" />
                  导出 Markdown
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  if (editorRef.current) exportAsHTML(editorRef.current, title);
                }}>
                  <FileText className="h-4 w-4" />
                  导出 HTML
                </DropdownMenuItem>
                <DropdownMenuItem onClick={async () => {
                  if (editorRef.current) {
                    toast.loading('正在生成 PDF...', { id: 'pdf-export' });
                    try {
                      await exportAsPDF(editorRef.current, title);
                      toast.success('PDF 导出成功', { id: 'pdf-export' });
                    } catch {
                      toast.error('PDF 导出失败', { id: 'pdf-export' });
                    }
                  }
                }}>
                  <Printer className="h-4 w-4" />
                  导出 PDF
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowShortcuts(true)} className="hidden md:flex">
                  <Keyboard className="h-4 w-4" />
                  快捷键
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Title row */}
        <div className="px-4 sm:px-6 lg:px-8 pb-4 pt-2">
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="无标题"
            disabled={isPreview || isReadOnly}
            className="w-full text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 bg-transparent border-none outline-none focus:ring-0 placeholder-gray-300 dark:placeholder-gray-600 px-0 disabled:opacity-60"
          />
        </div>
      </header>

      {/* Editor Placeholder Skeleton */}
      {!isEditorReady && (
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 space-y-4 animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          <div className="space-y-3 mt-8">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
          </div>
        </div>
      )}

      {/* Editor */}
      <div className={`min-h-[500px] flex-1 px-4 sm:px-6 lg:px-8 py-4 ${!isEditorReady ? 'hidden' : ''}`}>
        <Editor
          key={isCollabReady ? `collab-${documentId}` : `normal-${documentId}`}
          initialContent={document.content || ''}
          editable={!isPreview && !isReadOnly}
          provider={isCollabReady ? provider : undefined}
          ydoc={isCollabReady ? ydoc : undefined}
          collabUser={collabUser ?? undefined}
          onUpdate={handleContentUpdate}
          initialCommentThreads={initialCommentThreads}
          onCommentsChange={handleCommentsChange}
          onCommentEvent={handleCommentEvent}
          spaceId={spaceId}
          documentId={documentId}
          isAiChatOpen={isAiChatOpen}
          onAiChatToggle={() => setIsAiChatOpen((v) => !v)}
          aiChatMode={aiChatMode}
          onAiChatModeChange={setAiChatMode}
          onReady={(editor) => {
            editorRef.current = editor;
            setIsEditorReady(true);

            // For collab documents: after Yjs syncs, if editor is still empty
            // but DB has content (e.g. ydocData was saved empty previously), inject it.
            if (isCollabReady && provider && document.content?.trim().startsWith('{')) {
              const injectIfEmpty = () => {
                if (editor.isDestroyed) return;
                if (editor.state.doc.textContent.trim() !== '') return;
                try {
                  editor.commands.setContent(JSON.parse(document.content!));
                } catch { /* not valid JSON */ }
              };
              if (provider.synced) {
                setTimeout(injectIfEmpty, 200);
              } else {
                provider.on('synced', () => setTimeout(injectIfEmpty, 200));
              }
            }
          }}
        />
      </div>

      <VersionHistoryPanel
        documentId={documentId}
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onRestore={() => {
          // Clear IndexedDB cache to prevent stale Y.Doc from overwriting restored state.
          // y-indexeddb creates a database named after the ydocKey.
          if (ydocKey) {
            const req = indexedDB.deleteDatabase(ydocKey);
            req.onsuccess = () => window.location.reload();
            req.onerror = () => window.location.reload();
            req.onblocked = () => window.location.reload();
          } else {
            window.location.reload();
          }
        }}
      />

      <SaveAsTemplateDialog
        open={showSaveAsTemplate}
        onOpenChange={setShowSaveAsTemplate}
        documentId={documentId}
        documentTitle={title}
        editorContent={editorRef.current ? JSON.stringify(editorRef.current.getJSON()) : undefined}
      />

      <ShareDialog
        documentId={documentId}
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
      />

      <DocumentPermissionDialog
        open={showPermissionDialog}
        onOpenChange={setShowPermissionDialog}
        documentId={documentId}
        spaceId={spaceId}
        isRestricted={docIsRestricted}
        onRestrictedChange={setDocIsRestricted}
      />

      <KeyboardShortcutsDialog
        open={showShortcuts}
        onOpenChange={setShowShortcuts}
      />
    </div>

    {/* AI Chat Sidebar (same level as editor container) */}
    {isAiChatOpen && aiChatMode === 'sidebar' && editorRef.current && (
      <AiChatPanel
        editor={editorRef.current}
        documentId={documentId}
        onClose={() => setIsAiChatOpen(false)}
        mode="sidebar"
        onModeChange={setAiChatMode}
      />
    )}
    </div>
  );
}

