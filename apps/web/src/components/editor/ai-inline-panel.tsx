'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import type { Editor } from '@tiptap/core';
import {
  Sparkles, PenLine, ArrowRightLeft, Minus, Languages, FileText,
  Square, Copy, RotateCcw, ArrowDownToLine, Replace, Trash2, WrapText, Send,
  Loader2, Clock, Brain,
} from 'lucide-react';
import { useAiCompletion } from '@/hooks/use-ai-completion';
import { renderMarkdown } from '@/lib/markdown-render';
import { AI_COMMAND_LABELS, type AiCommand } from '@/services/ai-service';
import { toast } from 'sonner';

// ── Think tag parsing (shared with ai-chat-panel) ──

interface ParsedContent {
  thinking: string | null;
  isThinking: boolean;
  reply: string;
}

function parseThinkTags(text: string): ParsedContent {
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

function cleanResult(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>\s*/g, '').trim();
}

// ── Markdown renderer ──

function MarkdownContent({ content }: { content: string }) {
  const html = useMemo(() => renderMarkdown(content), [content]);
  return (
    <div
      className="ai-chat-markdown prose prose-sm dark:prose-invert max-w-none break-words"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// ── Thinking block ──

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
        </div>
      )}
    </div>
  );
}

// ── Preset commands ──

interface PresetCommand {
  command: AiCommand | 'custom';
  label: string;
  icon: typeof Sparkles;
  customPrompt?: string;
  group: 'edit' | 'generate';
}

const PRESET_COMMANDS: PresetCommand[] = [
  { command: 'polish', label: '帮我润色', icon: Sparkles, group: 'edit' },
  { command: 'longer', label: '丰富内容', icon: ArrowRightLeft, group: 'edit' },
  { command: 'shorter', label: '精简内容', icon: Minus, group: 'edit' },
  { command: 'summary', label: '生成摘要', icon: FileText, group: 'generate' },
  { command: 'translate', label: '翻译为', icon: Languages, group: 'generate' },
  { command: 'continue', label: '继续写', icon: PenLine, group: 'generate' },
];

// ── Main Component ──

interface AiInlinePanelProps {
  editor: Editor;
  selectedText: string;
  selectionRange: { from: number; to: number };
  canUseCommand?: (cmd: string) => boolean;
  onUpgradeNeeded?: () => void;
  onClose: () => void;
  anchorCoords: { top: number; left: number } | null;
}

type PanelState = 'input' | 'streaming' | 'done';

