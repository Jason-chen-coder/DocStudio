import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor';
import type { HocuspocusProvider } from '@hocuspocus/provider';
import type * as Y from 'yjs';
import type { CollabUser } from '@/hooks/use-collaboration';
import type { Editor as TiptapEditor } from '@tiptap/react';
import type { CommentThread, CommentEvent } from '@/hooks/use-comments';

interface EditorProps {
  initialContent?: string;
  onUpdate?: (props: { editor: TiptapEditor }) => void;
  editable?: boolean;
  // Collaboration mode props
  provider?: HocuspocusProvider;
  ydoc?: Y.Doc;
  collabUser?: CollabUser;
  // Callback when editor is fully mounted
  onReady?: (editor: TiptapEditor) => void;
  // Comment persistence
  initialCommentThreads?: CommentThread[];
  onCommentsChange?: (threads: CommentThread[]) => void;
  onCommentEvent?: (event: CommentEvent) => void;
  // Space ID for @mention member lookup and [[ document link search
  spaceId?: string;
  // Document ID for [[ document link self-exclusion
  documentId?: string;
  // AI Chat state (controlled by parent for sidebar layout)
  isAiChatOpen?: boolean;
  onAiChatToggle?: () => void;
  aiChatMode?: 'floating' | 'sidebar';
  onAiChatModeChange?: (mode: 'floating' | 'sidebar') => void;
}

export function Editor({
  initialContent,
  onUpdate,
  editable = true,
  provider,
  ydoc,
  collabUser,
  onReady,
  initialCommentThreads,
  onCommentsChange,
  onCommentEvent,
  spaceId,
  documentId,
  isAiChatOpen,
  onAiChatToggle,
  aiChatMode,
  onAiChatModeChange,
}: EditorProps) {
  return (
    <div className="editor-container h-full">
      <SimpleEditor
        content={initialContent}
        onUpdate={onUpdate}
        editable={editable}
        provider={provider}
        ydoc={ydoc}
        collabUser={collabUser}
        onReady={onReady}
        initialCommentThreads={initialCommentThreads}
        onCommentsChange={onCommentsChange}
        onCommentEvent={onCommentEvent}
        spaceId={spaceId}
        documentId={documentId}
        isAiChatOpen={isAiChatOpen}
        onAiChatToggle={onAiChatToggle}
        aiChatMode={aiChatMode}
        onAiChatModeChange={onAiChatModeChange}
      />
    </div>
  );
}
