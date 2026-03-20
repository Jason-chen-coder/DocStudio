'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import Image from 'next/image';
import Link from 'next/link';
import { getCdnUrl } from '@/lib/cdn';
import { LogOut, UserCircle, Search, Moon, Sun, Settings } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SearchDialog } from './search-dialog';

export function Header() {
  const { user, logout } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().includes('MAC'));
  }, []);

  const avatarUrl = getCdnUrl(user?.avatarUrl);

  return (
    <>
      <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-6 flex-shrink-0 relative">
        {/* Left side: empty placeholder to balance the right side */}
        <div className="flex-1" />

        {/* Center: Search */}
        <div className="flex items-center justify-center">
          {user && (
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors w-96"
            >
              <Search className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 text-left">搜索...</span>
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium bg-gray-200 dark:bg-gray-600 rounded border border-gray-300 dark:border-gray-500">
                {isMac ? '⌘' : 'Ctrl'} K
              </kbd>
            </button>
          )}
        </div>

        {/* Right side: User Actions */}
        <div className="flex-1 flex items-center justify-end gap-4">
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 h-10 w-10">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt={user.name || 'User'}
                      width={40}
                      height={40}
                      unoptimized
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm select-none">
                      {(user.name || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64" sideOffset={8}>
                {/* User info header */}
                <div className="px-3 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm flex-shrink-0">
                      {avatarUrl ? (
                        <Image
                          src={avatarUrl}
                          alt={user.name || 'User'}
                          width={40}
                          height={40}
                          unoptimized
                          className="object-cover w-full h-full rounded-xl"
                        />
                      ) : (
                        (user.name || 'U').charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                    </div>
                  </div>
                </div>
                <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-700" />
                <div className="p-1">
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer py-2.5 gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                        <UserCircle className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <span className="text-sm font-medium">个人资料</span>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500">编辑头像和个人信息</p>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/spaces" className="cursor-pointer py-2.5 gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                        <Settings className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <span className="text-sm font-medium">工作空间</span>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500">管理你的工作空间</p>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                </div>
                <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-700" />
                <div className="p-1">
                  <DropdownMenuItem onClick={() => logout()} className="cursor-pointer py-2.5 gap-3 text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400 dark:focus:bg-red-900/10 focus:bg-red-50">
                    <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                      <LogOut className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">退出登录</span>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
