'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import Image from 'next/image';
import Link from 'next/link';
import { getAvatarUrl } from '@/lib/cdn';
import {
  LogOut,
  UserCircle,
  Search,
  FolderOpen,
  SlidersHorizontal,
  ChevronRight,
  Moon,
  Sun,
  Menu,
} from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';
import { NotificationBell } from '@/components/notification/notification-bell';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SearchDialog } from './search-dialog';

export function Header() {
  const { user, logout } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().includes('MAC'));
  }, []);

  const avatarUrl = getAvatarUrl(user?.avatarUrl, user?.name);
  const { theme, toggleTheme, mounted } = useTheme();

  return (
    <>
      <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 sm:px-6 flex-shrink-0 relative">
        <div className="flex-1 flex items-center gap-2">
          {/* 移动端汉堡菜单 */}
          <button
            onClick={() => {
              // 使用 CustomEvent 触发侧边栏切换
              window.dispatchEvent(new CustomEvent('toggle-mobile-sidebar'));
            }}
            className="md:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Center: Search */}
        <div className="flex items-center justify-center">
          {user && (
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors w-48 sm:w-64 md:w-96"
            >
              <Search className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 text-left">搜索...</span>
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium bg-gray-200 dark:bg-gray-600 rounded border border-gray-300 dark:border-gray-500">
                {isMac ? '⌘' : 'Ctrl'} K
              </kbd>
            </button>
          )}
        </div>

        {/* Right side */}
        <div className="flex-1 flex items-center justify-end gap-3">
          {user && (
            <>
              {mounted && (
                <button
                  onClick={toggleTheme}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  aria-label={theme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'}
                >
                  {theme === 'dark' ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
                </button>
              )}
              <NotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="relative rounded-full outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-all group"
                    aria-label="用户菜单"
                  >
                    <div className="h-9 w-9 rounded-full overflow-hidden ring-2 ring-gray-200/80 dark:ring-gray-600/60 group-hover:ring-blue-400/60 dark:group-hover:ring-blue-500/40 transition-all">
                      {avatarUrl ? (
                        <Image
                          src={avatarUrl}
                          alt={user.name || 'User'}
                          width={36}
                          height={36}
                          unoptimized
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm select-none">
                          {initial}
                        </div>
                      )}
                    </div>
                    {/* Online indicator */}
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-gray-800" />
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="w-72 p-0 overflow-hidden"
                  sideOffset={8}
                >
                  {/* ── User card ── */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-blue-950/30 dark:to-indigo-950/20 px-4 pt-5 pb-4">
                    <div className="flex items-center gap-3.5">
                      <div className="relative">
                        <div className="w-11 h-11 rounded-full overflow-hidden ring-2 ring-white/80 dark:ring-gray-700/80 shadow-sm">
                          {avatarUrl ? (
                            <Image
                              src={avatarUrl}
                              alt={user.name || 'User'}
                              width={44}
                              height={44}
                              unoptimized
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-base select-none">
                              {initial}
                            </div>
                          )}
                        </div>
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-gray-800" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-50 truncate leading-tight">
                          {user.name}
                        </p>
                        <p className="text-[12px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ── Nav items ── */}
                  <div className="py-1.5 px-1.5">
                    {[
                      {
                        href: '/profile',
                        icon: UserCircle,
                        label: '个人中心',
                      },
                      // {
                      //   href: '/spaces',
                      //   icon: FolderOpen,
                      //   label: '工作空间',
                      // },
                      {
                        href: '/settings',
                        icon: SlidersHorizontal,
                        label: '设置',
                      },
                    ].map((item) => (
                      <DropdownMenuItem key={item.href} asChild>
                        <Link
                          href={item.href}
                          className="cursor-pointer flex items-center gap-3 px-3 py-2.5 rounded-lg group/item"
                        >
                          <item.icon className="h-[18px] w-[18px] text-gray-400 dark:text-gray-500 group-hover/item:text-gray-600 dark:group-hover/item:text-gray-300 transition-colors" />
                          <span className="flex-1 text-[13px] font-medium text-gray-700 dark:text-gray-200">
                            {item.label}
                          </span>
                          <ChevronRight className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600 opacity-0 -translate-x-1 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all duration-150" />
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </div>

                  <DropdownMenuSeparator className="mx-2 my-0" />

                  {/* ── Logout ── */}
                  <div className="py-1.5 px-1.5">
                    <DropdownMenuItem
                      onClick={() => logout()}
                      className="cursor-pointer flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-500 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400 focus:bg-red-50 dark:focus:bg-red-500/10"
                    >
                      <LogOut className="h-[18px] w-[18px]" />
                      <span className="text-[13px] font-medium">退出登录</span>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </header>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
