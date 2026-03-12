import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor';
import type { HocuspocusProvider } from '@hocuspocus/provider';
import type * as Y from 'yjs';
import type { CollabUser } from '@/hooks/use-collaboration';
import type { Editor as TiptapEditor } from '@tiptap/react';
import type { CommentThread } from '@/hooks/use-comments';

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
      />
    </div>
  );
}
