import { DocumentSnapshot } from '@/types/document';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Highlight } from '@tiptap/extension-highlight';
import { TaskList, TaskItem } from '@tiptap/extension-list';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { ImageUploadNode } from '@/components/tiptap-node/image-upload-node/image-upload-node-extension';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { all, createLowlight } from 'lowlight';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { X, RotateCcw } from 'lucide-react';
import { useEffect } from 'react';

const lowlight = createLowlight(all);

interface VersionPreviewDialogProps {
    snapshot: DocumentSnapshot | null;
    isOpen: boolean;
    onClose: () => void;
    onRestore: (snapshotId: string) => void;
    restoring: boolean;
}

export function VersionPreviewDialog({
    snapshot,
    isOpen,
    onClose,
    onRestore,
    restoring,
}: VersionPreviewDialogProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Highlight,
            TaskList,
            TaskItem.configure({ nested: true }),
            Table.configure({ resizable: true }),
            TableRow,
            TableHeader,
            TableCell,
            ImageUploadNode,
            CodeBlockLowlight.configure({ lowlight }),
        ],
        content: snapshot?.content ? JSON.parse(snapshot.content) : '',
        editable: false,
        immediatelyRender: false,
    });

    useEffect(() => {
        if (editor && snapshot?.content) {
            editor.commands.setContent(JSON.parse(snapshot.content));
        }
    }, [editor, snapshot]);

    if (!isOpen || !snapshot) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            历史版本预览
                            <span className="text-xs font-normal text-gray-500 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                                只读模式
                            </span>
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            创建于 {format(new Date(snapshot.createdAt), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
                            {snapshot.message && <span className="ml-2 py-0.5 px-2 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-md">备注: {snapshot.message}</span>}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => onRestore(snapshot.id)}
                            disabled={restoring}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <RotateCcw className="w-4 h-4" />
                            {restoring ? '恢复中...' : '恢复到此版本'}
                        </button>
                        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1 border-none" />
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-8 sm:p-12 bg-[#F9FBFD] dark:bg-[#0B1120]">
                    <div className="max-w-3xl mx-auto bg-white dark:bg-[#111827] shadow-sm border border-gray-100 dark:border-gray-800 rounded-xl min-h-full p-8 sm:p-12">
                        <div className="prose prose-blue dark:prose-invert max-w-none prose-img:rounded-lg">
                            <EditorContent editor={editor} />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
