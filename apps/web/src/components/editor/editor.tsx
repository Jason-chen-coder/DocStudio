import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor';
import type { HocuspocusProvider } from '@hocuspocus/provider';
import type * as Y from 'yjs';
import type { CollabUser } from '@/hooks/use-collaboration';

interface EditorProps {
  initialContent?: string;
  onUpdate?: (content: string) => void;
  editable?: boolean;
  // Collaboration mode props
  provider?: HocuspocusProvider;
  ydoc?: Y.Doc;
  collabUser?: CollabUser;
  // Callback when editor is fully mounted
  onReady?: () => void;
}

export function Editor({
  initialContent,
  onUpdate,
  editable = true,
  provider,
  ydoc,
  collabUser,
  onReady,
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
      />
    </div>
  );
}
