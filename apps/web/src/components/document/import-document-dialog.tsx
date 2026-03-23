'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileUp, X, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { documentService } from '@/services/document-service';
import {
  parseFile,
  getFileTypeLabel,
  formatFileSize,
  MAX_IMPORT_SIZE,
  ACCEPT_STRING,
} from '@/lib/import-utils';
import type { Document } from '@/types/document';

interface ImportDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  spaceId: string;
  onImported: (doc: Document) => void;
}

export function ImportDocumentDialog({
  open,
  onOpenChange,
  spaceId,
  onImported,
}: ImportDocumentDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setFile(null);
    setTitle('');
    setLoading(false);
    setParsing(false);
    setIsDragging(false);
  }, []);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) reset();
      onOpenChange(open);
    },
    [onOpenChange, reset],
  );

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    if (selectedFile.size > MAX_IMPORT_SIZE) {
      toast.error('文件过大，最大支持 10MB');
      return;
    }

    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    if (!['md', 'html', 'htm', 'docx'].includes(ext || '')) {
      toast.error('不支持的文件格式，请选择 .md、.html 或 .docx 文件');
      return;
    }

    setFile(selectedFile);
    setParsing(true);

    try {
      const parsed = await parseFile(selectedFile);
      setTitle(parsed.title);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '文件解析失败');
      setFile(null);
    } finally {
      setParsing(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) handleFileSelect(droppedFile);
    },
    [handleFileSelect],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) handleFileSelect(selectedFile);
      // Reset input so the same file can be re-selected
      e.target.value = '';
    },
    [handleFileSelect],
  );

  const handleImport = useCallback(async () => {
    if (!file || !title.trim()) return;

    setLoading(true);
    try {
      const parsed = await parseFile(file);
      const doc = await documentService.createDocument({
        title: title.trim(),
        content: JSON.stringify(parsed.content),
        spaceId,
      });

      // Refresh document lists
      window.dispatchEvent(new Event('document-updated'));
      toast.success('文档导入成功');
      handleOpenChange(false);
      onImported(doc);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '导入失败，请重试');
    } finally {
      setLoading(false);
    }
  }, [file, title, spaceId, onImported, handleOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>导入文档</DialogTitle>
          <DialogDescription>
            支持 Markdown (.md)、HTML (.html) 和 Word (.docx) 文件
          </DialogDescription>
        </DialogHeader>

        {!file ? (
          /* ── Drop zone ─────────────────────────────────── */
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`
              flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 cursor-pointer transition-colors
              ${isDragging
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }
            `}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
              <FileUp className="h-6 w-6 text-gray-500 dark:text-gray-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                拖拽文件到此处，或点击选择
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                .md, .html, .docx · 最大 10MB
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT_STRING}
              onChange={handleInputChange}
              className="hidden"
            />
          </div>
        ) : (
          /* ── File selected ─────────────────────────────── */
          <div className="space-y-4">
            {/* File info card */}
            <div className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                  {file.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-900/40 px-1.5 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300">
                    {getFileTypeLabel(file.name)}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(file.size)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setTitle('');
                }}
                className="rounded-md p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label="移除文件"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Title input */}
            <div>
              <label
                htmlFor="import-title"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                文档标题
              </label>
              <input
                id="import-title"
                type="text"
                value={parsing ? '解析中...' : title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={parsing}
                placeholder="输入文档标题"
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            取消
          </Button>
          <Button
            onClick={handleImport}
            disabled={!file || !title.trim() || loading || parsing}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                导入中...
              </>
            ) : (
              '导入'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
