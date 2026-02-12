'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter, useParams } from 'next/navigation';
import { spaceService } from '@/services/space-service';
import { Space } from '@/types/space';
import Link from 'next/link';

export default function SpaceDetailPage() {
  const { user } = useAuth();
  // const router = useRouter(); // Unused
  const params = useParams();
  const id = params.id as string;
  const [space, setSpace] = useState<Space | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSpace() {
      try {
        setLoading(true);
        const data = await spaceService.getSpace(id);
        setSpace(data);
      } catch (error) {
        console.error('Failed to load space', error);
      } finally {
        setLoading(false);
      }
    }

    if (user && id) {
      loadSpace();
    }
  }, [user, id]);

  if (loading) {
    return <div className="text-center p-10 text-gray-500">加载中...</div>;
  }

  if (!space) {
    return <div className="text-center p-10 text-gray-500">空间不存在或无权访问</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start border-b border-gray-200 dark:border-gray-700 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            {space.name}
            {space.isPublic && (
                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded">
                    公开
                </span>
            )}
          </h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            {space.description || '暂无描述'}
          </p>
        </div>
        <div className="flex gap-3">
          {(space.myRole === 'OWNER' || space.myRole === 'ADMIN') && (
            <Link
              href={`/spaces/${space.id}/members`}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition border border-gray-300 dark:border-gray-600"
            >
              👥 成员管理
            </Link>
          )}
          {space.myRole === 'OWNER' && (
            <Link
              href={`/spaces/${space.id}/settings`}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition border border-gray-300 dark:border-gray-600"
            >
              ⚙️ 设置
            </Link>
          )}
        </div>
      </div>

      {/* Content Area (Placeholder for Documents) */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm min-h-[400px] flex items-center justify-center border border-dashed border-gray-300 dark:border-gray-700">
        <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
                文档列表功能开发中...
            </p>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                + 新建文档
            </button>
        </div>
      </div>
    </div>
  );
}
