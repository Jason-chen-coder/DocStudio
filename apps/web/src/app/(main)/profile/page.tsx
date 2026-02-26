'use client';

import { useAuth } from '@/lib/auth-context';
import { useState } from 'react';
import { authAPI } from '@/lib/api';
import { Dialog, Button, Flex, Text, TextField } from '@radix-ui/themes';

import { AvatarUpload } from '@/components/avatar-upload';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (!user) {
    return null;
  }

  async function handleChangePassword(e: React.FormEvent<HTMLFormElement>) {
    // ... existing code ...
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const currentPassword = formData.get('currentPassword') as string;
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (newPassword !== confirmPassword) {
      toast.error("密码不匹配,两次输入的新密码不一致")
      setIsSubmitting(false);
      return;
    }

    try {
      await authAPI.changePassword({ currentPassword, newPassword });
      toast.success("密码修改成功,您的密码已成功更新")
      setIsDialogOpen(false);
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      toast.error(`密码修改失败,${error instanceof Error ? error.message : '密码修改失败，请稍后重试'}`)
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          个人中心
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          管理您的个人信息和账户设置
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
            基本信息
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
            您的账户详细信息
          </p>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-shrink-0">
              <AvatarUpload />
            </div>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 flex-grow">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  姓名
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white font-medium">
                  {user.name}
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  邮箱地址
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white font-medium">
                  {user.email}
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  用户 ID
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white font-mono">
                  {user.id}
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  注册时间
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {new Date(user.createdAt).toLocaleString('zh-CN')}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              安全设置
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
              管理您的密码和账户安全
            </p>
          </div>
          <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <Dialog.Trigger>
              <Button>修改密码</Button>
            </Dialog.Trigger>

            <Dialog.Content maxWidth="450px">
              <Dialog.Title>修改密码</Dialog.Title>
              <Dialog.Description size="2" mb="4">
                请输入当前密码和新密码以更新您的登录凭证。
              </Dialog.Description>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <label>
                  <Text as="div" size="2" mb="1" weight="bold">
                    当前密码
                  </Text>
                  <TextField.Root
                    type="password"
                    name="currentPassword"
                    placeholder="请输入当前密码"
                    required
                  />
                </label>
                <label>
                  <Text as="div" size="2" mb="1" weight="bold">
                    新密码
                  </Text>
                  <TextField.Root
                    type="password"
                    name="newPassword"
                    placeholder="请输入新密码"
                    required
                    minLength={8}
                  />
                  <Text as="p" size="1" color="gray" mt="1">
                    密码长度至少为 8 个字符
                  </Text>
                </label>
                <label>
                  <Text as="div" size="2" mb="1" weight="bold">
                    确认新密码
                  </Text>
                  <TextField.Root
                    type="password"
                    name="confirmPassword"
                    placeholder="请再次输入新密码"
                    required
                    minLength={8}
                  />
                </label>

                <Flex gap="3" mt="4" justify="end">
                  <Dialog.Close>
                    <Button variant="soft" color="gray">
                      取消
                    </Button>
                  </Dialog.Close>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? '更新中...' : '确认修改'}
                  </Button>
                </Flex>
              </form>
            </Dialog.Content>
          </Dialog.Root>
        </div>
      </div>
    </div>
  );
}
