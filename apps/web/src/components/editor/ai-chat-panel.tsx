'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import type { Editor } from '@tiptap/core';
import {
  X, Send, Sparkles, Loader2, Copy, Plus, ArrowDownToLine,
  PanelRightClose, Maximize2, Minimize2, GripVertical,
} from 'lucide-react';
import { streamChat, type AiChatMessage } from '@/services/ai-service';
import { toast } from 'sonner';
import { renderMarkdown } from '@/lib/markdown-render';

/** Markdown content renderer component */
function MarkdownContent({ content }: { content: string }) {
  const html = useMemo(() => renderMarkdown(content), [content]);
  return (
    <div
      className="ai-chat-markdown prose prose-sm dark:prose-invert max-w-none break-words"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/** Parse <think>...</think> blocks from LLM output into structured parts */
interface ParsedContent {
  thinking: string | null;   // content inside <think> tags
  isThinking: boolean;       // true if <think> is open but not closed (streaming)
  reply: string;             // content outside <think> tags
}

function parseThinkTags(text: string): ParsedContent {
  // Extract complete <think>...</think> blocks
  const thinkMatch = text.match(/<think>([\s\S]*?)<\/think>/);
  const thinking = thinkMatch ? thinkMatch[1].trim() : null;

  // Check for incomplete <think> tag (still streaming thinking)
  const hasOpenThink = text.includes('<think>') && !text.includes('</think>');
  const isThinking = hasOpenThink;

  // If still thinking, extract partial thinking content
  let partialThinking: string | null = null;
  if (isThinking) {
    const openIdx = text.indexOf('<think>');
    partialThinking = text.slice(openIdx + 7).trim();
  }

  // Get reply (content after </think> or before <think> if no close tag)
  let reply = text;
  if (thinkMatch) {
    reply = text.replace(/<think>[\s\S]*?<\/think>\s*/g, '').trim();
  } else if (isThinking) {
    reply = text.slice(0, text.indexOf('<think>')).trim();
  }

  return {
    thinking: thinking || partialThinking,
    isThinking,
    reply,
  };
}

/** Collapsible thinking block component */
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
        <div className="mt-1.5 pl-4 border-l-2 border-gray-200 dark:border-gray-600 text-xs text-gray-400 dark:text-gray-500 whitespace-pre-wrap leading-relaxed max-h-[200px] overflow-y-auto">
          {content}
          {isStreaming && <span className="inline-block w-1 h-3 ml-0.5 bg-gray-300 dark:bg-gray-600 animate-pulse rounded-sm" />}
        </div>
      )}
    </div>
  );
}

type ChatMode = 'floating' | 'sidebar';

interface AiChatPanelProps {
  editor: Editor;
  documentId?: string;
  onClose: () => void;
  mode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
}

// ── Floating wrapper (draggable, overlays editor) ──
function FloatingWrapper({ children, onStartDrag }: { children: React.ReactNode; onStartDrag: (e: React.MouseEvent) => void }) {
  return (
    <div
      className="fixed z-40 shadow-2xl rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
      style={{ bottom: 80, right: 24, width: 380, height: 520 }}
    >
      {children}
    </div>
  );
}

// ── Sidebar wrapper (flex child with resizer) ──
function SidebarWrapper({ children, width, onResize }: { children: React.ReactNode; width: number; onResize: (delta: number) => void }) {
  const dragRef = useRef(false);
  const startXRef = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = true;
    startXRef.current = e.clientX;

    const handleMouseMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const delta = startXRef.current - ev.clientX;
      startXRef.current = ev.clientX;
      onResize(delta);
    };

    const handleMouseUp = () => {
      dragRef.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [onResize]);

  return (
    <div className="flex-shrink-0 flex h-full" style={{ width }}>
      {/* Resizer handle */}
      <div
        onMouseDown={handleMouseDown}
        className="w-2 flex-shrink-0 bg-gray-100 dark:bg-gray-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 cursor-col-resize transition-colors group relative flex items-center justify-center"
      >
        <div className="absolute inset-y-0 -left-1 -right-1" />
        <div className="relative z-10 w-1 h-8 rounded-full flex flex-col items-center justify-center gap-[3px] opacity-40 group-hover:opacity-100 transition-opacity">
          <span className="block w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-500" />
          <span className="block w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-500" />
          <span className="block w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-500" />
          <span className="block w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-500" />
          <span className="block w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-500" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}

