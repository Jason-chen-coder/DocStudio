'use client';

import { useState } from 'react';
import { templateService } from '@/services/template-service';
import type { TemplateCategory, TemplateScope } from '@/types/template';
import { CATEGORY_LABELS, ALL_CATEGORIES, SCOPE_LABELS } from '@/types/template';
import { X, Loader2, BookTemplate } from 'lucide-react';
import { toast } from 'sonner';

interface SaveAsTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  documentTitle: string;
  /** Current Tiptap JSON content from editor (optional, fallback to server-side) */
  editorContent?: string;
}

export function SaveAsTemplateDialog({
  open,
  onOpenChange,
  documentId,
  documentTitle,
  editorContent,
}: SaveAsTemplateDialogProps) {
  const [name, setName] = useState(documentTitle);
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('📄');
  const [category, setCategory] = useState<TemplateCategory>('OTHER');
  const [scope, setScope] = useState<TemplateScope>('USER');
  const [submitting, setSubmitting] = useState(false);

  // Reset form when opening
  const handleOpenChange = (v: boolean) => {
    if (v) {
      setName(documentTitle);
      setDescription('');
      setIcon('📄');
      setCategory('OTHER');
      setScope('USER');
    }
    onOpenChange(v);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('请输入模板名称');
      return;
    }

    try {
      setSubmitting(true);
      await templateService.saveAsTemplate(documentId, {
        name: name.trim(),
        description: description.trim() || undefined,
        content: editorContent,
        icon,
        category,
        scope,
      });
      toast.success('模板保存成功');
      handleOpenChange(false);
    } catch {
      toast.error('保存模板失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const COMMON_ICONS = ['📄', '📋', '📊', '📐', '📖', '🏗️', '💡', '🎯', '📝', '🔧', '📌', '⚡'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={() => handleOpenChange(false)} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <BookTemplate className="w-5 h-5" />
            另存为模板
          </h2>
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              模板名称 *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              placeholder="输入模板名称"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none"
              placeholder="简要描述模板用途（可选）"
            />
          </div>

          {/* Icon */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              图标
            </label>
            <div className="flex gap-1.5 flex-wrap">
              {COMMON_ICONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition ${
                    icon === emoji
                      ? 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-500'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              分类
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as TemplateCategory)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none transition"
            >
              {ALL_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
          </div>

          {/* Scope */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              可见范围
            </label>
            <div className="flex gap-3">
              {(['USER', 'SPACE'] as TemplateScope[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setScope(s)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition ${
                    scope === s
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                      : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {SCOPE_LABELS[s]}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-gray-400">
              {scope === 'USER' ? '仅自己可见和使用' : '空间所有成员可见（需要管理员权限）'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!name.trim() || submitting}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition flex items-center gap-2 ${
              name.trim() && !submitting
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
            }`}
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            保存模板
          </button>
        </div>
      </div>
    </div>
  );
}
