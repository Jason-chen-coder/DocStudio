'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import Image from 'next/image';
import Link from 'next/link';
import { getCdnUrl } from '@/lib/cdn';
import { LogOut, UserCircle, Search } from 'lucide-react';
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
                <button className="rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-blue-500 transition-shadow shadow-sm hover:shadow-md h-9 w-9">
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
                    <div className="w-full h-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm select-none">
                      {(user.name || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56" sideOffset={8}>
                <DropdownMenuLabel className="font-normal py-3">
                  <div className="flex flex-col space-y-1.5">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground truncate">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer py-2.5">
                    <UserCircle className="mr-2 h-4 w-4" />
                    <span>个人资料</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()} className="cursor-pointer py-2.5 text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400 dark:focus:bg-red-900/10 focus:bg-red-50">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>退出登录</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
