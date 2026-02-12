'use client';

import { useAuth } from '@/lib/auth-context';
import { AlertDialog, Button, Flex, Avatar } from '@radix-ui/themes';
import Link from 'next/link';

export function Header() {
  const { user, logout } = useAuth();
  
  const avatarUrl = user?.avatarUrl 
    ? (user.avatarUrl.startsWith('http') ? user.avatarUrl : `${process.env.NEXT_PUBLIC_API_URL}${user.avatarUrl}`)
    : undefined;

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center px-6 flex-shrink-0">
      {/* Left side (Breadcrumbs or Page Title could go here) */}
      <div className="text-sm text-gray-500">
        {/* Placeholder for breadcrumbs */}
      </div>

      {/* Right side: User Actions */}
      <div className="flex items-center gap-4">
        {user && (
          <Link href="/profile" className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg p-2 transition-colors duration-200">
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {user.name}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {user.email}
              </span>
            </div>
            <Avatar
              size="2"
              src={avatarUrl}
              fallback={user.name[0].toUpperCase()}
              radius="full"
            />
          </Link>
        )}
        <AlertDialog.Root>
          <AlertDialog.Trigger>
            <button
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
              title="登出"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 01-3-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </AlertDialog.Trigger>
          <AlertDialog.Content maxWidth="450px">
            <AlertDialog.Title>确认退出</AlertDialog.Title>
            <AlertDialog.Description size="2">
              您确定要退出登录吗？您将无法访问您的文档，直到再次登录。
            </AlertDialog.Description>

            <Flex gap="3" mt="4" justify="end">
              <AlertDialog.Cancel>
                <Button variant="soft" color="gray">
                  取消
                </Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action>
                <Button variant="solid" color="red" onClick={logout}>
                  确认退出
                </Button>
              </AlertDialog.Action>
            </Flex>
          </AlertDialog.Content>
        </AlertDialog.Root>
      </div>
    </header>
  );
}
