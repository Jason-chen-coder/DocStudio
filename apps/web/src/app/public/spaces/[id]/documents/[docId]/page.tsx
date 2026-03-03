'use client';

import { useEffect, useState, use } from 'react';
import { Document } from '@/types/document';
import { publicService } from '@/services/public-service';
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export default function PublicDocumentPage({ params }: { params: Promise<{ id: string; docId: string }> }) {
    const { docId } = use(params);
    const [doc, setDoc] = useState<Document | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDoc = async () => {
            setLoading(true);
            try {
                const docData = await publicService.getPublicDocument(docId);
                setDoc(docData);
            } catch (error) {
                console.error('Failed to load public document', error);
            } finally {
                setLoading(false);
            }
        };
        fetchDoc();
    }, [docId]);

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="animate-pulse space-y-4 w-full max-w-3xl px-8">
                    <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
                    <div className="space-y-2 pt-8">
                        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-5/6"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-4/6"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!doc) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-gray-500">文档加载失败或已被删除</div>
            </div>
        );
    }

    // Parse JSON content if needed, though SimpleEditor seems to accept HTML or JSON strings
    // In the original DocStudio it was likely stored as JSON string or HTML string.
    // We'll pass it directly to SimpleEditor and verify it renders correctly.

    const renderFooter = () => (
        <div className="mt-16 pt-8 border-t border-gray-100 dark:border-gray-800 text-sm text-gray-500 flex flex-col md:flex-row items-center justify-between gap-4 pb-8 max-w-[800px] mx-auto px-4 sm:px-6 md:px-12">
            <div className="flex items-center gap-2">
                <span>创建者:</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">{doc.creator?.name || '未知用户'}</span>
            </div>
            <div>
                最后更新于: {format(new Date(doc.updatedAt), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
            </div>
        </div>
    );

    return (
        <div className="h-full w-full flex flex-col relative text-gray-900 bg-white">
            <div className="flex-1 h-full w-full mx-auto relative content-container !pt-0">
                <SimpleEditor
                    content={doc.content}
                    editable={false}
                    showTableOfContents={true}
                    footer={renderFooter()}
                />
            </div>
        </div>
    );
}
