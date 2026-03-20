'use client';

import { useEffect, useState, useCallback } from 'react';
import { templateService } from '@/services/template-service';
import type { TemplateListItem, TemplateCategory } from '@/types/template';
import { CATEGORY_LABELS, ALL_CATEGORIES } from '@/types/template';
import { TemplateCard, BlankDocumentCard } from './template-card';
import { TemplatePreviewDialog } from './template-preview-dialog';
import { X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { AnimatedModal } from '@/components/ui/animated-modal';

interface TemplatePickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  spaceId: string;
  /** Called when user selects a template. Receives title + content. */
  onSelect: (data: { title: string; content: string }) => void;
  /** Called when user chooses blank document. */
  onSkip: () => void;
}

export function TemplatePickerModal({
  open,
  onOpenChange,
  spaceId,
  onSelect,
  onSkip,
}: TemplatePickerModalProps) {
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [category, setCategory] = useState<TemplateCategory | 'ALL'>('ALL');
  const [submitting, setSubmitting] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedId(null);
      setCategory('ALL');
      loadTemplates();
    }
  }, [open, spaceId]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setLoadError(false);
      const data = await templateService.getTemplates({ spaceId });
      setTemplates(data);
    } catch {
      setLoadError(true);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = category === 'ALL'
    ? templates
    : templates.filter((t) => t.category === category);

  // Get categories that have templates
  const availableCategories = ALL_CATEGORIES.filter((cat) =>
    templates.some((t) => t.category === cat)
  );

  const handleUseTemplate = useCallback(async () => {
    if (!selectedId) return;
    try {
      setSubmitting(true);
      const detail = await templateService.getTemplate(selectedId);
      onSelect({ title: detail.name, content: detail.content });
      onOpenChange(false);
    } catch {
      toast.error('获取模板内容失败');
    } finally {
      setSubmitting(false);
    }
  }, [selectedId, onSelect, onOpenChange]);

  const handleBlankDocument = useCallback(() => {
    onSkip();
    onOpenChange(false);
  }, [onSkip, onOpenChange]);

  const handlePreviewUse = useCallback((data: { title: string; content: string }) => {
    onSelect(data);
    onOpenChange(false);
  }, [onSelect, onOpenChange]);

  return (
    <>
      <AnimatedModal open={open} onClose={() => onOpenChange(false)} className="w-full max-w-2xl mx-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              选择模板
            </h2>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Category Filter */}
          <div className="px-6 py-3 border-b border-gray-100 dark:border-gray-700/50">
            {loading ? (
              /* Category skeleton */
              <div className="flex gap-2 animate-pulse">
                <div className="h-6 w-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
                <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
                <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
                <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
                <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
              </div>
            ) : loadError ? null : (
              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setCategory('ALL')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                    category === 'ALL'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  全部
                </button>
                {availableCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                      category === cat
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Template Grid */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {loading ? (
              /* Skeleton loading */
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {/* Blank doc card skeleton */}
                <div className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 min-h-[120px] animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700" />
                  <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-2 w-8 bg-gray-100 dark:bg-gray-700/50 rounded" />
                </div>
                {/* Template card skeletons — fill 2 rows of 4 columns */}
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 min-h-[120px] animate-pulse"
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700" />
                    <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-2 w-10 bg-gray-100 dark:bg-gray-700/50 rounded" />
                  </div>
                ))}
              </div>
            ) : loadError ? (
              /* Error state: only show blank document option */
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                <BlankDocumentCard onClick={handleBlankDocument} />
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                <BlankDocumentCard
                  selected={selectedId === null}
                  onClick={handleBlankDocument}
                />
                {filtered.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    selected={selectedId === template.id}
                    onClick={() => setSelectedId(template.id)}
                    onPreview={() => {
                      setPreviewId(template.id);
                      setShowPreview(true);
                    }}
                  />
                ))}
              </div>
            )}

            {!loading && !loadError && filtered.length === 0 && (
              <p className="text-center text-gray-400 py-8">
                当前分类暂无模板
              </p>
            )}
          </div>

          {/* Selected Template Description */}
          {selectedId && (
            <div className="px-6 py-3 border-t border-gray-100 dark:border-gray-700/50">
              {(() => {
                const selected = templates.find((t) => t.id === selectedId);
                if (!selected) return null;
                return (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {selected.icon} {selected.name}
                    </span>
                    {selected.description && (
                      <span> — {selected.description}</span>
                    )}
                  </p>
                );
              })()}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            >
              取消
            </button>
            {!loadError && (
              <button
                type="button"
                onClick={handleUseTemplate}
                disabled={!selectedId || submitting}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition flex items-center gap-2 ${
                  selectedId && !submitting
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
                }`}
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                使用此模板
              </button>
            )}
          </div>
        </div>
      </AnimatedModal>

      {/* Template Preview Dialog (rendered on top with higher z-index) */}
      <TemplatePreviewDialog
        templateId={previewId}
        open={showPreview}
        onOpenChange={setShowPreview}
        onUseTemplate={handlePreviewUse}
      />
    </>
  );
}
