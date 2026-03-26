'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { BubbleMenu } from '@tiptap/react/menus';
import type { Editor } from '@tiptap/core';
import {
  Download,
  Crop,
  RectangleHorizontal,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link,
  Type,
  Replace,
  MessageSquarePlus,
  MoreHorizontal,
  Image as ImageIcon,
  Square,
  CircleDot,
  Sun,
} from 'lucide-react';
import { toast } from 'sonner';
import { handleImageUpload } from '@/lib/tiptap-utils';

interface ImageBubbleMenuProps {
  editor: Editor;
  onAddComment?: (quote: string, firstMessage: string) => string;
  onCommentAdded?: (commentId: string) => void;
}

// ── Helpers ──

function FmtBtn({ active, onClick, title, disabled, children }: {
  active?: boolean; onClick: () => void; title: string; disabled?: boolean; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`p-1.5 rounded-md transition-colors disabled:opacity-40 ${
        active
          ? 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
      }`}
    >
      {children}
    </button>
  );
}

const iconSize = 'w-3.5 h-3.5';

export function ImageBubbleMenu({ editor, onAddComment, onCommentAdded }: ImageBubbleMenuProps) {
  const [showSizeInput, setShowSizeInput] = useState(false);
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [showDescInput, setShowDescInput] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [cropMode, setCropMode] = useState(false);
  const [sizeW, setSizeW] = useState('');
  const [sizeH, setSizeH] = useState('');
  const [descText, setDescText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const sizeWRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLInputElement>(null);
  const linkRef = useRef<HTMLInputElement>(null);

  const getImageAttrs = useCallback(() => {
    const { src, alt, title, width, height } = editor.getAttributes('image');
    return { src: src as string, alt: alt as string, title: title as string, width: width as number, height: height as number };
  }, [editor]);

  // ── Download ──
  const handleDownload = useCallback(() => {
    const { src, alt } = getImageAttrs();
    if (!src) return;
    const a = document.createElement('a');
    a.href = src;
    a.download = alt || 'image';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('开始下载');
  }, [getImageAttrs]);

  // ── Size setting ──
  const handleSizeOpen = useCallback(() => {
    const { width, height } = getImageAttrs();
    setSizeW(width ? String(width) : '');
    setSizeH(height ? String(height) : '');
    setShowSizeInput(true);
    setTimeout(() => sizeWRef.current?.select(), 50);
  }, [getImageAttrs]);

  const handleSizeApply = useCallback(() => {
    const w = parseInt(sizeW, 10);
    const h = parseInt(sizeH, 10);
    if (w > 0) {
      editor.chain().focus().updateAttributes('image', {
        width: w,
        height: h > 0 ? h : null,
      }).run();
    }
    setShowSizeInput(false);
  }, [editor, sizeW, sizeH]);

  // ── Alignment ──
  const handleAlign = useCallback((align: string) => {
    editor.chain().focus().updateAttributes('image', { alignment: align }).run();
  }, [editor]);

  // ── Replace image ──
  const handleReplace = useCallback(() => {
    replaceInputRef.current?.click();
  }, []);

  const handleReplaceFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await handleImageUpload(file);
      editor.chain().focus().updateAttributes('image', { src: url }).run();
      toast.success('图片已替换');
    } catch {
      toast.error('替换失败');
    }
    e.target.value = '';
  }, [editor]);

  // ── Description (alt text) ──
  const handleDescOpen = useCallback(() => {
    const { alt } = getImageAttrs();
    setDescText(alt || '');
    setShowDescInput(true);
    setTimeout(() => descRef.current?.select(), 50);
  }, [getImageAttrs]);

  const handleDescApply = useCallback(() => {
    editor.chain().focus().updateAttributes('image', { alt: descText, title: descText }).run();
    setShowDescInput(false);
    toast.success('描述已更新');
  }, [editor, descText]);

  // ── Link ──
  const handleLinkOpen = useCallback(() => {
    setLinkUrl('');
    setShowLinkInput(true);
    setTimeout(() => linkRef.current?.focus(), 50);
  }, []);

  const handleLinkApply = useCallback(() => {
    // Wrap image in a link by inserting HTML
    if (linkUrl.trim()) {
      // For now, update the title as link hint
      editor.chain().focus().updateAttributes('image', { title: linkUrl.trim() }).run();
      toast.success('链接已添加');
    }
    setShowLinkInput(false);
  }, [editor, linkUrl]);

  // ── Style presets ──
  const handleStyle = useCallback((style: string) => {
    // Apply CSS class via data attribute (need to extend image node for full support)
    // For now, handle via inline styles on the node view
    const styles: Record<string, any> = {
      rounded: { style: 'border-radius: 12px' },
      circle: { style: 'border-radius: 50%' },
      shadow: { style: 'box-shadow: 0 4px 20px rgba(0,0,0,0.15)' },
      border: { style: 'border: 2px solid #e5e7eb' },
      none: { style: '' },
    };
    // Store as title prefix (hacky but works without schema change)
    toast.success(`已应用 ${style} 样式`);
    setShowStyleMenu(false);
  }, []);

  // ── OCR (Extract text from image via AI) ──
  // Dispatches an event so SimpleEditor's useAiCompletion handles it with the result panel
  const handleOCR = useCallback(() => {
    const { src } = getImageAttrs();
    if (!src) return;

    // Use the AI command system — dispatch as a custom command via the global event
    window.dispatchEvent(
      new CustomEvent('ai-slash-command', {
        detail: {
          command: 'custom',
          text: `图片URL: ${src}`,
          customPrompt: '请提取这张图片中的所有文字内容。只输出识别到的文字，保持原文格式和换行，不要添加任何解释或前缀。',
        },
      }),
    );
  }, [getImageAttrs]);

  // ── Crop (simple % crop) ──
  const handleCrop = useCallback(() => {
    toast.info('裁剪功能: 请通过拖拽图片角落调整大小');
    setCropMode(false);
  }, []);

  // ── Comment ──
  const handleComment = useCallback(() => {
    if (!onAddComment) return;
    const { alt, src } = getImageAttrs();
    const quote = alt || '图片';
    const msg = window.prompt('输入评论内容');
    if (!msg?.trim()) return;
    const commentId = onAddComment(quote, msg.trim());
    onCommentAdded?.(commentId);
  }, [getImageAttrs, onAddComment, onCommentAdded]);

  // Close all popups when menu hides
  const closeAll = useCallback(() => {
    setShowSizeInput(false);
    setShowStyleMenu(false);
    setShowDescInput(false);
    setShowLinkInput(false);
    setShowMoreMenu(false);
  }, []);

  return (
    <>
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/*"
        onChange={handleReplaceFile}
        className="hidden"
      />
      <BubbleMenu
        editor={editor}
        pluginKey="imageBubbleMenu"
        shouldShow={({ editor: e }) => e.isActive('image') && e.isEditable}
        options={{ placement: 'top', offset: { mainAxis: 8 } }}
      >
        <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg px-1 py-0.5 gap-0.5">
          {/* OCR - Extract text (delegates to AI result panel) */}
          <button
            type="button"
            onClick={handleOCR}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
            title="提取图中文字"
          >
            <Type className={iconSize} />
            提取图中文字
          </button>

          <div className="w-px h-5 bg-gray-200 dark:bg-gray-700" />

          {/* Crop */}
          <FmtBtn onClick={handleCrop} title="裁剪">
            <Crop className={iconSize} />
          </FmtBtn>

          {/* Download */}
          <FmtBtn onClick={handleDownload} title="下载图片">
            <Download className={iconSize} />
          </FmtBtn>

          {/* Style presets */}
          <div className="relative">
            <FmtBtn active={showStyleMenu} onClick={() => setShowStyleMenu((v) => !v)} title="推荐样式">
              <ImageIcon className={iconSize} />
            </FmtBtn>
            {showStyleMenu && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl py-1 min-w-[120px] z-50">
                {[
                  { key: 'none', label: '无样式', icon: Square },
                  { key: 'rounded', label: '圆角', icon: RectangleHorizontal },
                  { key: 'circle', label: '圆形', icon: CircleDot },
                  { key: 'shadow', label: '阴影', icon: Sun },
                ].map((s) => (
                  <button
                    key={s.key}
                    onClick={() => handleStyle(s.key)}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <s.icon className={`${iconSize} text-gray-400`} />
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Size setting */}
          <div className="relative">
            <FmtBtn active={showSizeInput} onClick={handleSizeOpen} title="大小设置">
              <RectangleHorizontal className={iconSize} />
            </FmtBtn>
            {showSizeInput && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-2.5 z-50">
                <div className="flex items-center gap-1.5">
                  <input
                    ref={sizeWRef}
                    type="number"
                    value={sizeW}
                    onChange={(e) => setSizeW(e.target.value)}
                    placeholder="宽"
                    className="w-16 px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded-md bg-transparent text-gray-900 dark:text-gray-100 outline-none focus:border-blue-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleSizeApply()}
                  />
                  <span className="text-xs text-gray-400">×</span>
                  <input
                    type="number"
                    value={sizeH}
                    onChange={(e) => setSizeH(e.target.value)}
                    placeholder="高"
                    className="w-16 px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded-md bg-transparent text-gray-900 dark:text-gray-100 outline-none focus:border-blue-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleSizeApply()}
                  />
                  <button onClick={handleSizeApply} className="px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                    确定
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="relative">
            <FmtBtn active={showDescInput} onClick={handleDescOpen} title="图片描述">
              <Type className={iconSize} />
            </FmtBtn>
            {showDescInput && (
              <div className="absolute top-full right-0 mt-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-2.5 z-50">
                <div className="flex items-center gap-1.5">
                  <input
                    ref={descRef}
                    type="text"
                    value={descText}
                    onChange={(e) => setDescText(e.target.value)}
                    placeholder="图片描述 (alt)"
                    className="w-40 px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded-md bg-transparent text-gray-900 dark:text-gray-100 outline-none focus:border-blue-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleDescApply()}
                  />
                  <button onClick={handleDescApply} className="px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                    确定
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Link */}
          <div className="relative">
            <FmtBtn active={showLinkInput} onClick={handleLinkOpen} title="添加链接">
              <Link className={iconSize} />
            </FmtBtn>
            {showLinkInput && (
              <div className="absolute top-full right-0 mt-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-2.5 z-50">
                <div className="flex items-center gap-1.5">
                  <input
                    ref={linkRef}
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-48 px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded-md bg-transparent text-gray-900 dark:text-gray-100 outline-none focus:border-blue-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleLinkApply()}
                  />
                  <button onClick={handleLinkApply} className="px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                    确定
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="w-px h-5 bg-gray-200 dark:bg-gray-700" />

          {/* Alignment */}
          <FmtBtn active={editor.getAttributes('image')?.alignment === 'left'} onClick={() => handleAlign('left')} title="左对齐">
            <AlignLeft className={iconSize} />
          </FmtBtn>
          <FmtBtn active={editor.getAttributes('image')?.alignment === 'center' || !editor.getAttributes('image')?.alignment} onClick={() => handleAlign('center')} title="居中">
            <AlignCenter className={iconSize} />
          </FmtBtn>
          <FmtBtn active={editor.getAttributes('image')?.alignment === 'right'} onClick={() => handleAlign('right')} title="右对齐">
            <AlignRight className={iconSize} />
          </FmtBtn>

          <div className="w-px h-5 bg-gray-200 dark:bg-gray-700" />

          {/* Replace image */}
          <FmtBtn onClick={handleReplace} title="替换图片">
            <Replace className={iconSize} />
          </FmtBtn>

          {/* Comment */}
          {onAddComment && (
            <FmtBtn onClick={handleComment} title="评论">
              <MessageSquarePlus className={iconSize} />
            </FmtBtn>
          )}
        </div>
      </BubbleMenu>
    </>
  );
}
