'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { spaceService } from '@/services/space-service';
import { Space } from '@/types/space';
import { ActivityTimeline } from '@/components/activity/activity-timeline';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default function SpaceActivityPage() {
  const params = useParams();
  const spaceId = params.id as string;
  const [space, setSpace] = useState<Space | null>(null);

  useEffect(() => {
    spaceService
      .getSpace(spaceId)
      .then(setSpace)
      .catch(console.error);
  }, [spaceId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <Link
          href={`/spaces/${spaceId}`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-2 transition"
        >
          <ChevronLeft className="w-4 h-4" />
          返回 {space?.name || '空间'}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          活动日志
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {space?.name ? `「${space.name}」` : ''}空间内的所有操作记录
        </p>
      </div>

      {/* Activity Timeline */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
        <ActivityTimeline spaceId={spaceId} />
      </div>
    </div>
  );
}
