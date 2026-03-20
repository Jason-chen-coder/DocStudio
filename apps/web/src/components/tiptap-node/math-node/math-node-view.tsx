'use client';

import { NodeViewWrapper } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Sigma } from 'lucide-react';

// Lazy-load KaTeX for bundle optimization
let katexRender: ((latex: string, element: HTMLElement, options: object) => void) | null = null;
let katexLoaded = false;

async function loadKaTeX() {
  if (katexLoaded) return;
  const mod = await import('katex');
  // @ts-ignore — CSS import handled by bundler
  await import('katex/dist/katex.min.css');
  katexRender = mod.default.render;
  katexLoaded = true;
}

export function MathNodeView({ node, updateAttributes, editor, selected }: NodeViewProps) {
  const latex = (node.attrs.latex as string) || '';
  const [isEditing, setIsEditing] = useState(!latex);
  const [inputValue, setInputValue] = useState(latex);
  const [renderError, setRenderError] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isEditable = editor.isEditable;

  const renderMath = useCallback(async (tex: string) => {
    if (!previewRef.current || !tex.trim()) return;
    try {
      await loadKaTeX();
      if (katexRender && previewRef.current) {
        katexRender(tex, previewRef.current, {
          throwOnError: false,
          displayMode: true,
          output: 'html',
        });
        setRenderError(null);
      }
    } catch (err: any) {
      setRenderError(err?.message || '公式渲染错误');
    }
  }, []);

  useEffect(() => {
    if (!isEditing && latex) {
      renderMath(latex);
    }
  }, [isEditing, latex, renderMath]);

  const handleSave = () => {
    const trimmed = inputValue.trim();
    updateAttributes({ latex: trimmed });
    if (trimmed) {
      setIsEditing(false);
    }
  };

  // Show editing mode
  if (isEditing && isEditable) {
    return (
      <NodeViewWrapper
        className={`my-3 rounded-xl border-2 transition-colors ${
          selected
            ? 'border-blue-300 dark:border-blue-600'
            : 'border-gray-200 dark:border-gray-700'
        } bg-gray-50 dark:bg-gray-900/50 p-4`}
      >
        <div contentEditable={false} className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Sigma className="w-4 h-4" />
            <span className="font-medium">数学公式 (LaTeX)</span>
          </div>

          <textarea
            ref={inputRef}
            autoFocus
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleSave();
              }
              if (e.key === 'Escape') {
                if (latex) {
                  setInputValue(latex);
                  setIsEditing(false);
                }
              }
              e.stopPropagation();
            }}
            placeholder="输入 LaTeX 公式，例如 E = mc^2"
            className="w-full px-3 py-2 text-sm font-mono bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg resize-none outline-none focus:border-blue-400 dark:focus:border-blue-500 text-gray-900 dark:text-gray-100 placeholder-gray-400 min-h-[60px]"
            rows={2}
          />

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-400">
              Ctrl+Enter 确认 · Esc 取消
            </span>
            <div className="flex gap-2">
              {latex && (
                <button
                  type="button"
                  onClick={() => { setInputValue(latex); setIsEditing(false); }}
                  className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg transition-colors cursor-pointer"
                >
                  取消
                </button>
              )}
              <button
                type="button"
                onClick={handleSave}
                disabled={!inputValue.trim()}
                className="px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 rounded-lg transition-colors cursor-pointer"
              >
                渲染
              </button>
            </div>
          </div>
        </div>
      </NodeViewWrapper>
    );
  }

  // Show rendered math
  return (
    <NodeViewWrapper
      className={`my-3 rounded-xl border transition-colors cursor-pointer ${
        selected
          ? 'border-blue-300 dark:border-blue-600 bg-blue-50/50 dark:bg-blue-900/10'
          : 'border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
      } p-4`}
      onClick={() => isEditable && setIsEditing(true)}
    >
      <div contentEditable={false}>
        {!latex ? (
          <div className="flex items-center justify-center gap-2 py-4 text-sm text-gray-400">
            <Sigma className="w-5 h-5" />
            <span>点击输入数学公式</span>
          </div>
        ) : renderError ? (
          <div className="text-sm text-red-500 text-center py-2">{renderError}</div>
        ) : (
          <div
            ref={previewRef}
            className="math-preview overflow-x-auto text-center"
          />
        )}
      </div>
    </NodeViewWrapper>
  );
}
