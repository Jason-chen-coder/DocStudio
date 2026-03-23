'use client';

import { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import { activityService, type DocumentStats } from '@/services/activity-service';

interface DocumentStatsBadgeProps {
  documentId: string;
}

export function DocumentStatsBadge({ documentId }: DocumentStatsBadgeProps) {
  const [stats, setStats] = useState<DocumentStats | null>(null);

  useEffect(() => {
    activityService
      .getDocumentStats(documentId)
      .then(setStats)
      .catch(() => {});
  }, [documentId]);

  if (!stats || stats.pv === 0) return null;

  return (
    <div
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/50"
      title={`${stats.uv} 位读者 · ${stats.pv} 次浏览`}
    >
      <Eye className="w-3.5 h-3.5" />
      <span className="tabular-nums">{stats.pv}</span>
    </div>
  );
}
