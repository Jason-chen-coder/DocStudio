'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { setToken } from '@/lib/api';

function OAuthCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      setToken(token);
      router.replace('/dashboard');
    } else {
      router.replace('/auth/login?error=oauth_failed');
    }
  }, [searchParams, router]);

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