export function AiChatPanel({ editor, documentId, onClose, mode, onModeChange }: AiChatPanelProps) {
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [sidebarWidth, setSidebarWidth] = useState(380);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    if (mode === 'floating') {
      setIsClosing(true);
      setTimeout(() => {
        setIsClosing(false);
        onClose();
      }, 200);
    } else {
      onClose();
    }
  }, [mode, onClose]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Drag state for floating mode
  const [floatPos, setFloatPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const floatRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, 50);
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
    return () => { abortRef.current?.abort(); };
  }, []);

  const getDocumentText = useCallback((): string => {
    if (!editor) return '';
    return editor.state.doc.textContent;
  }, [editor]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    const userMessage: AiChatMessage = { role: 'user', content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsStreaming(true);
    setStreamingContent('');
    scrollToBottom();

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      let result = '';
      for await (const chunk of streamChat(
        { documentId, documentContent: getDocumentText(), messages: newMessages },
        controller.signal,
      )) {
        if (chunk.type === 'text' && chunk.content) {
          result += chunk.content;
          setStreamingContent(result);
          scrollToBottom();
        }
        if (chunk.type === 'error') {
          toast.error(chunk.error || 'AI 服务异常');
          setIsStreaming(false);
          return;
        }
      }
      if (result) {
        setMessages((prev) => [...prev, { role: 'assistant', content: result }]);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') toast.error('AI 对话出错');
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
      scrollToBottom();
    }
  }, [input, messages, isStreaming, documentId, getDocumentText, scrollToBottom]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }, [handleSend]);

  const handleInsertToDoc = useCallback((content: string) => {
    if (!editor) return;
    editor.chain().focus().insertContent(content).run();
    toast.success('已插入文档');
  }, [editor]);

  const handleCopy = useCallback((content: string) => {
    navigator.clipboard.writeText(content).then(() => toast.success('已复制'));
  }, []);

  const handleNewChat = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setStreamingContent('');
    setIsStreaming(false);
    setInput('');
    inputRef.current?.focus();
  }, []);

  const handleSidebarResize = useCallback((delta: number) => {
    setSidebarWidth((w) => Math.min(600, Math.max(280, w + delta)));
  }, []);

  // Floating drag handlers
  const handleFloatDragStart = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY, posX: floatPos.x, posY: floatPos.y };

    const handleMove = (ev: MouseEvent) => {
      setFloatPos({
        x: dragStartRef.current.posX + (ev.clientX - dragStartRef.current.x),
        y: dragStartRef.current.posY + (ev.clientY - dragStartRef.current.y),
      });
    };
    const handleUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
      document.body.style.userSelect = '';
    };
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  }, [floatPos]);

  // ── Chat content (shared between modes) ──
  const chatContent = (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-gray-200 dark:border-gray-700">
        <div
          className="flex items-center gap-2 flex-1 cursor-grab active:cursor-grabbing"
          onMouseDown={mode === 'floating' ? handleFloatDragStart : undefined}
        >
          {mode === 'floating' && <GripVertical className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />}
          <Sparkles className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">AI 助手</span>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={handleNewChat}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="新对话"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onModeChange(mode === 'floating' ? 'sidebar' : 'floating')}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={mode === 'floating' ? '切换为侧栏' : '切换为浮窗'}
          >
            {mode === 'floating' ? <PanelRightClose className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="关闭"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {messages.length === 0 && !isStreaming && (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 dark:text-gray-500">
            <Sparkles className="w-8 h-8 mb-3 opacity-50" />
            <p className="text-sm font-medium">有什么我能帮你的？</p>
            <p className="text-xs mt-1 max-w-[200px]">我可以基于文档内容回答问题、生成内容、提供建议</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
            }`}>
              {msg.role === 'assistant' ? (() => {
                const parsed = parseThinkTags(msg.content);
                return (
                  <>
                    {parsed.thinking && <ThinkingBlock content={parsed.thinking} />}
                    {parsed.reply && <MarkdownContent content={parsed.reply} />}
                  </>
                );
              })() : (
                <div className="whitespace-pre-wrap break-words">{msg.content}</div>
              )}
              {msg.role === 'assistant' && (
                <div className="flex items-center justify-end gap-1 mt-2 pt-1.5 border-t border-gray-200/50 dark:border-gray-600/50">
                  <button onClick={() => handleCopy(parseThinkTags(msg.content).reply)} className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" title="复制">
                    <Copy className="w-3 h-3" />
                  </button>
                  <button onClick={() => handleInsertToDoc(parseThinkTags(msg.content).reply)} className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" title="插入文档">
                    <ArrowDownToLine className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {isStreaming && streamingContent && (() => {
          const parsed = parseThinkTags(streamingContent);
          return (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                {parsed.thinking && <ThinkingBlock content={parsed.thinking} isStreaming={parsed.isThinking} />}
                {parsed.reply ? (
                  <div>
                    <MarkdownContent content={parsed.reply} />
                    {!parsed.isThinking && <span className="inline-block w-1.5 h-4 ml-0.5 bg-gray-400 dark:bg-gray-500 animate-pulse rounded-sm" />}
                  </div>
                ) : parsed.isThinking ? null : (
                  <span className="inline-block w-1.5 h-4 bg-gray-400 dark:bg-gray-500 animate-pulse rounded-sm" />
                )}
              </div>
            </div>
          );
        })()}

        {isStreaming && !streamingContent && (
          <div className="flex justify-start">
            <div className="rounded-2xl px-3.5 py-2.5 bg-gray-100 dark:bg-gray-700">
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-3 pb-3 pt-2 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-end gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入问题..."
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 outline-none max-h-[120px]"
            style={{ height: 'auto', minHeight: '24px' }}
            onInput={(e) => {
              const t = e.currentTarget;
              t.style.height = 'auto';
              t.style.height = Math.min(t.scrollHeight, 120) + 'px';
            }}
            disabled={isStreaming}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="p-1.5 rounded-lg bg-blue-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors flex-shrink-0"
          >
            {isStreaming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </div>
        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5 text-center">
          Enter 发送 · Shift+Enter 换行
        </p>
      </div>
    </div>
  );

  // ── Render by mode ──
  if (mode === 'floating') {
    return (
      <div
        ref={floatRef}
        className={`fixed z-40 shadow-2xl rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden ${isClosing ? 'animate-ai-chat-out' : 'animate-ai-chat-in'}`}
        style={{
          width: 380,
          height: 520,
          right: 72 - floatPos.x,
          bottom: 24 - floatPos.y,
          transformOrigin: 'bottom right',
        }}
      >
        {chatContent}
      </div>
    );
  }

  // Sidebar mode
  return (
    <SidebarWrapper width={sidebarWidth} onResize={handleSidebarResize}>
      {chatContent}
    </SidebarWrapper>
  );
}
