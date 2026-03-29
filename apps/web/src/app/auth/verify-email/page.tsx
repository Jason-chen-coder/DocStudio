'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('无效的验证链接');
      return;
    }

    apiRequest<{ message: string }>(`/auth/verify-email?token=${token}`)
      .then((res) => {
        setStatus('success');
        setMessage(res.message);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : '验证失败');
      });
  }, [token]);

  return (
    <div className="space-y-6 text-center">
      {status === 'loading' && (
        <>
          <div className="mx-auto flex h-10 w-10 items-center justify-center">
            <svg className="animate-spin h-6 w-6 text-[#333DFC]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <h1 className="text-[1.375rem] font-bold text-gray-900 dark:text-white">正在验证...</h1>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-500/[0.1]">
            <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h1 className="text-[1.375rem] font-bold text-gray-900 dark:text-white">邮箱验证成功</h1>
            <p className="mt-2 text-[0.8125rem] text-gray-500 dark:text-gray-400">{message}</p>
          </div>
          <Link
            href="/dashboard"
            className="inline-block bg-[#333DFC] hover:bg-[#2930D9] text-white text-[0.875rem] font-medium py-2.5 px-5 rounded-lg transition-colors"
          >
            进入工作台
          </Link>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/[0.1]">
            <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div>
            <h1 className="text-[1.375rem] font-bold text-gray-900 dark:text-white">验证失败</h1>
            <p className="mt-2 text-[0.8125rem] text-gray-500 dark:text-gray-400">{message}</p>
          </div>
          <Link
            href="/auth/login"
            className="inline-block text-[0.8125rem] text-[#333DFC] hover:text-[#2930D9] font-medium transition-colors"
          >
            返回登录
          </Link>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
