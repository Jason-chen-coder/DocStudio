'use client';

import { useEffect, useRef, useMemo, useState } from 'react';
import type { Editor } from '@tiptap/core';
import {
  Sparkles,
  Check,
  ArrowDown,
  RotateCcw,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { AI_COMMAND_LABELS, type AiCommand } from '@/services/ai-service';
import { renderMarkdown } from '@/lib/markdown-render';

/** Parse <think> tags */
function parseThinkTags(text: string) {
  const thinkMatch = text.match(/<think>([\s\S]*?)<\/think>/);
  const thinking = thinkMatch ? thinkMatch[1].trim() : null;
  const hasOpenThink = text.includes('<think>') && !text.includes('</think>');
  let partialThinking: string | null = null;
  if (hasOpenThink) {
    partialThinking = text.slice(text.indexOf('<think>') + 7).trim();
  }
  let reply = text;
  if (thinkMatch) {
    reply = text.replace(/<think>[\s\S]*?<\/think>\s*/g, '').trim();
  } else if (hasOpenThink) {
    reply = text.slice(0, text.indexOf('<think>')).trim();
  }
  return { thinking: thinking || partialThinking, isThinking: hasOpenThink, reply };
}

/** Collapsible thinking block */
function ThinkingBlock({ content, isStreaming }: { content: string; isStreaming?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="mb-2">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
      >
        {isStreaming ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <svg className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`} viewBox="0 0 12 12" fill="currentColor">
            <path d="M4 2l4 4-4 4" />
          </svg>
        )}
        <span>{isStreaming ? '思考中...' : '已思考'}</span>
      </button>
      {(expanded || isStreaming) && content && (
        <div className="mt-1.5 pl-4 border-l-2 border-gray-200 dark:border-gray-600 text-xs text-gray-400 dark:text-gray-500 whitespace-pre-wrap leading-relaxed max-h-[150px] overflow-y-auto">
          {content}
          {isStreaming && <span className="inline-block w-1 h-3 ml-0.5 bg-gray-300 dark:bg-gray-600 animate-pulse rounded-sm" />}
        </div>
      )}
    </div>
  );
}

interface AiResultPanelProps {
  editor: Editor;
  command: AiCommand | null;
  result: string;
  isStreaming: boolean;
  error: string | null;
  onAcceptReplace: () => void;
  onAcceptInsert: () => void;
  onRetry: () => void;
  onClose: () => void;
}

export function AiResultPanel({
  editor,
  command,
  result,
  isStreaming,
  error,
  onAcceptReplace,
  onAcceptInsert,
  onRetry,
  onClose,
}: AiResultPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Strip <think>...</think> tags from result for display and actions
  const parsed = useMemo(() => {
    if (!result) return { thinking: null, isThinking: false, reply: '' };
    return parseThinkTags(result);
  }, [result]);

  const cleanResult = parsed.reply;

  // Auto-scroll to bottom during streaming
  useEffect(() => {
    if (isStreaming && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [result, isStreaming]);

  if (!result && !isStreaming && !error) return null;

  const label = command ? AI_COMMAND_LABELS[command] : 'AI';

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[420px] max-w-[calc(100vw-3rem)] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700/50 bg-violet-50/50 dark:bg-violet-900/10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-500" />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            AI {label}
          </span>
          {isStreaming && (
            <Loader2 className="w-3.5 h-3.5 text-violet-500 animate-spin" />
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div
        ref={scrollRef}
        className="px-4 py-3 max-h-60 overflow-y-auto text-sm text-gray-800 dark:text-gray-200 leading-relaxed"
      >
        {error ? (
          <div className="flex items-start gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        ) : result ? (
          <div>
            {parsed.thinking && (
              <ThinkingBlock content={parsed.thinking} isStreaming={parsed.isThinking} />
            )}
            {cleanResult ? (
              <div
                className="ai-chat-markdown prose prose-sm dark:prose-invert max-w-none break-words"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(cleanResult) }}
              />
            ) : null}
            {isStreaming && !parsed.isThinking && (
              <span className="inline-block w-1.5 h-4 bg-violet-500 animate-pulse ml-0.5 align-text-bottom rounded-sm" />
            )}
          </div>
        ) : isStreaming ? (
          <div className="flex items-center gap-2 text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>正在思考...</span>
          </div>
        ) : null}
      </div>

      {/* Actions */}
      {(result || error) && !isStreaming && (
        <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50">
          {!error && (
            <>
              <button
                type="button"
                onClick={onAcceptReplace}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                替换选中
              </button>
              <button
                type="button"
                onClick={onAcceptInsert}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                <ArrowDown className="w-3.5 h-3.5" />
                插入下方
              </button>
            </>
          )}
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            重试
          </button>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto px-3 py-1.5 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            取消
          </button>
        </div>
      )}
    </div>
  );
}
