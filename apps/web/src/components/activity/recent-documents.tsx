'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { activityService, RecentDocument } from '@/services/activity-service';
import { documentService } from '@/services/document-service';
import { Clock, FileText, Eye, ChevronDown } from 'lucide-react';

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin} 分钟前`;
  if (diffHour < 24) return `${diffHour} 小时前`;
  if (diffDay < 7) return `${diffDay} 天前`;
  return date.toLocaleDateString('zh-CN');
}

interface RecentDocumentsProps {
  /** Max items to display inline (hides load-more when set). */
  limit?: number;
}

export function RecentDocuments({ limit }: RecentDocumentsProps) {
  const [documents, setDocuments] = useState<RecentDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const router = useRouter();
  const pageSize = 10;

  const fetchDocs = useCallback(
    async (pageNum: number, append = false) => {
      try {
        if (append) setLoadingMore(true);
        else setLoading(true);

        const res = await activityService.getRecentDocuments(pageNum, pageSize);

        if (append) {
          setDocuments((prev) => [...prev, ...res.data]);
        } else {
          setDocuments(res.data);
        }
        setTotal(res.total);
        setPage(pageNum);
      } catch (err) {
        console.error('Failed to fetch recent documents', err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [pageSize],
  );

  const fetchedRef = useRef(false);
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchDocs(1);
  }, [fetchDocs]);

  const hasMore = documents.length < total;

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchDocs(page + 1, true);
    }
  };

  const handleDocClick = async (doc: RecentDocument) => {
    const exists = await documentService.checkExists(doc.documentId);
    if (exists) {
      router.push(`/spaces/${doc.spaceId}/documents/${doc.documentId}`);
    } else {
      toast.error('该文档已被删除或无权访问', { description: doc.title });
      setDocuments((prev) => prev.filter((d) => d.documentId !== doc.documentId));
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[...Array(limit || 4)].map((_, i) => (
          <div
            key={i}
            className="h-16 bg-gray-100 dark:bg-gray-700 rounded-lg"
          />
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="text-sm">暂无最近访问的文档</p>
        <p className="text-xs mt-1">浏览文档后会在这里显示</p>
      </div>
    );
  }

  const visibleDocs = limit ? documents.slice(0, limit) : documents;

  return (
    <div className="space-y-2">
      {visibleDocs.map((doc) => (
        <button
          key={doc.documentId}
          onClick={() => handleDocClick(doc)}
          className="w-full text-left px-4 py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 transition group cursor-pointer"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {doc.title || '无标题文档'}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1.5">
                <span
                  role="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/spaces/${doc.spaceId}`);
                  }}
                  className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 transition-colors cursor-pointer"
                >
                  {doc.spaceName}
                </span>
                {doc.creator && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {doc.creator.name}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                <Clock className="w-3 h-3" />
                {formatRelativeTime(doc.lastVisitAt)}
              </span>
              <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                <Eye className="w-3 h-3" />
                {doc.visitCount}
              </span>
            </div>
          </div>
        </button>
      ))}

      {/* Load more — hidden when limit is set (inline preview mode) */}
      {hasMore && !limit && (
        <div className="text-center pt-2">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="inline-flex items-center gap-1 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition cursor-pointer"
          >
            {loadingMore ? (
              <span className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            {loadingMore ? '加载中...' : '加载更多'}
          </button>
        </div>
      )}
    </div>
  );
}
