'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { getCdnUrl } from '@/lib/cdn';
import { LogOut, LayoutDashboard } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function PublicHeader() {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const [isScrolled, setIsScrolled] = useState(false);

    const isHomePage = pathname === '/';
    // State 1 condition
    const isTransparent = isHomePage && !isScrolled;

    useEffect(() => {
        const handleScroll = () => {
            // Header height is 64px (h-16)
            if (window.scrollY > 64) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        // Initial check
        handleScroll();

        return () => window.removeEventListener('scroll', handleScroll);
    }, []); // Only bind event listener once

    return (
        <header className={cn(
            "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
            isTransparent
                ? "bg-white/0 dark:bg-gray-900/0 shadow-none backdrop-blur-none"
                : "bg-white/80 dark:bg-gray-900/80 shadow-sm backdrop-blur-md"
        )}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                <div className="flex-1 flex justify-start">
                    <Link href="/" className="flex items-center gap-3 relative group">
                        <Image src="/docStudio_icon.png" alt="DocStudio" width={32} height={32} />

                        {/* Wrapper for smooth cross-fade of gradient text */}
                        <div className="relative flex items-center">
                            {/* State 1: Solid White Text */}
                            <h1 className={cn(
                                "text-xl font-bold transition-opacity duration-300 text-white drop-shadow-md",
                                isTransparent ? "opacity-100" : "opacity-0"
                            )}>
                                DocStudio
                            </h1>
                            {/* State 2: Gradient Text */}
                            <h1 className={cn(
                                "text-xl font-bold transition-opacity duration-300 absolute left-0 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400",
                                isTransparent ? "opacity-0" : "opacity-100"
                            )}>
                                DocStudio
                            </h1>
                        </div>
                    </Link>
                </div>

                {/* Center Navigation */}
                <nav className="hidden md:flex items-center gap-8 justify-center">
                    <Link
                        href="/"
                        className={cn(
                            "text-sm font-medium transition-colors duration-300",
                            pathname === '/'
                                ? (isTransparent ? "text-white drop-shadow-sm" : "text-blue-600 dark:text-blue-400")
                                : (isTransparent ? "text-white/80 hover:text-white drop-shadow-sm" : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white")
                        )}
                    >
                        首页
                    </Link>
                    <Link
                        href="/explore"
                        className={cn(
                            "text-sm font-medium transition-colors duration-300",
                            pathname === '/explore'
                                ? (isTransparent ? "text-white drop-shadow-sm" : "text-blue-600 dark:text-blue-400")
                                : (isTransparent ? "text-white/80 hover:text-white drop-shadow-sm" : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white")
                        )}
                    >
                        探索
                    </Link>
                </nav>

                {/* Right Auth Buttons */}
                <div className="flex-1 flex items-center justify-end gap-4">
                    {user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className={cn(
                                    "rounded-full overflow-hidden outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 h-9 w-9 border-2",
                                    isTransparent
                                        ? "border-white/50 hover:border-white bg-white/20 backdrop-blur-md shadow-none"
                                        : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md"
                                )}>
                                    {user.avatarUrl ? (
                                        <Image
                                            src={getCdnUrl(user.avatarUrl) || ''}
                                            alt={user.name || 'User'}
                                            width={36}
                                            height={36}
                                            unoptimized
                                            className="object-cover w-full h-full"
                                        />
                                    ) : (
                                        <div className={cn(
                                            "w-full h-full flex items-center justify-center font-bold text-sm transition-colors duration-300",
                                            isTransparent
                                                ? "text-white"
                                                : "text-blue-600 dark:text-blue-400"
                                        )}>
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
                                    <Link href="/dashboard" className="cursor-pointer py-2.5">
                                        <LayoutDashboard className="mr-2 h-4 w-4" />
                                        <span>进入控制台</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => logout()} className="cursor-pointer py-2.5 text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400 dark:focus:bg-red-900/10 focus:bg-red-50">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>退出登录</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <>
                            <Link href="/auth/login" className={cn(
                                "text-sm font-medium transition-colors duration-300",
                                isTransparent
                                    ? "text-white/90 hover:text-white drop-shadow-sm"
                                    : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                            )}>
                                登录
                            </Link>
                            <Link href="/auth/register" className={cn(
                                "text-sm font-medium px-5 py-2 rounded-full transition-all duration-300 border",
                                isTransparent
                                    ? "bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border-white/30 shadow-none"
                                    : "bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 border-transparent shadow-sm"
                            )}>
                                免费注册
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
