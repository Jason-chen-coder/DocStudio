'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter, useParams } from 'next/navigation';
import { spaceService } from '@/services/space-service';
import { Space } from '@/types/space';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function SpaceSettingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [space, setSpace] = useState<Space | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPublic: false,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }
    if (user && id) {
      loadSpace();
    }
  }, [user, authLoading, id, router]);

  async function loadSpace() {
    try {
      setLoading(true);
      const data = await spaceService.getSpace(id);
      if (data.myRole !== 'OWNER' && data.myRole !== 'ADMIN') {
        toast.error('权限错误');
        router.push(`/spaces/${id}`);
        return;
      }
      setSpace(data);
      setFormData({
        name: data.name,
        description: data.description || '',
        isPublic: data.isPublic,
      });
    } catch (error) {
      console.error('Failed to load space', error);
      router.push('/spaces');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!space) return;

    try {
      setSaving(true);
      await spaceService.updateSpace(space.id, formData);
      toast.success('更新成功');
      // toast({
      //   title: '成功',
      //   description: '工作空间设置更新成功',
      // });
      window.dispatchEvent(new CustomEvent('workspace-updated'));
      // router.push(`/spaces/${id}`);
    } catch (error) {
      toast.error('更新失败');

      // toast({
      //   toastType: 'error',
      //   title: '错误',
      //   description: '更新失败',
      //   variant: 'destructive',
      // });
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    setDeleteConfirmOpen(true);
  }

  async function confirmDelete() {
    if (!space) return;

    try {
      setSaving(true);
      await spaceService.deleteSpace(space.id);
      toast.success('删除成功');
      // toast({
      //   toastType: 'success',
      //   title: '成功',
      //   description: '工作空间已删除',
      // });
      window.dispatchEvent(new CustomEvent('workspace-updated'));
      router.push('/spaces');
    } catch (error) {
      toast.error('删除失败');
      // toast({
      //   toastType: 'error',
      //   title: '错误',
      //   description: '删除失败',
      //   variant: 'destructive',
      // });
      setSaving(false);
      setDeleteConfirmOpen(false);
    }
  }

  if (loading || !space) return <div className="p-8 text-center text-gray-500">加载中...</div>;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <button
            onClick={() => router.push(`/spaces/${id}`)}
            className="text-sm text-gray-500 hover:text-gray-900 mb-2"
          >
            ← 返回工作空间
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            工作空间设置
          </h1>
          <p className="text-gray-500 text-sm">
            管理工作空间的基本信息和设置。
          </p>
        </div>
      </div>

      <form onSubmit={handleUpdate} className="bg-white dark:bg-gray-800 shadow rounded-xl p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            空间名称
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            描述
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none h-24"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isPublic"
            checked={formData.isPublic}
            onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <label htmlFor="isPublic" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
            设为公开空间
          </label>
        </div>

        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          {space.myRole === 'OWNER' ? (
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition font-medium"
            >
              删除空间
            </button>
          ) : (
            <div></div> /* Placeholder to keep the flex layout for save button */
          )}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg transition disabled:opacity-50 hover:bg-blue-700"
            >
              {saving ? '保存中...' : '保存更改'}
            </button>
          </div>
        </div>
      </form>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除工作空间</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这个工作空间吗？此操作无法撤销，所有文档将被永久删除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>



    </div>
  );
}
