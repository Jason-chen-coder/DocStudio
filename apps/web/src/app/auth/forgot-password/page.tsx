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
      <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50 p-10">
        <div className="space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
            <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">邮件已发送</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            如果 <strong>{email}</strong> 已注册，你将收到一封密码重置邮件。
            请查看你的收件箱（或垃圾邮件文件夹）。
          </p>
          <Link
            href="/auth/login"
            className="inline-block text-sm text-[#333DFC] hover:text-[#2930D9] font-semibold"
          >
            返回登录
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50 p-10">
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
            忘记密码
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            输入你的注册邮箱，我们将发送密码重置链接
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              邮箱
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#333DFC]/20 focus:border-[#333DFC] dark:text-white transition-all duration-200 placeholder:text-gray-400"
              placeholder="请输入你的注册邮箱"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#333DFC] hover:bg-[#2930D9] disabled:bg-[#333DFC]/50 text-white font-semibold py-3.5 px-4 rounded-xl disabled:cursor-not-allowed shadow-lg shadow-[#333DFC]/25 transition-colors"
          >
            {isLoading ? '发送中...' : '发送重置链接'}
          </button>
        </form>

        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          <Link
            href="/auth/login"
            className="text-[#333DFC] hover:text-[#2930D9] font-semibold transition-colors"
          >
            返回登录
          </Link>
        </div>
      </div>
    </div>
  );
}
