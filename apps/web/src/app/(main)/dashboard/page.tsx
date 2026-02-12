'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          欢迎回来，{user.name}！
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          这是您的个人工作台，开始创建和管理您的文档吧
        </p>
      </div>

      {/* User Info Card */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            用户信息
          </h3>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">
                用户 ID
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white font-mono">
                {user.id}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">
                邮箱
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                {user.email}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">
                姓名
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                {user.name}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">
                注册时间
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                {new Date(user.createdAt).toLocaleString('zh-CN')}
              </dd>
            </div>
          </dl>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            快速操作
          </h3>
          <div className="space-y-3">
            <button
                onClick={() => router.push('/spaces')}
                className="w-full text-left px-4 py-3 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg shadow-sm transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-gray-900 dark:text-white font-medium">
                  管理工作空间
                </span>
                <span className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300">
                  →
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                查看、创建或管理您的所有协作空间
              </p>
            </button>
            <button className="w-full text-left px-4 py-3 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg shadow-sm transition group">
              <div className="flex items-center justify-between">
                <span className="text-gray-900 dark:text-white font-medium">
                  创建新文档
                </span>
                <span className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300">
                  →
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                快速创建一个文档 (即将推出)
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
