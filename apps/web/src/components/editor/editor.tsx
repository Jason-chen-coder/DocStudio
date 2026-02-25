import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor';

interface EditorProps {
  initialContent?: string;
  onUpdate?: (content: string) => void;
  editable?: boolean;
}

export function Editor({ initialContent, onUpdate, editable = true }: EditorProps) {
  return (
    <div className="editor-container h-full">
       <SimpleEditor content={initialContent} onUpdate={onUpdate} editable={editable} />
    </div>
  );
}
