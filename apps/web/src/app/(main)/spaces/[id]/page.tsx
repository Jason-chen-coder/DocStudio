'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter, useParams } from 'next/navigation';
import { spaceService } from '@/services/space-service';
import { Space } from '@/types/space';
import Link from 'next/link';
import { useDocuments } from '@/hooks/use-documents';
import { FileText, Plus } from 'lucide-react';

export default function SpaceDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [space, setSpace] = useState<Space | null>(null);
  const [spaceLoading, setSpaceLoading] = useState(true);
  
  const { documents, loading: docsLoading, createDocument } = useDocuments(id);

  useEffect(() => {
    async function loadSpace() {
      try {
        setSpaceLoading(true);
        const data = await spaceService.getSpace(id);
        setSpace(data);
      } catch (error) {
        console.error('Failed to load space', error);
      } finally {
        setSpaceLoading(false);
      }
    }

    if (user && id) {
      loadSpace();
    }
  }, [user, id]);

  const handleCreate = async () => {
    try {
      const newDoc = await createDocument({
        title: '无标题文档',
        spaceId: id,
      });
      router.push(`/spaces/${id}/documents/${newDoc.id}`);
    } catch {
      // Toast handled in hook
    }
  };

  if (spaceLoading) {
    return <div className="text-center p-10 text-gray-500">加载中...</div>;
  }

  if (!space) {
    return <div className="text-center p-10 text-gray-500">空间不存在或无权访问</div>;
  }

  const hasDocuments = documents.length > 0;

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

      {/* Content Area */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm min-h-[400px] p-6 border border-gray-200 dark:border-gray-700">
        
        {docsLoading ? (
            <div className="text-center p-10 text-gray-400">加载文档中...</div>
        ) : !hasDocuments ? (
            <div className="flex flex-col items-center justify-center h-[300px] border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                    此空间暂无文档
                </p>
                <button 
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                    <Plus className="w-4 h-4" />
                    新建文档
                </button>
            </div>
        ) : (
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">最近文档</h2>
                    <button 
                        onClick={handleCreate}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                         <Plus className="w-4 h-4" />
                         新建文档
                    </button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {/* Show a few recent documents */}
                    {documents.slice(0, 6).map(doc => (
                        <Link 
                            key={doc.id}
                            href={`/spaces/${space.id}/documents/${doc.id}`}
                            className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition bg-gray-50 dark:bg-gray-900/50"
                        >
                            <div className="flex items-start gap-3">
                                <FileText className="w-8 h-8 text-blue-500 mt-1" />
                                <div>
                                    <h3 className="font-medium text-gray-900 dark:text-gray-100 line-clamp-1">{doc.title}</h3>
                                    <p className="text-xs text-gray-400 mt-1">
                                        更新于 {new Date(doc.updatedAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        )}

      </div>
    </div>
  );
}
