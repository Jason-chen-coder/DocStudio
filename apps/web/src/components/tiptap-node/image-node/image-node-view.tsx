'use client';

import { NodeViewWrapper } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import { useState, useRef, useCallback } from 'react';

const MIN_SIZE = 60;
const MAX_WIDTH_RATIO = 1.0;

type ResizeDir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

const CURSOR_MAP: Record<ResizeDir, string> = {
  n: 'cursor-ns-resize',
  s: 'cursor-ns-resize',
  e: 'cursor-ew-resize',
  w: 'cursor-ew-resize',
  ne: 'cursor-nesw-resize',
  nw: 'cursor-nwse-resize',
  se: 'cursor-nwse-resize',
  sw: 'cursor-nesw-resize',
};

export function ImageNodeView({ node, updateAttributes, selected, editor }: NodeViewProps) {
  const { src, alt, title, width: savedWidth, height: savedHeight } = node.attrs;
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [resizing, setResizing] = useState(false);
  const [displaySize, setDisplaySize] = useState<{ w: number; h: number } | null>(null);
  const isEditable = editor.isEditable;

  const currentWidth = savedWidth ? Number(savedWidth) : undefined;
  const currentHeight = savedHeight ? Number(savedHeight) : undefined;

  const handleResizeStart = useCallback(
    (dir: ResizeDir, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isEditable || !imgRef.current || !containerRef.current) return;

      setResizing(true);
      const startX = e.clientX;
      const startY = e.clientY;
      const startW = imgRef.current.offsetWidth;
      const startH = imgRef.current.offsetHeight;
      const aspect = startW / startH;
      const containerWidth = containerRef.current.parentElement?.offsetWidth || 800;
      const maxW = containerWidth * MAX_WIDTH_RATIO;

      const onMouseMove = (ev: MouseEvent) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;

        let newW = startW;
        let newH = startH;

        // Horizontal component
        if (dir.includes('e')) newW = startW + dx;
        if (dir.includes('w')) newW = startW - dx;

        // Vertical component
        if (dir.includes('s')) newH = startH + dy;
        if (dir.includes('n')) newH = startH - dy;

        // For corner handles, maintain aspect ratio based on dominant axis
        if (dir.length === 2) {
          const absDx = Math.abs(dx);
          const absDy = Math.abs(dy);
          if (absDx > absDy) {
            newH = newW / aspect;
          } else {
            newW = newH * aspect;
          }
        }

        // For pure horizontal, keep aspect ratio
        if (dir === 'e' || dir === 'w') {
          newH = newW / aspect;
        }

        // For pure vertical, keep aspect ratio
        if (dir === 'n' || dir === 's') {
          newW = newH * aspect;
        }

        // Clamp
        newW = Math.min(Math.max(newW, MIN_SIZE), maxW);
        newH = Math.max(newW / aspect, MIN_SIZE);
        newW = newH * aspect;

        const w = Math.round(newW);
        const h = Math.round(newH);
        setDisplaySize({ w, h });
        updateAttributes({ width: w, height: h });
      };

      const onMouseUp = () => {
        setResizing(false);
        setDisplaySize(null);
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },
    [isEditable, updateAttributes],
  );

  if (!src) return null;

  const showHandles = isEditable && selected;

  return (
    <NodeViewWrapper ref={containerRef} className="my-3" data-drag-handle>
      <div
        className={`relative inline-block ${selected ? 'ring-2 ring-blue-400 ring-offset-2 dark:ring-offset-gray-900 rounded-lg' : ''}`}
        style={{
          width: currentWidth ? `${currentWidth}px` : undefined,
          maxWidth: '100%',
        }}
      >
        <img
          ref={imgRef}
          src={src}
          alt={alt || ''}
          title={title || ''}
          loading="lazy"
          decoding="async"
          draggable={false}
          className="block rounded-lg max-w-full"
          style={{
            width: currentWidth ? `${currentWidth}px` : undefined,
            height: currentHeight ? `${currentHeight}px` : 'auto',
          }}
        />

        {showHandles && (
          <>
            {/* ── Edge handles ── */}
            {/* Top */}
            <div
              onMouseDown={(e) => handleResizeStart('n', e)}
              className={`absolute top-0 left-3 right-3 h-2 ${CURSOR_MAP.n} flex justify-center items-start`}
              style={{ marginTop: '-4px' }}
            >
              <div className="w-8 h-1 rounded-full bg-blue-500 opacity-60 hover:opacity-100 transition-opacity" />
            </div>
            {/* Bottom */}
            <div
              onMouseDown={(e) => handleResizeStart('s', e)}
              className={`absolute bottom-0 left-3 right-3 h-2 ${CURSOR_MAP.s} flex justify-center items-end`}
              style={{ marginBottom: '-4px' }}
            >
              <div className="w-8 h-1 rounded-full bg-blue-500 opacity-60 hover:opacity-100 transition-opacity" />
            </div>
            {/* Left */}
            <div
              onMouseDown={(e) => handleResizeStart('w', e)}
              className={`absolute left-0 top-3 bottom-3 w-2 ${CURSOR_MAP.w} flex items-center justify-start`}
              style={{ marginLeft: '-4px' }}
            >
              <div className="h-8 w-1 rounded-full bg-blue-500 opacity-60 hover:opacity-100 transition-opacity" />
            </div>
            {/* Right */}
            <div
              onMouseDown={(e) => handleResizeStart('e', e)}
              className={`absolute right-0 top-3 bottom-3 w-2 ${CURSOR_MAP.e} flex items-center justify-end`}
              style={{ marginRight: '-4px' }}
            >
              <div className="h-8 w-1 rounded-full bg-blue-500 opacity-60 hover:opacity-100 transition-opacity" />
            </div>

            {/* ── Corner handles ── */}
            {(['nw', 'ne', 'sw', 'se'] as const).map((corner) => {
              const isTop = corner.includes('n');
              const isLeft = corner.includes('w');
              return (
                <div
                  key={corner}
                  onMouseDown={(e) => handleResizeStart(corner, e)}
                  className={`absolute w-3 h-3 ${CURSOR_MAP[corner]}`}
                  style={{
                    [isTop ? 'top' : 'bottom']: '-4px',
                    [isLeft ? 'left' : 'right']: '-4px',
                  }}
                >
                  <div className="w-2.5 h-2.5 rounded-sm bg-blue-500 border-2 border-white dark:border-gray-900 shadow-sm" />
                </div>
              );
            })}

            {/* Size indicator while resizing */}
            {resizing && displaySize && (
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-black/75 text-white text-[11px] rounded-md tabular-nums whitespace-nowrap shadow-lg">
                {displaySize.w} × {displaySize.h}
              </div>
            )}
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
}
