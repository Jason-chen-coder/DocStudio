import { useCallback, useEffect, useRef, useState } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import * as d3 from 'd3';
import { v4 as uuid } from 'uuid';
import {
  Palette,
  Minus,
  Plus,
  Trash2,
  Undo2,
  ZoomIn,
  ZoomOut,
  Crosshair,
} from 'lucide-react';
import type { DrawingLine } from './drawing-extension';

const MIN_DISPLAY_WIDTH = 260;
const ZOOM_PRESETS = [50, 100, 150, 200];
const ZOOM_STEP = 10;
const ZOOM_MIN = 25;
const ZOOM_MAX = 300;

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

const COLORS = [
  '#1a1a1a',
  '#A975FF',
  '#FB5151',
  '#FD9170',
  '#FFCB6B',
  '#68CEF8',
  '#80CBC4',
  '#9DEF8F',
  '#ffffff',
];

export function DrawingNodeView({ node, updateAttributes, selected, editor }: NodeViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [color, setColor] = useState('#1a1a1a');
  const [size, setSize] = useState(3);
  const [showColors, setShowColors] = useState(false);
  const [showZoomMenu, setShowZoomMenu] = useState(false);
  const [showMinimap, setShowMinimap] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [displaySize, setDisplaySize] = useState<{ w: number; h: number } | null>(null);

  // Drawing state refs (avoid re-renders during drawing)
  const drawingRef = useRef(false);
  const pointsRef = useRef<[number, number][]>([]);
  const pathRef = useRef<d3.Selection<SVGPathElement, [number, number][], null, undefined> | null>(null);
  const idRef = useRef(uuid());
  const colorRef = useRef(color);
  const sizeRef = useRef(size);

  // Keep refs in sync
  useEffect(() => {
    colorRef.current = color;
  }, [color]);
  useEffect(() => {
    sizeRef.current = size;
  }, [size]);

  const lines: DrawingLine[] = node.attrs.lines || [];
  const viewBoxWidth = node.attrs.width || 800;
  const viewBoxHeight = node.attrs.height || 300;
  // displayWidth controls the pixel width of the entire component (null = 100%)
  const displayWidth: number | null = node.attrs.displayWidth ?? null;
  const panX: number = node.attrs.panX || 0;
  const panY: number = node.attrs.panY || 0;
  const isEditable = editor.isEditable;
  const minimapRef = useRef<HTMLDivElement>(null);

  // Zoom: display percentage is inverse of viewBox scale (smaller viewBox = bigger display = higher %)
  const baseWidth = 800;
  const zoomPercent = Math.round((baseWidth / viewBoxWidth) * 100);

  const applyZoom = useCallback(
    (displayPercent: number, resetPan = false) => {
      const clamped = Math.min(Math.max(displayPercent, ZOOM_MIN), ZOOM_MAX);
      // Inverse: higher display % = smaller viewBox
      const newW = Math.round((baseWidth * 100) / clamped);
      const newH = Math.round((viewBoxHeight / viewBoxWidth) * newW);
      const attrs: Record<string, number> = { width: newW, height: newH };
      if (resetPan) {
        attrs.panX = 0;
        attrs.panY = 0;
      }
      updateAttributes(attrs);
    },
    [viewBoxWidth, viewBoxHeight, updateAttributes],
  );

  const handleZoomIn = useCallback(() => {
    applyZoom(zoomPercent + ZOOM_STEP);
  }, [zoomPercent, applyZoom]);

  const handleZoomOut = useCallback(() => {
    applyZoom(zoomPercent - ZOOM_STEP);
  }, [zoomPercent, applyZoom]);

  const handleResetPan = useCallback(() => {
    updateAttributes({ panX: 0, panY: 0 });
  }, [updateAttributes]);

  // Minimap: click or drag to move viewport center
  const handleMinimapInteraction = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const el = minimapRef.current;
      if (!el) return;

      // The minimap SVG viewBox is always the base coordinate space
      const baseH = Math.round((viewBoxHeight / viewBoxWidth) * baseWidth);
      const rect = el.getBoundingClientRect();

      const applyPosition = (clientX: number, clientY: number) => {
        // Convert mouse position to base coordinate space
        const ratioX = (clientX - rect.left) / rect.width;
        const ratioY = (clientY - rect.top) / rect.height;
        const targetX = ratioX * baseWidth;
        const targetY = ratioY * baseH;
        // Center the viewport on click point
        const newPanX = Math.round(targetX - viewBoxWidth / 2);
        const newPanY = Math.round(targetY - viewBoxHeight / 2);
        updateAttributes({ panX: newPanX, panY: newPanY });
      };

      applyPosition(e.clientX, e.clientY);

      const onMouseMove = (ev: MouseEvent) => {
        applyPosition(ev.clientX, ev.clientY);
      };
      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },
    [viewBoxWidth, viewBoxHeight, updateAttributes],
  );

  const handleResizeStart = useCallback(
    (dir: ResizeDir, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isEditable || !wrapperRef.current) return;

      setResizing(true);
      const startX = e.clientX;
      const startY = e.clientY;
      const startW = wrapperRef.current.offsetWidth;
      const startH = wrapperRef.current.offsetHeight;
      const aspect = startW / startH;
      const parentWidth = wrapperRef.current.parentElement?.offsetWidth || 800;

      const onMouseMove = (ev: MouseEvent) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;

        let newW = startW;
        let newH = startH;

        if (dir.includes('e')) newW = startW + dx;
        if (dir.includes('w')) newW = startW - dx;
        if (dir.includes('s')) newH = startH + dy;
        if (dir.includes('n')) newH = startH - dy;

        // Corner: maintain aspect ratio
        if (dir.length === 2) {
          if (Math.abs(dx) > Math.abs(dy)) {
            newH = newW / aspect;
          } else {
            newW = newH * aspect;
          }
        }
        // Pure horizontal: maintain aspect ratio
        if (dir === 'e' || dir === 'w') newH = newW / aspect;
        // Pure vertical: maintain aspect ratio
        if (dir === 'n' || dir === 's') newW = newH * aspect;

        // Clamp
        newW = Math.min(Math.max(newW, MIN_DISPLAY_WIDTH), parentWidth);
        newH = newW / aspect;

        const w = Math.round(newW);
        const h = Math.round(newH);
        setDisplaySize({ w, h });
        updateAttributes({ displayWidth: w });
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

  const tick = useCallback(() => {
    requestAnimationFrame(() => {
      if (!pathRef.current) return;
      pathRef.current.attr('d', () => {
        const pathData = d3.line().curve(d3.curveBasis)(pointsRef.current);
        if (!pathData) return '';

        const currentLines: DrawingLine[] = node.attrs.lines || [];
        const otherLines = currentLines.filter((item: DrawingLine) => item.id !== idRef.current);

        updateAttributes({
          lines: [
            ...otherLines,
            {
              id: idRef.current,
              color: colorRef.current,
              size: sizeRef.current,
              path: pathData,
            },
          ],
        });

        return pathData;
      });
    });
  }, [node.attrs.lines, updateAttributes]);

  const onStartDrawing = useCallback(
    (event: MouseEvent | TouchEvent) => {
      if (!isEditable) return;
      event.preventDefault();
      drawingRef.current = true;
      pointsRef.current = [];

      const svg = d3.select(svgRef.current);
      pathRef.current = svg
        .append('path')
        .datum(pointsRef.current)
        .attr('id', `id-${idRef.current}`)
        .attr('stroke', colorRef.current)
        .attr('stroke-width', sizeRef.current)
        .attr('fill', 'none')
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round') as unknown as d3.Selection<SVGPathElement, [number, number][], null, undefined>;
    },
    [isEditable],
  );

  const onMove = useCallback(
    (event: MouseEvent | TouchEvent) => {
      if (!drawingRef.current) return;
      event.preventDefault();
      const svg = svgRef.current;
      if (!svg) return;

      // Get coordinates relative to SVG
      const point = d3.pointers(event, svg)[0];
      if (point) {
        pointsRef.current.push(point as [number, number]);
        tick();
      }
    },
    [tick],
  );

  const onEndDrawing = useCallback(() => {
    if (!drawingRef.current) return;
    drawingRef.current = false;

    // Remove the live path from SVG (it's persisted via attrs)
    const svg = d3.select(svgRef.current);
    svg.select(`#id-${idRef.current}`).remove();

    // Generate new id for next stroke
    idRef.current = uuid();
    pathRef.current = null;
  }, []);

  const handleClear = useCallback(() => {
    updateAttributes({ lines: [] });
  }, [updateAttributes]);

  const handleUndo = useCallback(() => {
    const currentLines: DrawingLine[] = node.attrs.lines || [];
    if (currentLines.length > 0) {
      updateAttributes({ lines: currentLines.slice(0, -1) });
    }
  }, [node.attrs.lines, updateAttributes]);

  // Attach D3 event listeners
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !isEditable) return;

    const svgSelection = d3.select(svg);

    svgSelection
      .on('mousedown', onStartDrawing)
      .on('mousemove', onMove)
      .on('mouseup', onEndDrawing)
      .on('mouseleave', onEndDrawing)
      .on('touchstart', onStartDrawing)
      .on('touchmove', onMove)
      .on('touchend', onEndDrawing)
      .on('touchleave', onEndDrawing);

    return () => {
      svgSelection
        .on('mousedown', null)
        .on('mousemove', null)
        .on('mouseup', null)
        .on('mouseleave', null)
        .on('touchstart', null)
        .on('touchmove', null)
        .on('touchend', null)
        .on('touchleave', null);
    };
  }, [isEditable, onStartDrawing, onMove, onEndDrawing]);

  const showHandles = isEditable && selected;

  return (
    <NodeViewWrapper className="drawing-block my-4" data-drag-handle="">
      {/* Outer wrapper: controls the overall pixel size of the entire drawing widget */}
      <div
        ref={wrapperRef}
        className={`relative inline-block p-[10px] ${selected ? 'ring-2 ring-blue-400 rounded-lg' : ''}`}
        style={{
          width: displayWidth ? `${displayWidth}px` : '100%',
          maxWidth: '100%',
        }}
      >
        {/* Toolbar */}
        <div className="drawing-toolbar flex items-center gap-1 mb-2 p-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex-wrap">
          {isEditable && (<>

            {/* Color picker */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowColors(!showColors)}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <div
                  className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600"
                  style={{ backgroundColor: color }}
                />
                <Palette className="w-3.5 h-3.5" />
              </button>
              {showColors && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowColors(false)} />
                  <div className="absolute left-0 top-full mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 flex gap-1.5">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setColor(c);
                          setShowColors(false);
                        }}
                        className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                          color === c
                            ? 'border-blue-500 scale-110'
                            : 'border-gray-200 dark:border-gray-600'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Stroke size */}
            <div className="flex items-center gap-1 px-1.5 border-l border-gray-200 dark:border-gray-700 ml-1">
              <button
                type="button"
                onClick={() => setSize((s) => Math.max(1, s - 1))}
                className="p-1 rounded text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-mono text-gray-600 dark:text-gray-300 w-5 text-center">
                {size}
              </span>
              <button
                type="button"
                onClick={() => setSize((s) => Math.min(20, s + 1))}
                className="p-1 rounded text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-0.5 px-1.5 border-l border-gray-200 dark:border-gray-700 ml-1">
              <button
                type="button"
                onClick={handleUndo}
                disabled={lines.length === 0}
                className="p-1.5 rounded text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-30"
                title="撤销上一笔"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleClear}
                disabled={lines.length === 0}
                className="p-1.5 rounded text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-30"
                title="清除画布"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

          </>)}
            {/* Zoom controls */}
            <div className="flex items-center gap-0.5 px-1.5 border-l border-gray-200 dark:border-gray-700 ml-auto">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomPercent <= ZOOM_MIN}
                className="p-1 rounded text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-30"
                title="缩小画布"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowZoomMenu(!showZoomMenu)}
                  className="px-1.5 py-0.5 rounded text-xs font-mono text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors min-w-[3rem] text-center"
                >
                  {zoomPercent}%
                </button>
                {showZoomMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowZoomMenu(false)} />
                    <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[5rem]">
                      {ZOOM_PRESETS.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            applyZoom(preset, true);
                            setShowZoomMenu(false);
                          }}
                          className={`w-full px-3 py-1.5 text-xs text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                            zoomPercent === preset
                              ? 'text-blue-500 font-semibold'
                              : 'text-gray-600 dark:text-gray-300'
                          }`}
                        >
                          {preset}%
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomPercent >= ZOOM_MAX}
                className="p-1 rounded text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-30"
                title="放大画布"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              {/* Reset pan */}
              <button
                type="button"
                onClick={handleResetPan}
                disabled={panX === 0 && panY === 0}
                className="p-1 rounded text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-30"
                title="重置视口位置"
              >
                <Crosshair className="w-3.5 h-3.5" />
              </button>

              {/* Minimap popover */}
              {zoomPercent > 100 && lines.length > 0 && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowMinimap(!showMinimap)}
                    className={`p-1 rounded text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${showMinimap ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
                    title="小地图"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="1" y="1" width="14" height="14" rx="1.5" />
                      <rect x="8" y="8" width="6" height="6" rx="1" strokeDasharray="2 1" />
                    </svg>
                  </button>
                  {showMinimap && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowMinimap(false)} />
                      <div
                        ref={minimapRef}
                        onMouseDown={handleMinimapInteraction}
                        className="absolute right-0 top-full mt-1 z-50 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg overflow-hidden cursor-pointer"
                        style={{ width: 160, height: Math.round(160 * (viewBoxHeight / viewBoxWidth)) }}
                        title="点击或拖拽移动视口"
                      >
                        <svg
                          viewBox={`0 0 ${baseWidth} ${Math.round((viewBoxHeight / viewBoxWidth) * baseWidth)}`}
                          className="w-full h-full bg-gray-50 dark:bg-gray-900"
                          style={{ pointerEvents: 'none' }}
                        >
                          {lines.map((line: DrawingLine) => (
                            <path
                              key={`mini-${line.id}`}
                              d={line.path}
                              stroke={line.color}
                              strokeWidth={Math.max(line.size * 0.5, 1)}
                              fill="none"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          ))}
                          <rect
                            x={panX}
                            y={panY}
                            width={viewBoxWidth}
                            height={viewBoxHeight}
                            fill="rgba(59,130,246,0.08)"
                            stroke="rgba(59,130,246,0.5)"
                            strokeWidth={4}
                            rx={2}
                          />
                        </svg>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

        {/* Canvas */}
        <svg
          ref={svgRef}
          viewBox={`${panX} ${panY} ${viewBoxWidth} ${viewBoxHeight}`}
          className={`drawing-canvas w-full border border-gray-200 dark:border-gray-700 rounded-lg transition-all ${
            isEditable
              ? 'cursor-crosshair bg-gray-50 dark:bg-gray-900'
              : 'bg-white dark:bg-gray-900'
          }`}
          style={{ aspectRatio: `${viewBoxWidth} / ${viewBoxHeight}` }}
        >
          {lines.map((line: DrawingLine) => (
            <path
              key={line.id}
              d={line.path}
              stroke={line.color}
              strokeWidth={line.size}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </svg>

        {/* Minimap and reset pan moved to toolbar */}

        {/* Resize handles around entire widget */}
        {showHandles && (
          <>
            {/* Edge handles */}
            <div
              onMouseDown={(e) => handleResizeStart('n', e)}
              className={`absolute top-0 left-3 right-3 h-2 ${CURSOR_MAP.n} flex justify-center items-start`}
              style={{ marginTop: '-4px' }}
            >
              <div className="w-8 h-1 rounded-full bg-blue-500 opacity-60 hover:opacity-100 transition-opacity" />
            </div>
            <div
              onMouseDown={(e) => handleResizeStart('s', e)}
              className={`absolute bottom-0 left-3 right-3 h-2 ${CURSOR_MAP.s} flex justify-center items-end`}
              style={{ marginBottom: '-4px' }}
            >
              <div className="w-8 h-1 rounded-full bg-blue-500 opacity-60 hover:opacity-100 transition-opacity" />
            </div>
            <div
              onMouseDown={(e) => handleResizeStart('w', e)}
              className={`absolute left-0 top-3 bottom-3 w-2 ${CURSOR_MAP.w} flex items-center justify-start`}
              style={{ marginLeft: '-4px' }}
            >
              <div className="h-8 w-1 rounded-full bg-blue-500 opacity-60 hover:opacity-100 transition-opacity" />
            </div>
            <div
              onMouseDown={(e) => handleResizeStart('e', e)}
              className={`absolute right-0 top-3 bottom-3 w-2 ${CURSOR_MAP.e} flex items-center justify-end`}
              style={{ marginRight: '-4px' }}
            >
              <div className="h-8 w-1 rounded-full bg-blue-500 opacity-60 hover:opacity-100 transition-opacity" />
            </div>

            {/* Corner handles */}
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
