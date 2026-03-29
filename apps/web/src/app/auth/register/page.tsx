'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PreviewOpen, PreviewClose } from '@icon-park/react';

export default function RegisterPage() {
  const { register, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (!agreedToTerms) {
      setError('请先同意服务条款和隐私政策');
      return;
    }

    setIsLoading(true);

    try {
      await register({
        email: formData.email,
        name: formData.name,
        password: formData.password,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败，请重试');
    } finally {
      setIsLoading(false);
    }
  }

  const inputCls = 'w-full px-3 py-2.5 bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.1] rounded-lg text-[0.875rem] focus:outline-none focus:ring-2 focus:ring-[#333DFC]/20 focus:border-[#333DFC] dark:text-white transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-[1.625rem] font-bold text-gray-900 dark:text-white tracking-tight">
          创建账号
        </h1>
        <p className="mt-2 text-[0.875rem] text-gray-500 dark:text-gray-400">
          加入 DocStudio，开启协作之旅
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-[0.8125rem] font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            姓名
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            required
            className={inputCls}
            placeholder="你的名字"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-[0.8125rem] font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            邮箱地址
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            className={inputCls}
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-[0.8125rem] font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            密码
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              required
              minLength={8}
              className={`${inputCls} pr-12`}
              placeholder="至少 8 个字符"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
            >
              {showPassword ? (
                <PreviewClose theme="outline" size="18" fill="currentColor" />
              ) : (
                <PreviewOpen theme="outline" size="18" fill="currentColor" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-[0.8125rem] font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            确认密码
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            minLength={8}
            className={inputCls}
            placeholder="再次输入密码"
          />
        </div>

        {/* Terms */}
        <div className="flex items-start gap-2 pt-1">
          <input
            id="terms"
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#333DFC] focus:ring-[#333DFC]/20"
          />
          <label htmlFor="terms" className="text-[0.75rem] text-gray-500 dark:text-gray-400 leading-relaxed">
            我已阅读并同意{' '}
            <Link href="/terms" className="text-[#333DFC] hover:underline" target="_blank">服务条款</Link>
            {' '}和{' '}
            <Link href="/privacy" className="text-[#333DFC] hover:underline" target="_blank">隐私政策</Link>
          </label>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-50 dark:bg-red-500/[0.08] text-[0.8125rem] text-red-600 dark:text-red-400">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#333DFC] hover:bg-[#2930D9] disabled:opacity-50 text-white text-[0.875rem] font-medium py-2.5 px-4 rounded-lg disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              注册中...
            </span>
          ) : (
            '创建账号'
          )}
        </button>
      </form>

      {/* Footer */}
      <p className="text-center text-[0.8125rem] text-gray-500 dark:text-gray-400">
        已有账号？{' '}
        <Link
          href="/auth/login"
          className="text-[#333DFC] hover:text-[#2930D9] dark:text-[#6C72FF] font-medium transition-colors"
        >
          登录
        </Link>
      </p>
    </div>
  );
}
