'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authAPI, apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { ChevronLeft, Shield, Eye, EyeOff, Trash2 } from 'lucide-react';
import { FadeIn } from '@/components/ui/fade-in';

export default function SecuritySettingsPage() {
  const router = useRouter();
  const { logout, user } = useAuth();
  // OAuth 用户（Google/GitHub）没有设置过密码
  const isOAuthUser = !!(user as any)?.googleId || !!(user as any)?.githubId;
  const hasPassword = !isOAuthUser || !!(user as any)?.password; // password 字段已被后端剥离，所以用 OAuth 字段反推
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const currentPassword = formData.get('currentPassword') as string;
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (newPassword !== confirmPassword) {
      toast.error('两次输入的新密码不一致');
      setIsSubmitting(false);
      return;
    }

    if (newPassword.length < 8) {
      toast.error('新密码长度至少为 8 个字符');
      setIsSubmitting(false);
      return;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      toast.error('密码需包含至少一个大写字母、一个小写字母和一个数字');
      setIsSubmitting(false);
      return;
    }

    try {
      await authAPI.changePassword({ currentPassword, newPassword });
      toast.success('密码修改成功');
      router.push('/profile');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '密码修改失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <FadeIn y={16} duration={0.4}>
        <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
          <Link
            href="/profile"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            返回个人中心
          </Link>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            安全设置
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            管理密码和账号安全
          </p>
        </div>
      </FadeIn>

      {/* 修改密码表单（OAuth 用户显示提示） */}
      <FadeIn delay={0.1} y={16} duration={0.4}>
        {isOAuthUser ? (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-[18px] h-[18px] text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                    密码设置
                  </h3>
                  <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                    你当前通过第三方账号（Google / GitHub）登录，暂未设置密码
                  </p>
                </div>
              </div>
            </div>
            <div className="px-4 py-6 sm:px-6 text-sm text-gray-500 dark:text-gray-400">
              如需使用邮箱密码登录，请前往个人中心设置密码。
            </div>
          </div>
        ) :
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <Shield className="w-[18px] h-[18px] text-emerald-500" />
              </div>
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                  安全设置
                </h3>
                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                  修改后需要使用新密码重新登录
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="px-4 py-6 sm:px-6">
            <div className="max-w-md space-y-5">
              {/* 当前密码 */}
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  当前密码 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="currentPassword"
                    type={showCurrent ? 'text' : 'password'}
                    name="currentPassword"
                    required
                    placeholder="请输入当前密码"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 pr-10 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* 新密码 */}
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  新密码 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    type={showNew ? 'text' : 'password'}
                    name="newPassword"
                    required
                    minLength={8}
                    placeholder="请输入新密码"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 pr-10 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                  至少 8 个字符，需包含大写字母、小写字母和数字
                </p>
              </div>

              {/* 确认新密码 */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  确认新密码 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    name="confirmPassword"
                    required
                    minLength={8}
                    placeholder="请再次输入新密码"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 pr-10 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* 按钮 */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? '修改中...' : '确认修改'}
                </button>
                <Link
                  href="/profile"
                  className="px-5 py-2.5 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  取消
                </Link>
              </div>
            </div>
          </form>
        </div>
        }
      </FadeIn>

      {/* 危险操作区域 */}
      <FadeIn delay={0.2}>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-900/50 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">注销账号</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">永久删除你的账号及所有关联数据（空间、文档、模板等），此操作不可恢复</p>
            </div>
          </div>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-5 py-2.5 text-sm font-medium rounded-lg border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              注销我的账号
            </button>
          ) : (
            <div className="space-y-3">
              {isOAuthUser ? (
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                  你的账号通过第三方登录，确认要永久注销吗？所有数据将被删除且无法恢复。
                </p>
              ) : (
                <>
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                    请输入你的密码确认注销：
                  </p>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="当前密码"
                    className="w-full max-w-md border border-red-300 dark:border-red-700 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
                  />
                </>
              )}
              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    setIsDeleting(true);
                    try {
                      await apiRequest('/auth/delete-account', {
                        method: 'POST',
                        body: JSON.stringify({ password: deletePassword || '' }),
                      });
                      toast.success('账号已注销');
                      logout();
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : '注销失败');
                    } finally {
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting || (!isOAuthUser && !deletePassword)}
                  className="px-5 py-2.5 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isDeleting ? '注销中...' : '确认注销账号'}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeletePassword('');
                  }}
                  className="px-5 py-2.5 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          )}
        </div>
      </FadeIn>
    </div>
  );
}
