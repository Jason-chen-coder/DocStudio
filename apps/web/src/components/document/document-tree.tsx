'use client';

import { useState, useMemo } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { 
  ChevronRight, 
  ChevronDown, 
  FileText, 
  Plus, 
  Trash2 
} from 'lucide-react';
import { useDocuments } from '@/hooks/use-documents';
import { Document } from '@/types/document';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TreeNode extends Document {
  children: TreeNode[];
}

function buildTree(documents: Document[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  // 1. Initialize map
  documents.forEach((doc) => {
    map.set(doc.id, { ...doc, children: [] });
  });

  // 2. Build tree
  documents.forEach((doc) => {
    const node = map.get(doc.id)!;
    if (doc.parentId && map.has(doc.parentId)) {
      map.get(doc.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  // 3. Sort by specific order if needed (currently backend handles simple order, or just by createdAt)
  // We can sort roots and children here if backend doesn't return sorted.
  // backend service added 'order' field.
  const sortFn = (a: TreeNode, b: TreeNode) => a.order - b.order;
  
  const sortRecursive = (nodes: TreeNode[]) => {
    nodes.sort(sortFn);
    nodes.forEach(n => sortRecursive(n.children));
  };

  sortRecursive(roots);
  return roots;
}

export function DocumentTree({ spaceId, className }: { spaceId: string; className?: string }) {
  const { documents, loading, createDocument, deleteDocument } = useDocuments(spaceId);
  const pathname = usePathname();
  const router = useRouter();
  
  const tree = useMemo(() => buildTree(documents), [documents]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreate = async (parentId?: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const newDoc = await createDocument({
        title: '无标题文档',
        spaceId,
        parentId,
      });
      // Expand parent if it exists
      if (parentId) {
        setExpanded(prev => ({ ...prev, [parentId]: true }));
      }
      // Navigate to new doc
      router.push(`/spaces/${spaceId}/documents/${newDoc.id}`);
    } catch {
      // toast handled in hook
    }
  };

  if (loading) {
    return <div className="p-4 text-sm text-gray-400 animate-pulse">加载文档中...</div>;
  }

  return (
    <div className={cn("py-2", className)}>
      <div className="flex items-center justify-between px-4 mb-2">
        <span className="text-xs font-semibold text-gray-500 uppercase">文档</span>
        <button 
          onClick={() => handleCreate()}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition"
          title="新建文档"
        >
          <Plus className="w-4 h-4 text-gray-500" />
        </button>
      </div>
      
      <div className="space-y-0.5">
        {tree.length === 0 ? (
          <div className="px-4 text-sm text-gray-400 py-2">暂无文档</div>
        ) : (
          tree.map(node => (
            <TreeItem 
              key={node.id} 
              node={node} 
              level={0} 
              expanded={expanded} 
              onToggle={toggleExpand}
              activeFromPath={pathname}
              onCreate={handleCreate}
              onDelete={deleteDocument}
              spaceId={spaceId}
              router={router}
            />
          ))
        )}
      </div>
    </div>
  );
}

function TreeItem({ 
  node, 
  level, 
  expanded, 
  onToggle, 
  activeFromPath,
  onDelete,
  spaceId,
  router
}: { 
  node: TreeNode; 
  level: number; 
  expanded: Record<string, boolean>;
  onToggle: (id: string, e: React.MouseEvent) => void;
  activeFromPath: string;
  onDelete: (id: string) => void;
  spaceId: string;
  router: any;
}) {
  const hasChildren = node.children.length > 0;
  const isExpanded = expanded[node.id];
  const isActive = activeFromPath === `/spaces/${spaceId}/documents/${node.id}`;

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('确定要删除此文档吗？')) {
        await onDelete(node.id);
    }
  };

  return (
    <div>
      <div 
        role="button"
        onClick={() => router.push(`/spaces/${spaceId}/documents/${node.id}`)}
        className={cn(
          "group flex items-center py-1 pr-2 text-sm text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative cursor-pointer",
          isActive && "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
        )}
        style={{ paddingLeft: `${level * 12 + 12}px` }}
      >
        <button
          onClick={(e) => {
              e.stopPropagation();
              onToggle(node.id, e);
          }}
          className={cn(
            "p-0.5 rounded-sm hover:bg-gray-200 dark:hover:bg-gray-600 mr-1 transition-colors",
            !hasChildren && "opacity-0 hover:opacity-100"
          )}
        >
            <div className={cn("w-4 h-4 flex items-center justify-center")}>
             {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
           </div>
        </button>
        
        <FileText className="w-4 h-4 mr-2 opacity-70" />
        
        <span className="truncate flex-1">{node.title}</span>

        <div className="hidden group-hover:flex items-center gap-1 absolute right-2 bg-gray-100 dark:bg-gray-700 px-1 rounded shadow-sm">

           <button 
             onClick={handleDelete}
             className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-red-500"
             title="删除"
           >
             <Trash2 className="w-3 h-3" />
           </button>
        </div>
      </div>

      {isExpanded && node.children.map(child => (
        <TreeItem 
            key={child.id} 
            node={child} 
            level={level + 1} 
            expanded={expanded} 
            onToggle={onToggle}
            activeFromPath={activeFromPath}
            onDelete={onDelete}
            spaceId={spaceId}
            router={router}
        />
      ))}
    </div>
  );
}
