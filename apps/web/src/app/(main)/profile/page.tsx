'use client';

import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { AvatarUpload } from '@/components/avatar-upload';
import { FadeIn } from '@/components/ui/fade-in';
import { ChevronRight, Shield } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <FadeIn y={16} duration={0.4}>
        <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            个人中心
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            管理您的个人信息和账户设置
          </p>
        </div>
      </FadeIn>

      <FadeIn delay={0.1} y={16} duration={0.4}>
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
            基本信息
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
            您的账户详细信息
          </p>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-shrink-0">
              <AvatarUpload />
            </div>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 flex-grow">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  姓名
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white font-medium">
                  {user.name}
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  邮箱地址
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white font-medium">
                  {user.email}
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  用户 ID
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white font-mono">
                  {user.id}
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  注册时间
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {new Date(user.createdAt).toLocaleString('zh-CN')}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
      </FadeIn>

      <FadeIn delay={0.2} y={16} duration={0.4}>
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
            安全设置
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
            管理您的密码和账户安全
          </p>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700/60">
          <Link
            href="/settings/security"
            className="flex items-center gap-4 px-4 py-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
              <Shield className="w-[18px] h-[18px] text-emerald-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                修改密码
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                更新您的登录密码
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors flex-shrink-0" />
          </Link>
        </div>
      </div>
      </FadeIn>
    </div>
  );
}
