'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { spaceService } from '@/services/space-service';
import { templateService } from '@/services/template-service';
import { Space } from '@/types/space';
import {
  TemplateListItem,
  CATEGORY_LABELS,
  SCOPE_LABELS,
} from '@/types/template';
import { TemplatePreviewDialog } from '@/components/template/template-preview-dialog';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Eye,
  Trash2,
  Lock,
} from 'lucide-react';

export default function SpaceTemplatesPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const spaceId = params.id as string;

  const [space, setSpace] = useState<Space | null>(null);
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewId, setPreviewId] = useState<string | null>(null);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [spaceData, tplData] = await Promise.all([
        spaceService.getSpace(spaceId),
        templateService.getTemplates({ spaceId }),
      ]);
      setSpace(spaceData);
      setTemplates(tplData);
    } catch {
      toast.error('加载失败');
    } finally {
      setLoading(false);
    }
  }, [spaceId]);

  useEffect(() => {
    if (user && spaceId) loadData();
  }, [user, spaceId, loadData]);

  const handleDelete = async (id: string) => {
    try {
      await templateService.deleteTemplate(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      toast.success('模板已删除');
    } catch {
      toast.error('删除失败');
    } finally {
      setDeletingId(null);
    }
  };

  const isAdmin = space?.myRole === 'OWNER' || space?.myRole === 'ADMIN';

  // Group templates by scope
  const systemTemplates = templates.filter((t) => t.scope === 'SYSTEM');
  const spaceTemplates = templates.filter((t) => t.scope === 'SPACE');
  const userTemplates = templates.filter((t) => t.scope === 'USER');

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-7 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        {[1, 2, 3].map((s) => (
          <div key={s} className="space-y-3">
            <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-24 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!space) {
    return <div className="text-center p-10 text-gray-500">空间不存在或无权访问</div>;
  }

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/spaces/${spaceId}`)}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:text-gray-200 dark:hover:bg-gray-800 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              模板管理
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {space.name}
            </p>
          </div>
        </div>
      </div>

      {/* System Templates */}
      <TemplateSection
        title="系统模板"
        description="内置模板，所有用户可用，不可编辑"
        templates={systemTemplates}
        icon={<Lock className="w-3.5 h-3.5 text-gray-400" />}
        readonly
        onPreview={setPreviewId}
      />

      {/* Space Templates */}
      <TemplateSection
        title="空间模板"
        description={isAdmin ? '空间内共享的模板，OWNER 和 ADMIN 可管理' : '空间内共享的模板'}
        templates={spaceTemplates}
        canManage={isAdmin}
        onPreview={setPreviewId}
        onDelete={(id) => setDeletingId(id)}
        onEdit={(id) => router.push(`/spaces/${spaceId}/templates?edit=${id}`)}
      />

      {/* User Templates */}
      <TemplateSection
        title="我的模板"
        description="仅自己可见的个人模板"
        templates={userTemplates}
        canManage
        onPreview={setPreviewId}
        onDelete={(id) => setDeletingId(id)}
        onEdit={(id) => router.push(`/spaces/${spaceId}/templates?edit=${id}`)}
      />

      {/* Preview Dialog */}
      {previewId && (
        <TemplatePreviewDialog
          templateId={previewId}
          open={!!previewId}
          onOpenChange={(open) => !open && setPreviewId(null)}
        />
      )}

      {/* Delete Confirmation */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-sm mx-4 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              确认删除模板？
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              删除后该模板将不再出现在模板选择列表中。
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                取消
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== TemplateSection ====================

interface TemplateSectionProps {
  title: string;
  description: string;
  templates: TemplateListItem[];
  icon?: React.ReactNode;
  readonly?: boolean;
  canManage?: boolean;
  onPreview: (id: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
}

function TemplateSection({
  title,
  description,
  templates,
  icon,
  readonly,
  canManage,
  onPreview,
  onDelete,
  onEdit,
}: TemplateSectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
            {icon}
            {title}
            <span className="text-xs text-gray-400 dark:text-gray-500 font-normal">
              ({templates.length})
            </span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {description}
          </p>
        </div>
      </div>

      {templates.length === 0 ? (
        <div className="py-8 text-center text-sm text-gray-400 dark:text-gray-500 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
          暂无模板
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-600 transition group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <span className="text-xl flex-shrink-0">{tpl.icon}</span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {tpl.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                        {CATEGORY_LABELS[tpl.category]}
                      </span>
                      <span className="text-[11px] text-gray-400 dark:text-gray-500">
                        {SCOPE_LABELS[tpl.scope]}
                      </span>
                    </div>
                    {tpl.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 line-clamp-2">
                        {tpl.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button
                    onClick={() => onPreview(tpl.id)}
                    className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition"
                    title="预览"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  {!readonly && canManage && (
                    <>
                      <button
                        onClick={() => onDelete?.(tpl.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                        title="删除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
