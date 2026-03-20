'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { Document } from '@/types/document';
import { publicService } from '@/services/public-service';
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Printer, Share2, Download, Check, Link2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PublicDocumentPage({ params }: { params: Promise<{ id: string; docId: string }> }) {
    const { id: spaceId, docId } = use(params);
    const [doc, setDoc] = useState<Document | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

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

    const handlePrint = useCallback(() => {
        window.print();
    }, []);

    const handleShare = useCallback(async () => {
        const url = window.location.href;
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            toast.success('链接已复制到剪贴板');
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback for older browsers
            const input = document.createElement('input');
            input.value = url;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
            setCopied(true);
            toast.success('链接已复制到剪贴板');
            setTimeout(() => setCopied(false), 2000);
        }
    }, []);

    const handleExport = useCallback(() => {
        if (!doc) return;

        // Export as HTML file
        const contentEl = document.querySelector('.tiptap');
        const htmlContent = contentEl?.innerHTML || '';

        const fullHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${doc.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; line-height: 1.7; color: #1a1a1a; }
    h1, h2, h3 { margin-top: 2em; margin-bottom: 0.5em; }
    h1 { font-size: 2em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
    pre { background: #f6f8fa; padding: 16px; border-radius: 8px; overflow-x: auto; }
    code { background: #f0f0f0; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
    pre code { background: none; padding: 0; }
    blockquote { border-left: 3px solid #ddd; margin-left: 0; padding-left: 1em; color: #666; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
    th { background: #f6f8fa; }
    img { max-width: 100%; }
  </style>
</head>
<body>
  <h1>${doc.title}</h1>
  ${htmlContent}
  <hr>
  <footer style="color: #999; font-size: 0.85em; margin-top: 2em;">
    <p>导出自 DocStudio · ${format(new Date(), 'yyyy-MM-dd HH:mm')}</p>
  </footer>
</body>
</html>`;

        const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${doc.title}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('文档已导出');
    }, [doc]);

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
            {/* Floating Toolbar */}
            <div className="sticky top-0 z-10 flex items-center justify-end gap-1 px-4 py-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800 print:hidden">
                <ToolbarButton
                    icon={copied ? <Check className="w-4 h-4 text-green-500" /> : <Link2 className="w-4 h-4" />}
                    label="复制链接"
                    onClick={handleShare}
                />
                <ToolbarButton
                    icon={<Download className="w-4 h-4" />}
                    label="导出 HTML"
                    onClick={handleExport}
                />
                <ToolbarButton
                    icon={<Printer className="w-4 h-4" />}
                    label="打印"
                    onClick={handlePrint}
                />
            </div>

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

/* ------------------------------------------------------------------ */
/*  ToolbarButton — small icon button with tooltip                     */
/* ------------------------------------------------------------------ */

function ToolbarButton({
    icon,
    label,
    onClick,
}: {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            title={label}
            className="group relative inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
            {icon}
            <span className="hidden sm:inline">{label}</span>
        </button>
    );
}
