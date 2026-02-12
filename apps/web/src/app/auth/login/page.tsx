'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PreviewOpen, PreviewClose } from '@icon-park/react';
// LoadingScreen import removed (handled globally)

export default function LoginPage() {
  const { login, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  // Loading state is handled globally via RootLayout


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login({ email, password });
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败，请重试');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50 p-10">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
            欢迎使用 DocStudio
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            登录您的账号以继续
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
            >
              邮箱
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#333DFC]/20 focus:border-[#333DFC] dark:text-white transition-all duration-200 placeholder:text-gray-400"
              placeholder="请输入你的邮箱"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
            >
              密码
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#333DFC]/20 focus:border-[#333DFC] dark:text-white transition-all duration-200 pr-16 placeholder:text-gray-400"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#333DFC] dark:text-gray-400 dark:hover:text-[#333DFC] transition-colors"
              >
                {showPassword ? (
                  <PreviewClose theme="outline" size="20" fill="currentColor" />
                ) : (
                  <PreviewOpen theme="outline" size="20" fill="currentColor" />
                )}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="status-danger flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-interactive w-full bg-[#333DFC] hover:bg-[#2930D9] disabled:bg-[#333DFC]/50 text-white font-semibold py-3.5 px-4 rounded-xl disabled:cursor-not-allowed shadow-lg shadow-[#333DFC]/25"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                登录中...
              </span>
            ) : (
              '登录'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          还没有账号？{' '}
          <Link
            href="/auth/register"
            className="text-[#333DFC] hover:text-[#2930D9] dark:text-[#5C63FF] dark:hover:text-[#333DFC] font-semibold transition-colors"
          >
            立即注册
          </Link>
        </div>
      </div>
    </div>
  );
}
