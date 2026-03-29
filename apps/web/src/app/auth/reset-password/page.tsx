'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';

const inputCls = 'w-full px-3 py-2.5 bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.1] rounded-lg text-[0.875rem] focus:outline-none focus:ring-2 focus:ring-[#333DFC]/20 focus:border-[#333DFC] dark:text-white transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (!token) {
      setError('无效的重置链接');
      return;
    }

    setIsLoading(true);
    try {
      await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword: password }),
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '重置失败，请重试');
    } finally {
      setIsLoading(false);
    }
  }

  if (success) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-500/[0.1]">
          <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h1 className="text-[1.375rem] font-bold text-gray-900 dark:text-white">密码重置成功</h1>
          <p className="mt-2 text-[0.8125rem] text-gray-500 dark:text-gray-400">
            请使用新密码登录。
          </p>
        </div>
        <Link
          href="/auth/login"
          className="inline-block bg-[#333DFC] hover:bg-[#2930D9] text-white text-[0.875rem] font-medium py-2.5 px-5 rounded-lg transition-colors"
        >
          前往登录
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-[1.625rem] font-bold text-gray-900 dark:text-white tracking-tight">
          重置密码
        </h1>
        <p className="mt-2 text-[0.875rem] text-gray-500 dark:text-gray-400">
          请输入你的新密码
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-[0.8125rem] font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            新密码
          </label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className={inputCls} placeholder="至少 8 个字符" />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-[0.8125rem] font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            确认新密码
          </label>
          <input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} className={inputCls} placeholder="再次输入新密码" />
        </div>

        {error && (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-50 dark:bg-red-500/[0.08] text-[0.8125rem] text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#333DFC] hover:bg-[#2930D9] disabled:opacity-50 text-white text-[0.875rem] font-medium py-2.5 px-4 rounded-lg disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? '重置中...' : '重置密码'}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
