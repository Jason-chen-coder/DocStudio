'use client';

import { useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送失败，请重试');
    } finally {
      setIsLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-500/[0.1]">
          <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h1 className="text-[1.375rem] font-bold text-gray-900 dark:text-white">邮件已发送</h1>
          <p className="mt-2 text-[0.8125rem] text-gray-500 dark:text-gray-400 leading-relaxed">
            如果 <strong className="text-gray-700 dark:text-gray-300">{email}</strong> 已注册，你将收到一封密码重置邮件。
          </p>
        </div>
        <Link
          href="/auth/login"
          className="inline-block text-[0.8125rem] text-[#333DFC] hover:text-[#2930D9] font-medium transition-colors"
        >
          返回登录
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-[1.625rem] font-bold text-gray-900 dark:text-white tracking-tight">
          忘记密码
        </h1>
        <p className="mt-2 text-[0.875rem] text-gray-500 dark:text-gray-400">
          输入你的注册邮箱，我们将发送重置链接
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-[0.8125rem] font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            邮箱地址
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2.5 bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.1] rounded-lg text-[0.875rem] focus:outline-none focus:ring-2 focus:ring-[#333DFC]/20 focus:border-[#333DFC] dark:text-white transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500"
            placeholder="you@example.com"
          />
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
          {isLoading ? '发送中...' : '发送重置链接'}
        </button>
      </form>

      <p className="text-center text-[0.8125rem] text-gray-500 dark:text-gray-400">
        <Link
          href="/auth/login"
          className="text-[#333DFC] hover:text-[#2930D9] dark:text-[#6C72FF] font-medium transition-colors"
        >
          返回登录
        </Link>
      </p>
    </div>
  );
}
