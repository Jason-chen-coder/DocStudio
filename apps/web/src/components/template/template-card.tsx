'use client';

import type { TemplateListItem } from '@/types/template';
import { SCOPE_LABELS } from '@/types/template';
import { Eye } from 'lucide-react';

interface TemplateCardProps {
  template: TemplateListItem;
  selected?: boolean;
  onClick?: () => void;
  onPreview?: () => void;
}

export function TemplateCard({ template, selected, onClick, onPreview }: TemplateCardProps) {
  return (
    <div className="relative group">
      <button
        type="button"
        onClick={onClick}
        className={`
          flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all
          cursor-pointer text-center min-h-[120px] w-full
          hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600
          ${selected
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
          }
        `}
      >
        <span className="text-3xl">{template.icon}</span>
        <span className="font-medium text-sm text-gray-900 dark:text-gray-100 line-clamp-1">
          {template.name}
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {SCOPE_LABELS[template.scope]}
        </span>
      </button>

      {/* Preview button - appears on hover */}
      {onPreview && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPreview();
          }}
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 dark:bg-gray-700/90 shadow-sm border border-gray-200 dark:border-gray-600
            opacity-0 group-hover:opacity-100 transition-opacity
            hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400"
          title="预览模板"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

/** Special "blank document" card */
export function BlankDocumentCard({
  selected,
  onClick,
}: {
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed transition-all
        cursor-pointer text-center min-h-[120px] w-full
        hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600
        ${selected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
          : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50'
        }
      `}
    >
      <span className="text-3xl">➕</span>
      <span className="font-medium text-sm text-gray-700 dark:text-gray-300">
        空白文档
      </span>
      <span className="text-xs text-gray-400 dark:text-gray-500">
        从零开始
      </span>
    </button>
  );
}
