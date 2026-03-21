'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Document } from '@/types/document';
import { documentService } from '@/services/document-service';
import { toast } from 'sonner';
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  FileText,
  Clock,
  ChevronLeft,
} from 'lucide-react';
import { AlertDialog, Button, Flex } from '@radix-ui/themes';
import { cn } from '@/lib/utils';

function timeAgo(dateStr: string) {
  const now = Date.now();
  const d = new Date(dateStr).getTime();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins} 分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;
  return new Date(dateStr).toLocaleDateString('zh-CN');
}

function daysRemaining(deletedAt: string) {
  const deleted = new Date(deletedAt).getTime();
  const expiresAt = deleted + 30 * 24 * 60 * 60 * 1000;
  const remaining = Math.ceil((expiresAt - Date.now()) / (24 * 60 * 60 * 1000));
  return Math.max(0, remaining);
}

export default function TrashPage() {
  const params = useParams();
  const router = useRouter();
  const spaceId = params?.id as string;

  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrash = useCallback(async () => {
    if (!spaceId) return;
    try {
      setLoading(true);
      const data = await documentService.getTrash(spaceId);
      setDocs(data);
    } catch {
      toast.error('加载回收站失败');
    } finally {
      setLoading(false);
    }
  }, [spaceId]);

  useEffect(() => {
    fetchTrash();
  }, [fetchTrash]);

  const handleRestore = async (id: string) => {
    try {
      await documentService.restoreDocument(id);
      setDocs((prev) => prev.filter((d) => d.id !== id));
      window.dispatchEvent(new Event('document-updated'));
      toast.success('文档已恢复');
    } catch {
      toast.error('恢复失败');
    }
  };

  const handlePermanentDelete = async (id: string) => {
    try {
      await documentService.permanentlyDeleteDocument(id);
      setDocs((prev) => prev.filter((d) => d.id !== id));
      toast.success('已永久删除');
    } catch {
      toast.error('删除失败');
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-5 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/spaces/${spaceId}`)}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
            <Trash2 className="w-4.5 h-4.5 text-red-500" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">回收站</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              文档将在删除 30 天后自动永久清理
            </p>
          </div>
          <div className="ml-auto text-sm text-gray-400">
            {docs.length} 个文档
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-gray-50 dark:bg-gray-800 animate-pulse" />
            ))}
          </div>
        ) : docs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <Trash2 className="w-7 h-7 text-gray-300 dark:text-gray-600" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">回收站是空的</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              删除的文档会出现在这里
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-1.5">
            {docs.map((doc) => {
              const remaining = doc.deletedAt ? daysRemaining(doc.deletedAt) : 30;
              return (
                <div
                  key={doc.id}
                  className="group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                      {doc.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">
                        {doc.creator?.name || '未知'}
                      </span>
                      <span className="text-xs text-gray-300 dark:text-gray-600">·</span>
                      <span className="text-xs text-gray-400 flex items-center gap-0.5">
                        <Clock className="w-3 h-3" />
                        {doc.deletedAt ? timeAgo(doc.deletedAt) : ''}删除
                      </span>
                      <span className={cn(
                        'text-xs px-1.5 py-0.5 rounded-full',
                        remaining <= 7
                          ? 'bg-red-50 text-red-500 dark:bg-red-900/20'
                          : 'bg-gray-100 text-gray-400 dark:bg-gray-700'
                      )}>
                        {remaining} 天后清理
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                      onClick={() => handleRestore(doc.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      恢复
                    </button>

                    <AlertDialog.Root>
                      <AlertDialog.Trigger>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-900/20 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                          <AlertTriangle className="w-3 h-3" />
                          永久删除
                        </button>
                      </AlertDialog.Trigger>
                      <AlertDialog.Content maxWidth="450px">
                        <AlertDialog.Title>永久删除文档</AlertDialog.Title>
                        <AlertDialog.Description size="2">
                          确定要永久删除文档 <span className="font-semibold">{doc.title}</span> 吗？
                          此操作<span className="text-red-600 font-semibold">不可恢复</span>，文档将被彻底清除。
                        </AlertDialog.Description>
                        <Flex gap="3" mt="4" justify="end">
                          <AlertDialog.Cancel>
                            <Button variant="soft" color="gray">取消</Button>
                          </AlertDialog.Cancel>
                          <AlertDialog.Action>
                            <Button
                              variant="solid"
                              color="red"
                              onClick={() => handlePermanentDelete(doc.id)}
                            >
                              永久删除
                            </Button>
                          </AlertDialog.Action>
                        </Flex>
                      </AlertDialog.Content>
                    </AlertDialog.Root>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
