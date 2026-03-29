'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { setToken, setRefreshToken } from '@/lib/api';

function OAuthCallbackContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refresh_token');

    if (!token) {
      window.location.replace('/auth/login?error=oauth_failed');
      return;
    }

    // 先存 token，再做全页刷新跳转
    // 用 window.location.replace 而不是 router.replace，
    // 确保 AuthProvider 重新 mount 时 localStorage 里已有 token，
    // 避免 checkAuth() 与 setToken() 的 race condition
    setToken(token);
    if (refreshToken) setRefreshToken(refreshToken);
    window.location.replace('/dashboard');
  }, [searchParams]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-lg p-10 text-center">
      <div className="flex items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-[#333DFC]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
      <p className="mt-4 text-gray-500 dark:text-gray-400">正在登录...</p>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense>
      <OAuthCallbackContent />
    </Suspense>
  );
}
