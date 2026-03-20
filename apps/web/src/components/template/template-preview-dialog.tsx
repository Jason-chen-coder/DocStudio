'use client';

import { useEffect, useState } from 'react';
import { templateService } from '@/services/template-service';
import type { DocumentTemplate } from '@/types/template';
import { CATEGORY_LABELS, SCOPE_LABELS } from '@/types/template';
import { X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { AnimatedModal } from '@/components/ui/animated-modal';

// Minimal Tiptap JSON → HTML renderer (no editor dependency)
function renderTiptapJson(node: any): string {
  if (!node) return '';

  if (node.type === 'text') {
    let text = escapeHtml(node.text || '');
    if (node.marks) {
      for (const mark of node.marks) {
        switch (mark.type) {
          case 'bold': text = `<strong>${text}</strong>`; break;
          case 'italic': text = `<em>${text}</em>`; break;
          case 'strike': text = `<s>${text}</s>`; break;
          case 'underline': text = `<u>${text}</u>`; break;
          case 'code': text = `<code class="inline-code">${text}</code>`; break;
        }
      }
    }
    return text;
  }

  const children = (node.content || []).map(renderTiptapJson).join('');

  switch (node.type) {
    case 'doc': return children;
    case 'paragraph': return `<p>${children || '<br>'}</p>`;
    case 'heading': {
      const level = node.attrs?.level || 1;
      return `<h${level}>${children}</h${level}>`;
    }
    case 'bulletList': return `<ul>${children}</ul>`;
    case 'orderedList': return `<ol>${children}</ol>`;
    case 'listItem': return `<li>${children}</li>`;
    case 'taskList': return `<ul class="task-list">${children}</ul>`;
    case 'taskItem': {
      const checked = node.attrs?.checked ? 'checked' : '';
      return `<li class="task-item"><input type="checkbox" ${checked} disabled />${children}</li>`;
    }
    case 'blockquote': return `<blockquote>${children}</blockquote>`;
    case 'codeBlock': {
      const lang = node.attrs?.language || '';
      return `<pre><code class="language-${lang}">${children}</code></pre>`;
    }
    case 'horizontalRule': return '<hr>';
    default: return children;
  }
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

interface TemplatePreviewDialogProps {
  templateId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUseTemplate?: (data: { title: string; content: string }) => void;
}

export function TemplatePreviewDialog({
  templateId,
  open,
  onOpenChange,
  onUseTemplate,
}: TemplatePreviewDialogProps) {
  const [template, setTemplate] = useState<DocumentTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  const [renderedHtml, setRenderedHtml] = useState('');

  useEffect(() => {
    if (open && templateId) {
      loadTemplate(templateId);
    }
  }, [open, templateId]);

  const loadTemplate = async (id: string) => {
    try {
      setLoading(true);
      const data = await templateService.getTemplate(id);
      setTemplate(data);
      // Parse and render content
      try {
        const json = JSON.parse(data.content);
        setRenderedHtml(renderTiptapJson(json));
      } catch {
        setRenderedHtml(`<p>${escapeHtml(data.content)}</p>`);
      }
    } catch {
      toast.error('加载模板预览失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatedModal open={open} onClose={() => onOpenChange(false)} className="w-full max-w-2xl mx-4" zIndex="z-[60]">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            {template && (
              <>
                <span className="text-2xl">{template.icon}</span>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {template.name}
                  </h2>
                  <p className="text-xs text-gray-400">
                    {SCOPE_LABELS[template.scope]} · {CATEGORY_LABELS[template.category]}
                  </p>
                </div>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Description */}
        {template?.description && (
          <div className="px-6 py-2 border-b border-gray-100 dark:border-gray-700/50">
            <p className="text-sm text-gray-500 dark:text-gray-400">{template.description}</p>
          </div>
        )}

        {/* Content Preview */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <div
              className="prose prose-sm dark:prose-invert max-w-none template-preview"
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            关闭
          </button>
          {onUseTemplate && template && (
            <button
              type="button"
              onClick={() => {
                onUseTemplate({ title: template.name, content: template.content });
                onOpenChange(false);
              }}
              className="px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition"
            >
              使用此模板
            </button>
          )}
        </div>
      </div>

      {/* Preview styles */}
      <style jsx global>{`
        .template-preview h1 { font-size: 1.5rem; font-weight: 700; margin: 0.5rem 0; }
        .template-preview h2 { font-size: 1.25rem; font-weight: 600; margin: 1rem 0 0.5rem; }
        .template-preview h3 { font-size: 1.1rem; font-weight: 600; margin: 0.75rem 0 0.25rem; }
        .template-preview p { margin: 0.25rem 0; }
        .template-preview ul, .template-preview ol { padding-left: 1.5rem; margin: 0.25rem 0; }
        .template-preview li { margin: 0.15rem 0; }
        .template-preview blockquote { border-left: 3px solid #d1d5db; padding-left: 1rem; margin: 0.5rem 0; color: #6b7280; }
        .template-preview pre { background: #f3f4f6; padding: 0.75rem 1rem; border-radius: 0.5rem; margin: 0.5rem 0; overflow-x: auto; }
        .template-preview .inline-code { background: #f3f4f6; padding: 0.1rem 0.3rem; border-radius: 0.25rem; font-size: 0.85em; }
        .template-preview hr { border-top: 1px solid #e5e7eb; margin: 0.75rem 0; }
        .template-preview .task-list { list-style: none; padding-left: 0; }
        .template-preview .task-item { display: flex; align-items: flex-start; gap: 0.5rem; }
        .template-preview .task-item input { margin-top: 0.3rem; }
        .dark .template-preview pre { background: #1f2937; }
        .dark .template-preview .inline-code { background: #374151; }
        .dark .template-preview blockquote { border-left-color: #4b5563; color: #9ca3af; }
        .dark .template-preview hr { border-top-color: #374151; }
      `}</style>
    </AnimatedModal>
  );
}
