'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { spaceService } from '@/services/space-service';
import { Space } from '@/types/space';
import { CreateSpaceModal } from '@/components/space/create-space-modal';
import { Tabs, Box } from '@radix-ui/themes';

export default function SpacesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadSpaces();
    }
  }, [user]);

  async function loadSpaces() {
    try {
      setLoading(true);
      const data = await spaceService.getMySpaces();
      setSpaces(data);
    } catch (error) {
      console.error('Failed to load spaces', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading && !spaces.length) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  const mySpaces = spaces.filter((space) => space.myRole === 'OWNER');
  const joinedSpaces = spaces.filter((space) => space.myRole !== 'OWNER');

  return (
    <div className="space-y-6 mt-2">
      <Tabs.Root defaultValue="my-spaces">
        <Tabs.List>
          <Tabs.Trigger value="my-spaces">我的工作空间</Tabs.Trigger>
          <Tabs.Trigger value="joined-spaces">我加入的工作空间</Tabs.Trigger>
        </Tabs.List>

        <Box pt="5">
          <Tabs.Content value="my-spaces">
            <div className="space-y-6">
              <div className="flex justify-end items-center">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 shadow-sm"
                >
                  <span>+</span> 新建空间
                </button>
              </div>

              {mySpaces.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-dashed border-gray-300 dark:border-gray-700">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    暂无工作空间
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    创建一个工作空间开始管理您的文档
                  </p>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    立即创建
                  </button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {mySpaces.map((space) => (
                    <div
                      key={space.id}
                      onClick={() => router.push(`/spaces/${space.id}`)}
                      className="group bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition cursor-pointer border border-gray-200 dark:border-gray-700 relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/spaces/${space.id}/settings`);
                          }}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-gray-600"
                          title="设置"
                        >
                          ⚙️
                        </button>
                      </div>
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate flex-1 pr-8">
                          {space.name}
                        </h3>
                        {space.isPublic && (
                          <span className="ml-2 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded">
                            公开
                          </span>
                        )}
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 line-clamp-2 min-h-[40px]">
                        {space.description || '暂无描述'}
                      </p>
                      <div className="flex justify-between items-center text-xs text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-700 pt-4">
                        <span className="flex items-center gap-1">
                          👑 所有者
                        </span>
                        <span>{new Date(space.updatedAt).toLocaleDateString()} 更新</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Tabs.Content>

          <Tabs.Content value="joined-spaces">
            <div className="space-y-6">
              {joinedSpaces.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-dashed border-gray-300 dark:border-gray-700">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    暂无工作空间
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    您还没有加入任何工作空间，如果是对方邀请您，将在这里显示
                  </p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {joinedSpaces.map((space) => (
                    <div
                      key={space.id}
                      onClick={() => router.push(`/spaces/${space.id}`)}
                      className="group bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition cursor-pointer border border-gray-200 dark:border-gray-700 relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/spaces/${space.id}/settings`);
                          }}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-gray-600"
                          title="设置"
                        >
                          ⚙️
                        </button>
                      </div>
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate flex-1 pr-8">
                          {space.name}
                        </h3>
                        {space.isPublic && (
                          <span className="ml-2 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded">
                            公开
                          </span>
                        )}
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 line-clamp-2 min-h-[40px]">
                        {space.description || '暂无描述'}
                      </p>
                      <div className="flex justify-between items-center text-xs text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-700 pt-4">
                        <span className="flex items-center gap-1">
                          👤 成员
                        </span>
                        <span>{new Date(space.updatedAt).toLocaleDateString()} 更新</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Tabs.Content>
        </Box>
      </Tabs.Root>

      {/* Modal */}
      {isModalOpen && (
        <CreateSpaceModal
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            loadSpaces();
          }}
        />
      )}
    </div>
  );
}
