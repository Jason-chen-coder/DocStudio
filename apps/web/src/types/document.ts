export enum DocumentType {
  GROUP = 'GROUP',
  PAGE = 'PAGE',
}

export interface Document {
  id: string;
  title: string;
  content?: string; // Content might not be fetched in list view
  spaceId: string;
  parentId?: string | null;
  order: number;
  ydocKey?: string | null; // Yjs collaboration room key (Stage 4)
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  children?: Document[]; // For tree structure
  creator?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}


export interface CreateDocumentDto {
  title: string;
  content?: string;
  parentId?: string;
  spaceId: string; // Needed for creation
}

export interface UpdateDocumentDto {
  title?: string;
  content?: string;
  parentId?: string | null; // For moving
  order?: number; // For reordering
}

export interface MoveDocumentDto {
  parentId: string | null; // null = 移到根节点
  order: number;           // 小数位法计算后的新 order 值
}

export interface DocumentSnapshot {
  id: string;
  docId: string;
  content: string; // Tiptap JSON content
  message?: string | null;
  createdBy: string;
  createdAt: string;
  creator?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}