export function AiInlinePanel({
  editor,
  selectedText,
  selectionRange,
  canUseCommand,
  onUpgradeNeeded,
  onClose,
  anchorCoords,
}: AiInlinePanelProps) {
  const ai = useAiCompletion();
  const [customInput, setCustomInput] = useState('');
  const [activeCommand, setActiveCommand] = useState<string>('');
  const [deepThink, setDeepThink] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const state: PanelState = ai.isStreaming ? 'streaming' : ai.result ? 'done' : 'input';

  // Focus input on mount
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Timer for streaming duration
  useEffect(() => {
    if (ai.isStreaming) {
      setStartTime(Date.now());
      const interval = setInterval(() => setElapsed(Date.now() - startTime), 1000);
      return () => clearInterval(interval);
    }
  }, [ai.isStreaming, startTime]);

  // Auto scroll result
  useEffect(() => {
    if (ai.isStreaming && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [ai.result, ai.isStreaming]);

  // Click outside to close (only in input state)
  useEffect(() => {
    if (state !== 'input') return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    setTimeout(() => document.addEventListener('mousedown', handleClick), 100);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [state, onClose]);

  const runCommand = useCallback((command: AiCommand, customPrompt?: string) => {
    setActiveCommand(command);
    setStartTime(Date.now());
    ai.run({ command, text: selectedText, customPrompt, deepThink });
  }, [ai, selectedText, deepThink]);

  const handlePresetClick = useCallback((preset: PresetCommand) => {
    if (canUseCommand && !canUseCommand(preset.command)) {
      onUpgradeNeeded ? onUpgradeNeeded() : toast.error('您的订阅不支持此功能，请升级套餐');
      return;
    }
    runCommand(preset.command as AiCommand, preset.customPrompt);
  }, [canUseCommand, onUpgradeNeeded, runCommand]);

  const handleCustomSubmit = useCallback(() => {
    const text = customInput.trim();
    if (!text) return;
    if (canUseCommand && !canUseCommand('custom')) {
      onUpgradeNeeded ? onUpgradeNeeded() : toast.error('您的订阅不支持自定义指令，请升级套餐');
      return;
    }
    setActiveCommand('custom');
    runCommand('custom', text);
  }, [customInput, canUseCommand, runCommand]);

  const handleReplace = useCallback(() => {
    const clean = cleanResult(ai.result);
    if (!clean) return;
    const { from, to } = selectionRange;
    editor.chain().focus().insertContentAt({ from, to }, clean).run();
    ai.reset();
    onClose();
  }, [editor, ai, selectionRange, onClose]);

  const handleInsert = useCallback(() => {
    const clean = cleanResult(ai.result);
    if (!clean) return;
    const { to } = selectionRange;
    editor.chain().focus().setTextSelection(to).insertContent('\n\n' + clean).run();
    ai.reset();
    onClose();
  }, [editor, ai, selectionRange, onClose]);

  const handleCopy = useCallback(() => {
    const clean = cleanResult(ai.result);
    navigator.clipboard.writeText(clean).then(() => toast.success('已复制'));
  }, [ai.result]);

  const handleRetry = useCallback(() => {
    ai.retry();
  }, [ai]);

  const handleDiscard = useCallback(() => {
    ai.reset();
    onClose();
  }, [ai, onClose]);

  const handleContinueWrite = useCallback(() => {
    const clean = cleanResult(ai.result);
    runCommand('continue', undefined);
  }, [ai.result, runCommand]);

  const handleAdjust = useCallback(() => {
    // Reset to input state with previous result context
    ai.reset();
    setCustomInput('');
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [ai]);

  if (!anchorCoords) return null;

  const commandLabel = activeCommand === 'custom'
    ? customInput || '自定义指令'
    : AI_COMMAND_LABELS[activeCommand as AiCommand] || activeCommand;

  const parsed = ai.result
    ? deepThink
      ? parseThinkTags(ai.result)
      : { thinking: null, isThinking: false, reply: ai.result.replace(/<think>[\s\S]*?<\/think>\s*/g, '').replace(/<think>[\s\S]*$/, '').trim() }
    : null;

  const panel = (
    <div
      ref={panelRef}
      className="fixed z-50 w-[calc(100vw-2rem)] md:w-[520px] max-h-[calc(100vh-4rem)] md:max-h-[460px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
      style={{
        top: anchorCoords.top + 4,
        left: Math.max(16, Math.min(anchorCoords.left, window.innerWidth - 540)),
      }}
    >
      {/* ═══ Input State ═══ */}
      {state === 'input' && (
        <>
          {/* Custom input */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <input
              ref={inputRef}
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCustomSubmit();
                if (e.key === 'Escape') onClose();
              }}
              placeholder="请选择或输入指令，如：写一份视频广告脚本"
              className="flex-1 bg-transparent text-sm text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none"
            />
            {/* Deep Think toggle */}
            <button
              type="button"
              onClick={() => setDeepThink((v) => !v)}
              title={deepThink ? '深度思考已开启' : '开启深度思考'}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors flex-shrink-0 ${
                deepThink
                  ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400'
                  : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-400'
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{deepThink ? '深度思考' : '深度思考'}</span>
            </button>
            {customInput.trim() && (
              <button
                onClick={handleCustomSubmit}
                className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors flex-shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Preset commands */}
          <div className="overflow-y-auto max-h-[320px] py-1">
            {/* Edit group */}
            <p className="px-4 pt-2 pb-1 text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">
              编辑调整内容
            </p>
            {PRESET_COMMANDS.filter((c) => c.group === 'edit').map((preset) => {
              const disabled = canUseCommand && !canUseCommand(preset.command);
              return (
                <button
                  key={preset.command}
                  onClick={() => handlePresetClick(preset)}
                  disabled={disabled}
                  className={`flex items-center gap-3 w-full px-4 py-2 text-sm transition-colors ${
                    disabled
                      ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <preset.icon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  {preset.label}
                  {preset.command === 'polish' && (
                    <span className="ml-auto text-[10px] text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded">默认</span>
                  )}
                </button>
              );
            })}

            {/* Generate group */}
            <p className="px-4 pt-3 pb-1 text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">
              从选中内容生成
            </p>
            {PRESET_COMMANDS.filter((c) => c.group === 'generate').map((preset) => {
              const disabled = canUseCommand && !canUseCommand(preset.command);
              return (
                <button
                  key={preset.command}
                  onClick={() => handlePresetClick(preset)}
                  disabled={disabled}
                  className={`flex items-center gap-3 w-full px-4 py-2 text-sm transition-colors ${
                    disabled
                      ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <preset.icon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  {preset.label}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* ═══ Streaming State ═══ */}
      {state === 'streaming' && (
        <>
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 font-medium">
              <span>{commandLabel}</span>
              <span className="flex gap-0.5">
                <span className="w-1 h-1 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1 h-1 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1 h-1 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            </div>
            <button
              onClick={() => ai.cancel()}
              className="flex items-center gap-1.5 px-3 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              <Square className="w-3 h-3" />
              停止
            </button>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 min-h-[60px] max-h-[350px]">
            {parsed?.thinking && <ThinkingBlock content={parsed.thinking} isStreaming={parsed.isThinking} />}
            {parsed?.reply ? (
              <MarkdownContent content={parsed.reply} />
            ) : !parsed?.isThinking ? (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                生成中...
              </div>
            ) : null}
          </div>
        </>
      )}

      {/* ═══ Done State ═══ */}
      {state === 'done' && (
        <>
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-gray-700">
            <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">{commandLabel}</span>
            <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
              <Clock className="w-3 h-3" />
              {((Date.now() - startTime) / 1000).toFixed(1)}s
            </div>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 max-h-[300px]">
            {parsed?.thinking && <ThinkingBlock content={parsed.thinking} />}
            {parsed?.reply && <MarkdownContent content={parsed.reply} />}
            {ai.error && (
              <div className="text-sm text-red-500 dark:text-red-400">{ai.error}</div>
            )}
          </div>
          <div className="flex-shrink-0 px-3 py-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-2">内容由AI生成</p>
            <div className="flex items-center gap-1 flex-wrap">
              <ActionBtn icon={ArrowDownToLine} label="插入" primary onClick={handleInsert} />
              <ActionBtn icon={Replace} label="替换" onClick={handleReplace} />
              <ActionBtn icon={RotateCcw} label="重试" onClick={handleRetry} />
              <ActionBtn icon={WrapText} label="继续写" onClick={handleContinueWrite} />
              <ActionBtn icon={PenLine} label="调整内容" onClick={handleAdjust} />
              <div className="flex-1" />
              <ActionBtn icon={Trash2} label="弃用" danger onClick={handleDiscard} />
              <ActionBtn icon={Copy} label="复制" onClick={handleCopy} />
            </div>
          </div>
        </>
      )}
    </div>
  );

  return createPortal(panel, document.body);
}

// ── Action button helper ──

function ActionBtn({
  icon: Icon,
  label,
  onClick,
  primary,
  danger,
}: {
  icon: typeof Copy;
  label: string;
  onClick: () => void;
  primary?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
        primary
          ? 'bg-blue-600 text-white hover:bg-blue-700'
          : danger
            ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}
