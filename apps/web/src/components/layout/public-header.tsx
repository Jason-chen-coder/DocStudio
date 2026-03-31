'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { getCdnUrl } from '@/lib/cdn';
import { LogOut, LayoutDashboard, UserCircle, FolderOpen, SlidersHorizontal, ChevronRight, Github, Sun, Moon, Menu, X } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function PublicHeader() {
    const { user, logout } = useAuth();
    const { theme, toggleTheme, mounted } = useTheme();
    const pathname = usePathname();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isNarrow, setIsNarrow] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [menuAnimating, setMenuAnimating] = useState(false);

    const toggleMobileMenu = (open: boolean) => {
        if (open) {
            setMenuAnimating(true);
            setMobileMenuOpen(true);
        } else {
            setMobileMenuOpen(false);
            setTimeout(() => setMenuAnimating(false), 300);
        }
    };

    const isHomePage = pathname === '/';
    const isCompact = isScrolled || isNarrow;
    const isTransparent = isHomePage && !isCompact;

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 64);
        };

        const mql = window.matchMedia('(max-width: 768px)');
        const handleMedia = (e: MediaQueryListEvent | MediaQueryList) => {
            setIsNarrow(e.matches);
        };

        handleMedia(mql);
        mql.addEventListener('change', handleMedia as (e: MediaQueryListEvent) => void);
        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();

        return () => {
            mql.removeEventListener('change', handleMedia as (e: MediaQueryListEvent) => void);
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    return (
        <header
            className={cn(
                "fixed left-1/2 -translate-x-1/2 z-50",
                isTransparent
                    ? "bg-white/0 dark:bg-gray-900/0 shadow-none backdrop-blur-none border-transparent"
                    : isCompact
                        ? "bg-white/75 dark:bg-gray-900/60 shadow-lg backdrop-blur-2xl border-white/60 dark:border-white/[0.1]"
                        : "bg-white/80 dark:bg-gray-900/80 shadow-sm backdrop-blur-md border-transparent"
            )}
            style={{
                width: isCompact ? 'calc(100% - 32px)' : '100%',
                maxWidth: isCompact ? '1024px' : '100%',
                top: isCompact ? '12px' : '0px',
                borderRadius: (mobileMenuOpen || menuAnimating) ? '24px' : isCompact ? '9999px' : '0px',
                borderWidth: '1px',
                borderStyle: 'solid',
                transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1), max-width 0.5s cubic-bezier(0.4, 0, 0.2, 1), top 0.5s cubic-bezier(0.4, 0, 0.2, 1), backdrop-filter 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
        >
            <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between max-w-7xl mx-auto">
                <div className="flex-1 flex justify-start">
                    <Link href="/" className="flex items-center gap-3 relative group">
                        <Image src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/docStudio_icon.png`} alt="DocStudio" width={32} height={32} style={{ width: 32, height: 'auto' }} />

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
                    {[
                        { href: '/', label: '首页' },
                        { href: '/explore', label: '探索' },
                        { href: '/help', label: '帮助' },
                        { href: '/contact', label: '联系' },
                    ].map(({ href, label }) => (
                        <Link
                            key={href}
                            href={href}
                            className={cn(
                                "text-sm font-medium transition-colors duration-300",
                                pathname === href
                                    ? (isTransparent ? "text-white drop-shadow-sm" : "text-blue-600 dark:text-blue-400")
                                    : (isTransparent ? "text-white/80 hover:text-white drop-shadow-sm" : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white")
                            )}
                        >
                            {label}
                        </Link>
                    ))}
                </nav>

                {/* Right Auth Buttons — Desktop */}
                <div className="flex-1 flex items-center justify-end gap-4">
                    {user ? (
                        <>
                        {mounted && (
                            <button
                                type="button"
                                onClick={toggleTheme}
                                aria-label={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
                                className={cn(
                                    "hidden md:flex p-1.5 rounded-lg transition-all duration-200",
                                    isTransparent
                                        ? "text-white/80 hover:text-white hover:bg-white/10"
                                        : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.07]"
                                )}
                            >
                                {theme === 'dark'
                                    ? <Sun className="h-[18px] w-[18px]" />
                                    : <Moon className="h-[18px] w-[18px]" />
                                }
                            </button>
                        )}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className={cn(
                                    "hidden md:flex rounded-full overflow-hidden outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 h-9 w-9 border-2",
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
                            <DropdownMenuContent align="end" className="w-72 p-0 overflow-hidden" sideOffset={8}>
                                {/* ── User card ── */}
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-blue-950/30 dark:to-indigo-950/20 px-4 pt-5 pb-4">
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-11 h-11 rounded-full overflow-hidden ring-2 ring-white/80 dark:ring-gray-700/80 shadow-sm flex-shrink-0">
                                            {user.avatarUrl ? (
                                                <Image
                                                    src={getCdnUrl(user.avatarUrl) || ''}
                                                    alt={user.name || 'User'}
                                                    width={44}
                                                    height={44}
                                                    unoptimized
                                                    className="object-cover w-full h-full"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-base select-none">
                                                    {(user.name || 'U').charAt(0).toUpperCase()}
                                                </div>
                                            )}
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
                                        { href: '/dashboard', icon: LayoutDashboard, label: '进入控制台' },
                                        { href: '/profile', icon: UserCircle, label: '个人中心' },
                                        // { href: '/spaces', icon: FolderOpen, label: '工作空间' },
                                        { href: '/settings', icon: SlidersHorizontal, label: '设置' },
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
                    ) : (
                        <>
                            {/* GitHub icon — desktop only */}
                            <a
                                href="https://github.com/Jason-chen-coder/DocStudio"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="GitHub"
                                className={cn(
                                    "hidden md:flex p-1.5 rounded-lg transition-all duration-200",
                                    isTransparent
                                        ? "text-white/80 hover:text-white hover:bg-white/10"
                                        : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.07]"
                                )}
                            >
                                <Github className="h-[18px] w-[18px]" />
                            </a>

                            {/* Theme toggle — desktop only */}
                            {mounted && (
                                <button
                                    type="button"
                                    onClick={toggleTheme}
                                    aria-label={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
                                    className={cn(
                                        "hidden md:flex p-1.5 rounded-lg transition-all duration-200",
                                        isTransparent
                                            ? "text-white/80 hover:text-white hover:bg-white/10"
                                            : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.07]"
                                    )}
                                >
                                    {theme === 'dark'
                                        ? <Sun className="h-[18px] w-[18px]" />
                                        : <Moon className="h-[18px] w-[18px]" />
                                    }
                                </button>
                            )}

                            {/* Login — desktop only */}
                            <Link
                                href="/auth/login"
                                className={cn(
                                    "hidden md:inline-flex text-sm font-medium px-3.5 py-1.5 rounded-lg transition-all duration-200",
                                    isTransparent
                                        ? "bg-white/15 text-white border border-white/30 backdrop-blur-sm hover:bg-white/25 hover:border-white/50 shadow-[0_0_15px_rgba(255,255,255,0.15)]"
                                        : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md"
                                )}
                            >
                                登录
                            </Link>
                        </>
                    )}

                    {/* Mobile hamburger */}
                    <button
                        type="button"
                        onClick={() => toggleMobileMenu(!mobileMenuOpen)}
                        aria-label={mobileMenuOpen ? '关闭菜单' : '打开菜单'}
                        className={cn(
                            "md:hidden p-1.5 rounded-lg transition-all duration-200",
                            isTransparent
                                ? "text-white/80 hover:text-white hover:bg-white/10"
                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.07]"
                        )}
                    >
                        {mobileMenuOpen
                            ? <X className="h-5 w-5" />
                            : <Menu className="h-5 w-5" />
                        }
                    </button>
                </div>
            </div>

            {/* Mobile menu panel */}
            <div
                className={cn(
                    "md:hidden overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
                    mobileMenuOpen ? "max-h-[400px]" : "max-h-0"
                )}
            >
              <div
                className={cn(
                    "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
                    mobileMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
                )}
              >
                <nav className="px-5 pt-2 pb-5 space-y-1">
                    {[
                        { href: '/', label: '首页' },
                        { href: '/explore', label: '探索' },
                        { href: '/help', label: '帮助' },
                        { href: '/contact', label: '联系' },
                    ].map(({ href, label }) => (
                        <Link
                            key={href}
                            href={href}
                            onClick={() => toggleMobileMenu(false)}
                            className={cn(
                                "block px-3 py-3 rounded-lg text-[15px] font-medium transition-colors",
                                pathname === href
                                    ? "text-blue-600 dark:text-blue-400"
                                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.05]"
                            )}
                        >
                            {label}
                        </Link>
                    ))}

                    {/* Mobile auth actions */}
                    {user ? (
                        <div className="pt-2 border-t border-gray-200 dark:border-white/[0.08] mt-2 space-y-1">
                            {[
                                { href: '/dashboard', label: '进入控制台' },
                                { href: '/profile', label: '个人中心' },
                                { href: '/settings', label: '设置' },
                            ].map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => toggleMobileMenu(false)}
                                    className="block px-3 py-3 rounded-lg text-[15px] font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors"
                                >
                                    {item.label}
                                </Link>
                            ))}
                            <button
                                onClick={() => { logout(); toggleMobileMenu(false); }}
                                className="w-full text-left px-3 py-3 rounded-lg text-[15px] font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                            >
                                退出登录
                            </button>
                        </div>
                    ) : (
                        <div className="pt-2 border-t border-gray-200 dark:border-white/[0.08] mt-2">
                            <Link
                                href="/auth/login"
                                onClick={() => toggleMobileMenu(false)}
                                className="block px-3 py-3 rounded-lg text-[15px] font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                            >
                                登录
                            </Link>
                        </div>
                    )}
                </nav>
              </div>
            </div>
        </header>
    );
}
