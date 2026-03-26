'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { PreviewOpen, PreviewClose } from '@icon-park/react';

function LoginForm() {
  const { login, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      const returnTo = searchParams.get('returnTo');
      // Only allow relative paths to prevent open redirect (reject protocol-relative //evil.com)
      if (returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
        router.push(returnTo);
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, authLoading, router, searchParams]);

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
        <div className="form-float-in" style={{ animationDelay: '40ms' }}>
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
          <div className="form-float-in" style={{ animationDelay: '120ms' }}>
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
            >
              邮箱
            </label>
            <input
              id="email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#333DFC]/20 focus:border-[#333DFC] dark:text-white transition-all duration-200 placeholder:text-gray-400"
              placeholder="请输入你的邮箱"
            />
          </div>

          {/* Password */}
          <div className="form-float-in" style={{ animationDelay: '200ms' }}>
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

          {/* Forgot Password */}
          <div className="form-float-in flex justify-end" style={{ animationDelay: '240ms' }}>
            <Link
              href="/auth/forgot-password"
              className="text-sm text-[#333DFC] hover:text-[#2930D9] dark:text-[#5C63FF] font-medium transition-colors"
            >
              忘记密码？
            </Link>
          </div>

          {/* Error Message */}
          {error && (
            <div
              className="status-danger form-float-in flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium"
              style={{ animationDelay: '260ms' }}
            >
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
            className="btn-interactive form-float-in w-full bg-[#333DFC] hover:bg-[#2930D9] disabled:bg-[#333DFC]/50 text-white font-semibold py-3.5 px-4 rounded-xl disabled:cursor-not-allowed shadow-lg shadow-[#333DFC]/25"
            style={{ animationDelay: '300ms' }}
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

        {/* OAuth Divider */}
        <div className="form-float-in relative" style={{ animationDelay: '360ms' }}>
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-600" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white dark:bg-gray-800 px-3 text-gray-400">或</span>
          </div>
        </div>

        {/* OAuth Buttons */}
        <div className="form-float-in space-y-3" style={{ animationDelay: '400ms' }}>
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/google`}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/50 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            使用 Google 登录
          </a>
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/github`}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/50 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
            使用 GitHub 登录
          </a>
        </div>

        {/* Footer */}
        <div
          className="form-float-in text-center text-sm text-gray-500 dark:text-gray-400"
          style={{ animationDelay: '460ms' }}
        >
          还没有账号？{' '}
          <Link
            href="/auth/register"
            className="text-[#333DFC] hover:text-[#2930D9] dark:text-[#5C63FF] dark:hover:text-[#333DFC] font-semibold transition-colors"
          >
            立即注册
          </Link>
        </div>
      </div>
      <style jsx>{`
        .form-float-in {
          opacity: 0;
          transform: translateY(14px);
          animation: formFloatIn 520ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
          will-change: transform, opacity;
        }

        @keyframes formFloatIn {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .form-float-in {
            opacity: 1;
            transform: none;
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
