'use client';

import { useState, useEffect } from 'react';
import { spaceService } from '@/services/space-service';
import { useToast } from '@/hooks/use-toast';
import { FolderOpen, Globe, Lock, X } from 'lucide-react';

interface CreateSpaceModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateSpaceModal({ onClose, onSuccess }: CreateSpaceModalProps) {
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPublic: false,
  });
  const { toast } = useToast();

  // Trigger enter animation on mount
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 200); // Wait for exit animation
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      setLoading(true);
      await spaceService.createSpace(formData);
      toast({
        toastType: 'success',
        title: '创建成功',
        description: '工作空间已创建',
      });
      window.dispatchEvent(new CustomEvent('workspace-updated'));
      setVisible(false);
      setTimeout(onSuccess, 200);
    } catch (error) {
      console.error('Failed to create space', error);
      toast({
        toastType: 'error',
        title: '创建失败',
        description: '请重试',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200 ${
        visible ? 'bg-black/40 backdrop-blur-sm' : 'bg-black/0'
      }`}
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md transition-all duration-200 ease-out ${
          visible
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 translate-y-4'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                创建工作空间
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">组织文档，与团队协作</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 pt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              空间名称 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:border-blue-400 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-gray-800 outline-none transition text-sm"
              placeholder="例如：团队知识库"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              描述
              <span className="text-xs font-normal text-gray-400 ml-1">可选</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:border-blue-400 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-gray-800 outline-none transition resize-none h-20 text-sm"
              placeholder="简要描述这个空间的用途..."
            />
          </div>

          {/* Visibility toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              可见性
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isPublic: false })}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-sm transition cursor-pointer ${
                  !formData.isPublic
                    ? 'border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <Lock className="w-4 h-4 flex-shrink-0" />
                <div className="text-left">
                  <p className="font-medium text-[13px]">私有</p>
                  <p className="text-[11px] opacity-70">仅成员可见</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isPublic: true })}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-sm transition cursor-pointer ${
                  formData.isPublic
                    ? 'border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <Globe className="w-4 h-4 flex-shrink-0" />
                <div className="text-left">
                  <p className="font-medium text-[13px]">公开</p>
                  <p className="text-[11px] opacity-70">所有人可见</p>
                </div>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className="flex-1 px-4 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? '创建中...' : '创建空间'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
