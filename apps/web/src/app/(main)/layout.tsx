'use client';

import { useAuth } from '@/lib/auth-context';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { OnboardingModal } from '@/components/onboarding/onboarding-modal';
import { useRouter } from 'next/navigation';
import { useEffect, useState, createContext, useContext } from 'react';

// 移动端侧边栏状态 Context
const MobileSidebarContext = createContext<{
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
}>({ isOpen: false, toggle: () => {}, close: () => {} });

export function useMobileSidebar() {
  return useContext(MobileSidebarContext);
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    }
  }, [isLoading, user, router]);

  // 监听移动端汉堡菜单事件
  useEffect(() => {
    const handler = () => setSidebarOpen((v) => !v);
    window.addEventListener('toggle-mobile-sidebar', handler);
    return () => window.removeEventListener('toggle-mobile-sidebar', handler);
  }, []);

  // Loading state is now handled globally
  if (isLoading) return null;

  if (!user) return null;

  return (
    <MobileSidebarContext.Provider
      value={{
        isOpen: sidebarOpen,
        toggle: () => setSidebarOpen((v) => !v),
        close: () => setSidebarOpen(false),
      }}
    >
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
        {/* 新用户引导 */}
        <OnboardingModal />

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar — 桌面端固定显示，移动端抽屉式 */}
        <div
          className={`
            fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-200 ease-in-out
            md:relative md:translate-x-0 md:z-auto
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <Sidebar />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header />

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 scroll-smooth">
            {children}
          </main>
        </div>
      </div>
    </MobileSidebarContext.Provider>
  );
}
