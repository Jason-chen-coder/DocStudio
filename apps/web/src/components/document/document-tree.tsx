'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AlertDialog, Button, Flex } from '@radix-ui/themes';
import {
  DndContext,
  DragEndEvent,
  DragMoveEvent,
  DragOverEvent,
  DragStartEvent,
  MeasuringStrategy,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  UniqueIdentifier,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ChevronRight,
  FileText,
  Trash2,
  GripVertical,
  PenLine,
  Link2,
  FolderOpen,
} from 'lucide-react';
import { useDocuments } from '@/hooks/use-documents';
import { Document } from '@/types/document';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ─── 常量 ─────────────────────────────────────────────
const INDENT_WIDTH = 20; // px per depth level

// ─── 类型 ────────────────────────────────────────────
interface TreeNode extends Document {
  children: TreeNode[];
  depth: number;
  index: number;
}

type Projection = { depth: number; parentId: string | null };

// ─── 工具函数 ──────────────────────────────────────────

/** 将扁平列表构建为有序树（按 order 排序，标注 depth/index） */
function buildTree(documents: Document[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  documents.forEach((doc) => {
    map.set(doc.id, { ...doc, children: [], depth: 0, index: 0 });
  });

  documents.forEach((doc) => {
    const node = map.get(doc.id)!;
    if (doc.parentId && map.has(doc.parentId)) {
      map.get(doc.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortFn = (a: TreeNode, b: TreeNode) => a.order - b.order;
  const sortAndLabel = (nodes: TreeNode[], depth = 0) => {
    nodes.sort(sortFn);
    nodes.forEach((node, i) => {
      node.depth = depth;
      node.index = i;
      sortAndLabel(node.children, depth + 1);
    });
  };
  sortAndLabel(roots);
  return roots;
}

/** 将树展开为扁平列表（仅收录已展开的子节点） */
function flattenTree(
  nodes: TreeNode[],
  expanded: Record<string, boolean>
): TreeNode[] {
  const result: TreeNode[] = [];
  const walk = (items: TreeNode[]) => {
    for (const item of items) {
      result.push(item);
      if (expanded[item.id] && item.children.length > 0) {
        walk(item.children);
      }
    }
  };
  walk(nodes);
  return result;
}

/** 小数位法：计算落在 prev 和 next 之间的 order 值 */
function calcOrder(prev: number | undefined, next: number | undefined): number {
  if (prev === undefined && next === undefined) return 1;
  if (prev === undefined) return next! - 1;
  if (next === undefined) return prev + 1;
  return (prev + next) / 2;
}

// ─── 主组件 ─────────────────────────────────────────────

export function DocumentTree({ spaceId, className }: { spaceId: string; className?: string }) {
  const { documents, loading, deleteDocument, moveDocument } = useDocuments(spaceId);
  const pathname = usePathname();
  const router = useRouter();

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [overId, setOverId] = useState<UniqueIdentifier | null>(null);
  const [offsetLeft, setOffsetLeft] = useState(0);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const tree = useMemo(() => buildTree(documents), [documents]);
  const flatItems = useMemo(() => flattenTree(tree, expanded), [tree, expanded]);

  // ─── 拖拽传感器（移动 8px 才触发，避免误触） ───
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // ─── Projection 算法 ───
  const getProjection = useCallback(
    (
      items: TreeNode[],
      activeId: UniqueIdentifier,
      overId: UniqueIdentifier,
      deltaX: number
    ): Projection => {
      const overIndex = items.findIndex(({ id }) => id === overId);
      const activeIndex = items.findIndex(({ id }) => id === activeId);
      const activeItem = items[activeIndex];

      const reordered = arrayMove(items, activeIndex, overIndex);
      const previousItem = reordered[overIndex - 1];
      const nextItem = reordered[overIndex + 1];

      const dragDepth = Math.round(deltaX / INDENT_WIDTH);
      const minDepth = nextItem ? nextItem.depth : 0;
      const maxDepth = previousItem ? previousItem.depth + 1 : 0;
      const depth = Math.min(Math.max(dragDepth + activeItem.depth, minDepth), maxDepth);

      let parentId: string | null = null;
      if (depth > 0 && previousItem) {
        if (previousItem.depth === depth) {
          parentId = previousItem.parentId ?? null;
        } else if (previousItem.depth < depth) {
          parentId = previousItem.id;
        } else {
          let ancestor = previousItem;
          while (ancestor.depth > depth - 1 && ancestor.parentId) {
            const found = items.find(({ id }) => id === ancestor.parentId);
            if (!found) break;
            ancestor = found;
          }
          parentId = ancestor.parentId ?? null;
        }
      }

      return { depth, parentId };
    },
    []
  );

  const projection = useMemo<Projection | null>(() => {
    if (activeId && overId) {
      return getProjection(flatItems, activeId, overId, offsetLeft);
    }
    return null;
  }, [activeId, overId, offsetLeft, flatItems, getProjection]);

  // ─── 拖拽事件 ───
  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(active.id);
    setOverId(active.id);
  };

  const handleDragMove = ({ delta }: DragMoveEvent) => {
    setOffsetLeft(delta.x);
  };

  const handleDragOver = ({ over }: DragOverEvent) => {
    setOverId(over?.id ?? null);
  };

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    setOverId(null);
    setOffsetLeft(0);

    if (!over || active.id === over.id || !projection) return;

    const overIndex = flatItems.findIndex(({ id }) => id === over.id);
    const activeIndex = flatItems.findIndex(({ id }) => id === active.id);
    const reordered = arrayMove(flatItems, activeIndex, overIndex);
    const newIndex = reordered.findIndex(({ id }) => id === active.id);

    const prevSibling = reordered
      .slice(0, newIndex)
      .reverse()
      .find((item) => item.id !== active.id && item.parentId === projection.parentId);
    const nextSibling = reordered
      .slice(newIndex + 1)
      .find((item) => item.id !== active.id && item.parentId === projection.parentId);

    const newOrder = calcOrder(prevSibling?.order, nextSibling?.order);

    try {
      await moveDocument(active.id as string, {
        parentId: projection.parentId,
        order: newOrder,
      });
    } catch {
      // 错误已在 hook 中处理并回滚
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setOverId(null);
    setOffsetLeft(0);
  };

  // ─── 操作处理 ───
  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await deleteDocument(id);
    window.dispatchEvent(new Event('document-updated'));
  };

  const startRename = (node: TreeNode, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingId(node.id);
    setRenameValue(node.title);
  };

  const handleCopyLink = (node: TreeNode, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/spaces/${spaceId}/documents/${node.id}`;
    navigator.clipboard.writeText(url);
    toast.success('链接已复制');
  };

  const activeItem = activeId ? flatItems.find(({ id }) => id === activeId) : null;

  if (loading) {
    return (
      <div className="space-y-0.5 px-1">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex items-center gap-2 h-9 px-2 animate-pulse">
            <div className="w-[18px] h-[18px] rounded bg-gray-100 dark:bg-gray-700 flex-shrink-0" />
            <div className="h-3.5 rounded bg-gray-100 dark:bg-gray-700" style={{ width: `${40 + i * 12}%` }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('', className)}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext items={flatItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-px">
            {flatItems.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center">
                <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-3 ring-1 ring-gray-100 dark:ring-gray-700">
                  <FolderOpen className="w-5 h-5 text-gray-300 dark:text-gray-600" />
                </div>
                <p className="text-sm text-gray-400 dark:text-gray-500 font-medium">还没有文档</p>
                <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">点击上方 + 开始创建</p>
              </div>
            ) : (
              flatItems.map((item) => (
                <SortableTreeItem
                  key={item.id}
                  item={item}
                  spaceId={spaceId}
                  expanded={expanded}
                  renamingId={renamingId}
                  renameValue={renameValue}
                  projection={projection}
                  activeId={activeId}
                  pathname={pathname}
                  onToggle={toggleExpand}
                  onDelete={handleDelete}
                  onStartRename={startRename}
                  onCopyLink={handleCopyLink}
                  setRenamingId={setRenamingId}
                  setRenameValue={setRenameValue}
                  router={router}
                />
              ))
            )}
          </div>
        </SortableContext>

        {/* 拖拽浮动预览 */}
        <DragOverlay dropAnimation={null}>
          {activeItem ? (
            <div
              className="flex items-center h-9 px-3 text-[14.5px] font-medium bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 pointer-events-none"
              style={{ paddingLeft: `${activeItem.depth * INDENT_WIDTH + 10}px` }}
            >
              <GripVertical className="w-3.5 h-3.5 text-blue-400 mr-1.5 flex-shrink-0" />
              <FileText className="w-[18px] h-[18px] text-blue-500 dark:text-blue-400 mr-2 flex-shrink-0" />
              <span className="truncate">{activeItem.title}</span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

// ─── 可排序树节点 ─────────────────────────────────────────

function SortableTreeItem({
  item,
  spaceId,
  expanded,
  renamingId,
  renameValue,
  projection,
  activeId,
  pathname,
  onToggle,
  onDelete,
  onStartRename,
  onCopyLink,
  setRenamingId,
  setRenameValue,
  router,
}: {
  item: TreeNode;
  spaceId: string;
  expanded: Record<string, boolean>;
  renamingId: string | null;
  renameValue: string;
  projection: Projection | null;
  activeId: UniqueIdentifier | null;
  pathname: string;
  onToggle: (id: string, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onStartRename: (node: TreeNode, e: React.MouseEvent) => void;
  onCopyLink: (node: TreeNode, e: React.MouseEvent) => void;
  setRenamingId: (id: string | null) => void;
  setRenameValue: (val: string) => void;
  router: ReturnType<typeof useRouter>;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: item.id,
    animateLayoutChanges: () => false,
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const isActive = activeId === item.id;
  const effectiveDepth = isActive && projection ? projection.depth : item.depth;
  const isCurrentDoc = pathname === `/spaces/${spaceId}/documents/${item.id}`;
  const hasChildren = item.children.length > 0;
  const isExpanded = expanded[item.id];
  const isRenaming = renamingId === item.id;

  const renameInputRef = useRef<HTMLInputElement>(null);

  const handleRenameSubmit = async () => {
    if (!renameValue.trim() || renameValue === item.title) {
      setRenamingId(null);
      return;
    }
    try {
      const { documentService } = await import('@/services/document-service');
      await documentService.updateDocument(item.id, { title: renameValue.trim() });
      window.dispatchEvent(new Event('document-updated'));
      toast.success('重命名成功');
    } catch {
      toast.error('重命名失败');
    }
    setRenamingId(null);
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          if (!isRenaming) router.push(`/spaces/${spaceId}/documents/${item.id}`);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !isRenaming) router.push(`/spaces/${spaceId}/documents/${item.id}`);
        }}
        className={cn(
          'group flex items-center h-9 pr-1.5 text-[14.5px] rounded-lg transition-all duration-150 cursor-pointer select-none',
          isCurrentDoc
            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-semibold'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/40',
          isActive && 'opacity-30'
        )}
        style={{ paddingLeft: `${effectiveDepth * INDENT_WIDTH + 6}px` }}
      >
        {/* 拖拽手柄 — 固定宽度，hover 时显示图标，不影响布局 */}
        <div
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="w-5 h-5 flex items-center justify-center flex-shrink-0 cursor-grab active:cursor-grabbing rounded hover:bg-gray-200 dark:hover:bg-gray-600"
          title="拖拽排序"
          aria-label="拖拽排序"
        >
          <GripVertical className="w-3.5 h-3.5 text-transparent group-hover:text-gray-400 transition-colors" />
        </div>

        {/* 展开/折叠箭头 */}
        {hasChildren ? (
          <button
            onClick={(e) => onToggle(item.id, e)}
            className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-600 flex-shrink-0 transition-colors"
          >
            <ChevronRight className={cn(
              'w-3.5 h-3.5 text-gray-400 dark:text-gray-500 transition-transform duration-200',
              isExpanded && 'rotate-90'
            )} />
          </button>
        ) : (
          <span className="w-1 flex-shrink-0" />
        )}

        {/* 文档图标 — 直接用图标，不加背景方块 */}
        <FileText className={cn(
          'w-[18px] h-[18px] mr-2 flex-shrink-0',
          isCurrentDoc
            ? 'text-blue-500 dark:text-blue-400'
            : 'text-gray-400 dark:text-gray-500'
        )} />

        {/* 标题 / 重命名输入框 */}
        {isRenaming ? (
          <input
            ref={renameInputRef}
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameSubmit();
              if (e.key === 'Escape') setRenamingId(null);
              e.stopPropagation();
            }}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 bg-transparent outline-none border-b-2 border-blue-400 text-[14.5px] text-gray-900 dark:text-gray-100 min-w-0"
          />
        ) : (
          <span className="truncate flex-1 min-w-0">{item.title}</span>
        )}

        {/* Hover 操作按钮 — 只显示一个更多按钮，减少遮挡 */}
        {!isRenaming && (
          <div className="hidden group-hover:flex items-center flex-shrink-0 ml-auto pl-1">
            <button
              onClick={(e) => onCopyLink(item, e)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="复制链接"
              aria-label="复制链接"
            >
              <Link2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => onStartRename(item, e)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="重命名"
              aria-label="重命名"
            >
              <PenLine className="w-3.5 h-3.5" />
            </button>
            <AlertDialog.Root>
              <AlertDialog.Trigger>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                  title="移至回收站"
                  aria-label="移至回收站"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </AlertDialog.Trigger>
              <AlertDialog.Content maxWidth="450px" onClick={(e) => e.stopPropagation()}>
                <AlertDialog.Title>移至回收站</AlertDialog.Title>
                <AlertDialog.Description size="2">
                  确定要将文档 <span className="font-semibold text-gray-900 dark:text-gray-100">{item.title}</span> 移至回收站吗？你可以随时从回收站恢复。
                </AlertDialog.Description>
                <Flex gap="3" mt="4" justify="end">
                  <AlertDialog.Cancel>
                    <Button variant="soft" color="gray" onClick={(e) => e.stopPropagation()}>
                      取消
                    </Button>
                  </AlertDialog.Cancel>
                  <AlertDialog.Action>
                    <Button variant="solid" color="red" onClick={(e) => onDelete(item.id, e)}>
                      移至回收站
                    </Button>
                  </AlertDialog.Action>
                </Flex>
              </AlertDialog.Content>
            </AlertDialog.Root>
          </div>
        )}
      </div>
    </div>
  );
}
