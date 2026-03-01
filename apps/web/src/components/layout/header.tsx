'use client';

import { useAuth } from '@/lib/auth-context';
import Image from 'next/image';
import Link from 'next/link';
import { getCdnUrl } from '@/lib/cdn';
import { LogOut, UserCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const { user, logout } = useAuth();

  const avatarUrl = getCdnUrl(user?.avatarUrl);

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center px-6 flex-shrink-0">
      {/* Left side (Breadcrumbs or Page Title could go here) */}
      <div className="text-sm text-gray-500">
        {/* Placeholder for breadcrumbs */}
      </div>

      {/* Right side: User Actions */}
      <div className="flex items-center gap-4">
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
            <DropdownMenuContent align="center" className="w-56" sideOffset={8}>
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
  );
}
